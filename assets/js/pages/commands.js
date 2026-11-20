/**
 * Command line page: a typed command drill for an exam that has the tool ("commandUnits" in
 * data/exams.json, or, on the teacher's ?drafts=1 look before launch, a listed command pack).
 * docs/COMMAND-LINE-PLAN.md sections 6, 7, and 14.
 *  1. Setup: the units the tool lists, each with its count, how many commands, and Extra
 *     commands (Coming soon until a pack marked "set": "extra" has commands). A drill in progress
 *     and the last drill show as banners, each with the two-click minus.
 *  2. Command: the task, then a terminal box for the system it names, with one live field. A
 *     right line prints the output of its answer group. A wrong command or the right command with
 *     wrong details uses one of two tries; a slip uses none (the matcher, command-match.js, says
 *     which). Two counted misses, or Show answer, print the answer and its output. Under Run, the
 *     Command bank (commands/bank.json, command-bank.js) lists the commands of the task's system
 *     with their switches, closed until opened. Opening it uses no try, but a right line after it
 *     reads Correct with bank, and the command comes back in Retry missed.
 *  3. Question: when the version shown has a follow-up, that published practice question is asked
 *     under the output, whichever right line was typed, and after a missed command too. The
 *     command's reading waits until the question is checked.
 *  4. Results: commands right, right on the first try, right with the bank, questions right, and a
 *     review card for each command (Right, Missed, Question missed, or Not answered, and With bank),
 *     with Retry missed.
 * The drill is saved on this device after every counted try, every end of a command, and every
 * checked question, and graded again from what was typed when the page loads, so a reload shows
 * the same thing. A version of the output is picked once per command and saved by its id. Nothing
 * is written to the practice test's history or its streak: the page never imports that module.
 * boot.js picks the exam, or sends the browser to the home page for an exam without the tool,
 * before any pack loads.
 */
import { bootExamPage, fetchJSON, includePrivatePacks, showFatal, queryFlag, pageUrl, showTestContentBanner } from '../lib/boot.js';
import { commandState, loadCommandPacks, commandsFromPacks, commandUnits, isPlaceholderPack } from '../lib/content.js';
import { h, mount, append, icon, announce, plural, isTypingTarget, numberWord } from '../lib/dom.js';
import { buildSelectionTree, itemIdsForLeaves, ancestorAtDepth, tagChips } from '../lib/taxonomy.js';
import { shuffle } from '../lib/random.js';
import * as store from '../lib/storage.js';
import { matchLine, buildContext, specFromItem, wordsFor, SYSTEMS } from '../lib/command-match.js';
import { printableVersions, versionById, outputText, followUpOf, drawWeight, isExtra } from '../lib/command-items.js';
import {
  usableCommands, drawIds, pickVersion, gradeAnswer, gradePick, newChoiceOrder, keptChoiceOrder, MAX_TRIES, MAX_TYPED,
} from '../lib/command-drill.js';
import { createTreePicker } from '../components/tree-picker.js';
import { discardButton } from '../components/discard-button.js';
import { segmented } from '../components/segmented.js';
import { LETTERS, choiceMark, referenceBlock } from '../components/question-review.js';
import { touchOnly, commandField, promptText, missEntry, noteLine, terminalBox, endedBody } from '../components/command-terminal.js';
import { firstLine, commandFacts, reviewCard } from '../components/command-review.js';
import { loadCommandBank, bankEntries, entriesFor, isPlaceholderBank } from '../lib/command-bank.js';
import { initThemeToggle } from '../lib/theme.js';

initThemeToggle();

// A page brought back by the Back button still holds its old drill in memory. Load it fresh, so
// it never writes an old copy over newer answers.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) window.location.reload();
});

const PRESETS = [5, 10];
// A second Run, Show answer, Check, or Next this soon after the one before does nothing, so a held
// Enter key cannot run a line twice or skip past an output.
const GUARD_MS = 400;
// The Command bank's layout, inline so that site.css (shared by every page) does not change: each
// switch beside its words, the switch column as wide as the longest switch, at most 45% of the bank.
const BANK_PANEL = { marginTop: '1rem' };
// The toggle's row is about 44px tall, a full tap on a phone.
const BANK_SUMMARY = { padding: '0.6rem 0' };
const BANK_LIST = { listStyle: 'none', margin: '0', padding: '0' };
const BANK_NEXT = { marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border)' };
const BANK_ROWS = { display: 'grid', gridTemplateColumns: 'fit-content(45%) minmax(0, 1fr)', gap: '0.3rem 0.75rem', margin: '0.5rem 0 0' };

const ctx = await bootExamPage('commands');
if (ctx) await start(ctx);

async function start(ctx) {
  const app = document.getElementById('app');
  const examId = ctx.exam.id;
  let packs;
  try {
    const state = await commandState(fetchJSON, ctx.exam, { includePrivate: includePrivatePacks(), preview: ctx.showDrafts });
    packs = state === 'ready' ? await loadCommandPacks(fetchJSON, ctx.exam, { includePrivate: includePrivatePacks() }) : [];
  } catch (error) {
    // Names the manifest or pack that could not be read.
    showFatal(error);
    return;
  }
  // The command bank, asked for only when there are commands to show it under, in a try of its
  // own: it is optional, so a bank that cannot be read never stops the drill. No file, or a read
  // that fails (GitHub Pages can answer a missing file with 503 instead of 404), leaves every
  // system's Command bank reading Coming soon. The content check refuses a bank that is not valid
  // JSON, so a broken bank is never published.
  let bank = null;
  if (packs.length) {
    try {
      bank = await loadCommandBank(fetchJSON, ctx.exam);
    } catch (error) {
      console.warn(error);
    }
  }
  // The Test content banner, worked out once from every pack this page loaded: the flashcard and
  // question packs (boot.js hands back its answer for them), the command packs, and the bank.
  showTestContentBanner(ctx.placeholderContent || packs.some(isPlaceholderPack) || isPlaceholderBank(bank));
  const bankList = bankEntries(bank);

  const loaded = commandsFromPacks(packs);
  // What the matcher knows about the whole exam (a command the tool asks elsewhere reads Wrong
  // command), from every command the packs hold, as the content check builds it.
  const matchCtx = buildContext(loaded.filter((command) => SYSTEMS.includes(command.system)).map(specFromItem));
  const commands = usableCommands(loaded, ctx, { showDrafts: ctx.showDrafts });
  const byId = new Map(commands.map((command) => [command.id, command]));
  const weightOf = new Map(commands.map((command) => [command.id, drawWeight(command, ctx.questionById).weight]));

  // The units commandUnits names, in outline order. On the teacher's look at an exam without the
  // field, the units that have commands.
  const listed = commandUnits(ctx.exam);
  const withCommands = new Set();
  for (const command of commands) {
    for (const tag of command.units) {
      const unit = ancestorAtDepth(ctx.unitIndex, tag, 1);
      if (unit) withCommands.add(unit.id);
    }
  }
  const roots = ctx.unitRoots.filter((root) => (listed ? listed.includes(root.id) : withCommands.has(root.id)));

  const setupKey = `commands-setup:${examId}`;
  const runKey = `commands-run:${examId}`;
  const seenKey = `commands-seen:${examId}`;
  const extraCount = commands.filter(isExtra).length;
  const savedSetup = store.load(setupKey, null);
  const setup = {
    count: clampInt(savedSetup && savedSetup.count, 1, 1000, 10),
    // Extra commands join the draw only when the student checks the box, and only while there are some.
    extra: Boolean(savedSetup && savedSetup.extra === true) && extraCount > 0,
    selected: new Set(),
  };
  // Each unit is one row (a leaf) with the count of the commands in the draw: the launch set, and
  // the extra set too while Extra commands is checked.
  const buildTree = () => buildSelectionTree(roots, commands.filter((command) => setup.extra || !isExtra(command)), (command) => command.units, { maxDepth: 1 });
  let tree = buildTree();
  // Coming soon when no unit has a command, the extra set included.
  const everyCommand = buildSelectionTree(roots, commands, (command) => command.units, { maxDepth: 1 });
  if (![...everyCommand.leaves.values()].some((leaf) => leaf.total > 0)) {
    comingSoon();
    return;
  }
  // First visit: every unit that has commands in the draw is checked.
  if (savedSetup && Array.isArray(savedSetup.units)) {
    for (const id of savedSetup.units) if (tree.leaves.has(id)) setup.selected.add(id);
  } else {
    for (const leaf of tree.leaves.values()) if (leaf.total > 0) setup.selected.add(leaf.id);
  }
  const saveSetup = () => store.save(setupKey, { units: [...setup.selected], count: setup.count, extra: setup.extra });
  const poolIds = () => [...itemIdsForLeaves(tree, setup.selected)];

  // The version last shown for each command on this device, kept apart from the drill so it
  // outlives it. A new drill shows another version when there is one.
  const allById = new Map(loaded.map((command) => [command.id, command]));
  const seen = new Map();
  const savedSeen = store.load(seenKey, null);
  if (savedSeen && typeof savedSeen === 'object' && !Array.isArray(savedSeen)) {
    for (const [id, version] of Object.entries(savedSeen)) {
      const command = allById.get(id);
      if (command && typeof version === 'string' && versionById(command, version)) seen.set(id, version);
    }
  }
  const saveSeen = () => store.save(seenKey, Object.fromEntries(seen));

  let run = loadRun();
  const saveRun = () => (run ? store.save(runKey, run) : store.remove(runKey));

  // Run, Show answer, Check, and Next share one guard (GUARD_MS).
  let lastAction = 0;
  const guard = () => {
    const now = Date.now();
    if (now - lastAction < GUARD_MS) return false;
    lastAction = now;
    return true;
  };

  // "resume=1" in the address during a drill sends a reload straight back into it, or to its
  // results once it has ended.
  if (run && queryFlag('resume')) {
    if (run.finished) renderResults();
    else renderCommand({ opened: true });
  } else {
    renderSetup();
  }

  /* ------------------------------------------------------------------ */
  /* Saved drill                                                         */
  /* ------------------------------------------------------------------ */

  function loadRun() {
    const saved = store.load(runKey, null);
    if (saved === null) return null;
    const checked = checkRun(saved, true);
    if (!checked) store.remove(runKey);
    return checked;
  }

  /**
   * A saved drill is kept only when the page understands all of it: every command it names is
   * still shown, and every version it saved is still one the page can print. Anything else drops
   * the drill. It is never repaired. A follow-up's saved choice order keeps the choices that
   * still exist and adds new ones, and its saved pick keeps the choices that still exist, as on
   * the practice page.
   */
  function checkRun(saved, outer) {
    if (!isObject(saved) || saved.version !== 1 || saved.examId !== examId) return null;
    const ids = saved.ids;
    if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length) return null;
    if (!ids.every((id) => typeof id === 'string' && byId.has(id))) return null;
    if (!isObject(saved.answers)) return null;
    const answers = {};
    for (const [id, answer] of Object.entries(saved.answers)) {
      if (!ids.includes(id) || !isObject(answer)) return null;
      if (!Array.isArray(answer.lines) || !answer.lines.every((line) => typeof line === 'string')) return null;
      const command = byId.get(id);
      const kept = { lines: answer.lines.map((line) => line.substring(0, MAX_TYPED)), shown: answer.shown === true };
      // Saved once the Command bank was opened on this command. Anything but true is left out.
      if (answer.bank === true) kept.bank = true;
      if (answer.version !== undefined) {
        if (!printableVersions(command, ctx.questionById).some((version) => version.id === answer.version)) return null;
        kept.version = answer.version;
        const question = followUpOf(versionById(command, answer.version), ctx.questionById);
        if (question && isObject(answer.fu)) {
          const picked = answer.fu.picked;
          if (picked !== null && picked !== undefined && !(Array.isArray(picked) && picked.every((cid) => typeof cid === 'string'))) return null;
          const order = keptChoiceOrder(question, answer.fu.order);
          kept.fu = { order, picked: Array.isArray(picked) ? picked.filter((cid) => order.includes(cid)) : null };
        } else if (question) {
          kept.fu = { order: newChoiceOrder(question), picked: null };
        }
      }
      answers[id] = kept;
    }
    return {
      version: 1,
      examId,
      retry: saved.retry === true,
      // Only one level is kept: the finished drill a retry came from.
      before: outer && saved.before ? checkRun(saved.before, false) : null,
      ids,
      index: clampInt(saved.index, 0, ids.length - 1, 0),
      answers,
      startedAt: typeof saved.startedAt === 'string' ? saved.startedAt : null,
      finished: saved.finished === true,
      finishedAt: typeof saved.finishedAt === 'string' ? saved.finishedAt : null,
    };
  }

  /**
   * How one command of a drill stands, graded again from what was typed: its graded answer, the
   * version shown, the follow-up asked and how it was answered (gradePick), and its tag in the
   * review: 'right', 'missed', 'question' (the command was right and its question missed), or
   * 'none' (not answered: the drill ended first). A follow-up not checked yet leaves the tag to
   * the command. withBank: the command was right after the Command bank was opened on it
   * (Correct with bank), whatever its tag.
   */
  function outcomeOf(drill, id) {
    const command = byId.get(id);
    const answer = drill.answers[id];
    const graded = gradeAnswer(command, answer, matchCtx);
    const version = answer && answer.version ? versionById(command, answer.version) : null;
    const question = graded.state !== 'open' && version && answer.fu ? followUpOf(version, ctx.questionById) : null;
    const pick = question ? gradePick(question, answer.fu.picked) : 'none';
    let status = 'none';
    if (graded.state === 'missed') status = 'missed';
    else if (graded.state === 'right') status = pick === 'missed' ? 'question' : 'right';
    const withBank = graded.state === 'right' && Boolean(answer) && answer.bank === true;
    return { command, answer, graded, version, question, pick, status, withBank };
  }

  /**
   * A drill's numbers: commands right and missed, right on the first try (never with the bank),
   * right with the bank, follow-ups checked and right, and the commands Retry missed takes
   * (Missed, Question missed, and right with the bank), in drill order.
   */
  function tallyRun(drill) {
    const tally = { right: 0, missed: 0, done: 0, firstTry: 0, withBank: 0, questions: 0, questionsRight: 0, retryIds: [] };
    for (const id of drill.ids) {
      const outcome = outcomeOf(drill, id);
      if (outcome.graded.state === 'right') {
        tally.right += 1;
        if (outcome.withBank) tally.withBank += 1;
        else if (outcome.graded.tries === 1) tally.firstTry += 1;
      } else if (outcome.graded.state === 'missed') {
        tally.missed += 1;
      }
      if (outcome.pick !== 'none') {
        tally.questions += 1;
        if (outcome.pick === 'right') tally.questionsRight += 1;
      }
      if (outcome.status === 'missed' || outcome.status === 'question' || outcome.withBank) tally.retryIds.push(id);
    }
    tally.done = tally.right + tally.missed;
    return tally;
  }

  function setResumeAddress() {
    window.history.replaceState(window.history.state, '', pageUrl('commands.html', examId, { resume: '1' }));
  }

  /* ------------------------------------------------------------------ */
  /* Setup                                                               */
  /* ------------------------------------------------------------------ */

  function comingSoon() {
    mount(app,
      h('div', { class: 'wrap' },
        h('div', { class: 'page-head' }, h('h1', null, 'Command line')),
        h('div', { class: 'notice' }, 'Coming soon'),
      ),
    );
  }

  function renderSetup({ focusHeading = false } = {}) {
    // The setup screen keeps no resume=1 in the address, so a reload stays on it.
    if (new URLSearchParams(window.location.search).has('resume')) {
      window.history.replaceState(window.history.state, '', pageUrl('commands.html', examId));
    }
    const availableText = h('p', { class: 'muted small', role: 'status', style: { margin: '0.6rem 0 0.9rem' } });
    const presetBox = h('div', { class: 'count-presets', role: 'group', 'aria-label': 'Quick picks' });
    const startButton = h('button', { type: 'button', class: 'btn btn-primary btn-lg start-inline', style: { width: '100%' } }, 'Start');
    // Phones and tablets: Start is docked to the bottom of the screen instead (CSS hides
    // .start-inline there), so it is in reach under the unit list.
    const barText = h('span', { class: 'action-bar-text' });
    const barStart = h('button', { type: 'button', class: 'btn btn-primary btn-lg' }, 'Start');

    const update = () => {
      const available = poolIds().length;
      const effective = Math.min(setup.count, available);
      availableText.textContent = `${available} available`;
      startButton.disabled = available === 0;
      startButton.textContent = available === 0 ? 'Select a unit' : `Start ${plural(effective, 'command')}`;
      barStart.disabled = available === 0;
      barStart.textContent = available === 0 ? 'Start' : `Start ${plural(effective, 'command')}`;
      barText.textContent = available === 0 ? 'Select a unit' : `${available} available`;
      const picks = [...new Set([...PRESETS.filter((n) => n < available), available])].filter((n) => n > 0);
      mount(presetBox, picks.map((n) => {
        const active = n === effective;
        const button = h('button', { type: 'button', class: `btn btn-sm${active ? ' btn-primary' : ''}`, 'aria-pressed': String(active) },
          n === available && !PRESETS.includes(n) ? `All (${n})` : String(n));
        button.addEventListener('click', () => {
          setup.count = n;
          saveSetup();
          update();
          // update() rebuilt the buttons; keep keyboard focus on the one just chosen.
          const pressed = presetBox.querySelector('button[aria-pressed="true"]');
          if (pressed) pressed.focus();
        });
        return button;
      }));
    };

    const picker = createTreePicker({
      tree,
      selected: setup.selected,
      itemNoun: 'command',
      onChange: () => {
        saveSetup();
        update();
      },
    });

    // Extra commands: a check box row with the extra set's count, worked out from the packs. While
    // no pack marked "set": "extra" has commands it is greyed, with a Coming soon chip. Checking it
    // counts the extra commands in each unit, so the setup is drawn again.
    const extraBox = h('input', { type: 'checkbox', id: 'extra-commands', checked: setup.extra, disabled: extraCount === 0 });
    extraBox.addEventListener('change', () => {
      setup.extra = extraBox.checked;
      saveSetup();
      tree = buildTree();
      renderSetup();
      const box = document.getElementById('extra-commands');
      if (box) box.focus();
    });
    const extraRow = h('div', { class: `row cl-extra${extraCount ? '' : ' is-empty'}` },
      h('label', { class: 'inline' }, extraBox, extraCount ? `Extra commands (${extraCount})` : 'Extra commands'),
      extraCount ? null : h('span', { class: 'chip' }, 'Coming soon'),
    );

    const begin = () => {
      const ids = poolIds();
      if (!ids.length) return;
      if (run && !run.finished && Object.keys(run.answers).length > 0
        && !window.confirm('Start a new drill? The drill in progress will be lost.')) return;
      startRun(drawIds(ids.map((id) => ({ id, weight: weightOf.get(id) })), Math.min(setup.count, ids.length)));
    };
    startButton.addEventListener('click', begin);
    barStart.addEventListener('click', begin);

    mount(app,
      h('div', { class: 'wrap' },
        h('div', { class: 'page-head' }, h('h1', { id: 'setup-heading', tabindex: '-1' }, 'Command line')),
        banner(),
        h('div', { class: 'setup-grid' },
          h('section', { class: 'panel', 'aria-labelledby': 'pick-heading' },
            h('div', { class: 'panel-title' }, h('h2', { id: 'pick-heading' }, 'Units')),
            picker.element,
          ),
          h('aside', { class: 'setup-side' },
            h('section', { class: 'panel', 'aria-labelledby': 'count-heading' },
              h('h2', { id: 'count-heading' }, 'Commands'),
              presetBox,
              extraRow,
              availableText,
              startButton,
            ),
          ),
        ),
        h('div', { class: 'action-bar only-narrow', role: 'region', 'aria-label': 'Start the drill' },
          h('div', { class: 'action-bar-inner' }, barText, barStart),
        ),
      ),
    );
    update();
    if (focusHeading) {
      window.scrollTo({ top: 0 });
      const heading = document.getElementById('setup-heading');
      if (heading) heading.focus({ preventScroll: true });
    }
  }

  function focusSetupHeading() {
    const heading = document.getElementById('setup-heading');
    if (heading) heading.focus({ preventScroll: true });
  }

  function banner() {
    if (!run) return null;
    const tally = tallyRun(run);
    if (!run.finished) {
      const resume = h('button', { type: 'button', class: 'btn btn-primary btn-sm' }, 'Resume');
      resume.addEventListener('click', () => {
        setResumeAddress();
        renderCommand({ opened: true });
      });
      // The two-click minus, as on the home card: the first click turns it red, a second click
      // discards the drill.
      const discard = discardButton({ what: 'drill in progress', className: 'discard-btn' }, () => {
        run = null;
        saveRun();
        node.remove();
        focusSetupHeading();
        announce('Drill discarded.');
      });
      const node = h('div', { class: 'notice', role: 'status', style: { marginBottom: '1rem' } },
        h('div', { class: 'row spread' },
          h('span', null, h('strong', null, 'Drill in progress: '), `${tally.done} of ${run.ids.length} done`),
          h('span', { class: 'row' }, resume, discard),
        ),
      );
      return node;
    }
    // The last drill, kept with what was typed until this minus or the next drill replaces it.
    const view = h('button', { type: 'button', class: 'btn btn-sm' }, 'Results');
    view.addEventListener('click', () => {
      setResumeAddress();
      renderResults();
    });
    const dismiss = discardButton({ verb: 'Dismiss', what: 'last drill', className: 'discard-btn' }, () => {
      run = null;
      saveRun();
      node.remove();
      focusSetupHeading();
      announce('Last drill dismissed.');
    });
    const node = h('div', { class: 'notice', style: { marginBottom: '1rem' } },
      h('div', { class: 'row spread' },
        h('span', null, h('strong', null, 'Last drill: '), `${tally.right} of ${tally.done} correct`),
        h('span', { class: 'row' }, view, dismiss),
      ),
    );
    return node;
  }

  /* ------------------------------------------------------------------ */
  /* Drill                                                               */
  /* ------------------------------------------------------------------ */

  /**
   * `retry` marks a drill of the commands missed in the drill before, and `before` is that
   * finished drill, kept so that quitting the retry goes back to its results.
   */
  function startRun(ids, { retry = false, before = null } = {}) {
    run = {
      version: 1,
      examId,
      retry,
      before: before ? { ...before, before: null } : null,
      ids,
      index: 0,
      answers: {},
      startedAt: new Date().toISOString(),
      finished: false,
      finishedAt: null,
    };
    saveRun();
    // Reloading the page during the drill (phones do this on their own) goes straight back to it.
    setResumeAddress();
    renderCommand({ opened: true });
  }

  /**
   * The command screen, drawn from the saved drill. While the command is open the box holds one
   * live field, which is never redrawn between tries: a try adds to the box in place. When the
   * command ends the whole screen is drawn again from what was saved, so a reload shows the same,
   * and again when its follow-up question is checked.
   * `opened`: the command was just opened (Start, Next, Resume, a reload). `ended`: it just ended.
   * `checked`: its follow-up question was just checked.
   */
  function renderCommand({ opened = false, ended = false, checked: justChecked = false } = {}) {
    const index = run.index;
    const id = run.ids[index];
    const command = byId.get(id);
    const system = command.system;
    const graded = gradeAnswer(command, run.answers[id], matchCtx);
    const tally = tallyRun(run);
    const total = run.ids.length;
    const taskId = `task-${index}`;
    const sysId = `sys-${index}`;
    // A handler from a screen that has been replaced does nothing.
    const stale = () => !run || run.index !== index || run.ids[index] !== id || !app.contains(screen);

    const endButton = h('button', { type: 'button', class: 'btn btn-sm btn-ghost' }, tally.done ? 'End drill' : 'Quit');
    endButton.addEventListener('click', () => {
      if (stale()) return;
      if (tallyRun(run).done > 0) {
        finish();
        return;
      }
      // Quitting a retry drill before a command has ended goes back to the results it came from.
      if (run.before && run.before.finished) {
        run = run.before;
        saveRun();
        renderResults();
        return;
      }
      run = null;
      saveRun();
      renderSetup({ focusHeading: true });
    });

    const top = h('div', { class: 'page-head', id: 'command-top', style: { paddingBottom: 0 } },
      h('div', { class: 'quiz-top' },
        h('span', { class: 'row' },
          h('strong', null, `Command ${index + 1} of ${total}`),
          run.retry ? h('span', { class: 'chip chip-accent' }, 'Missed commands') : null,
        ),
        h('span', { class: 'quiz-score', role: 'img', 'aria-label': `${tally.right} correct, ${tally.missed} incorrect` },
          h('span', { class: 'ok' }, icon('check'), String(tally.right)),
          h('span', { class: 'no' }, icon('x'), String(tally.missed)),
        ),
        endButton,
      ),
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(tally.done), 'aria-label': 'Commands done' },
        h('span', { style: { width: `${(tally.done / total) * 100}%` } })),
    );

    const task = h('p', { class: 'q-stem', id: taskId, tabindex: '-1' }, command.task);
    const article = h('article', { class: 'cl-cmd', 'aria-labelledby': taskId },
      h('div', { class: 'q-meta' }, command.status === 'draft' ? h('span', { class: 'badge' }, 'Draft') : null),
      task,
    );
    const screen = h('div', { class: 'wrap cl-screen' }, top, article);

    if (graded.state === 'open') {
      const field = commandField(`field-${index}`, `${taskId} ${sysId}`);
      const log = h('div', { class: 'cl-term-log' }, graded.steps.map((step, i) => missEntry(system, step, MAX_TRIES - i - 1)));
      // The one result that used no try. A new Run replaces it.
      const slot = h('div', { class: 'cl-term-slot' });
      const body = h('div', { class: 'cl-term-body' }, log, slot, h('div', { class: 'cl-term-line' }, promptText(system, true), field));
      const showAnswer = h('button', { type: 'button', class: 'btn btn-sm btn-ghost' }, 'Show answer');
      const runButton = h('button', { type: 'submit', class: 'btn btn-primary btn-lg' }, 'Run');
      const form = h('form', { class: 'cl-form', novalidate: true, autocomplete: 'off' },
        terminalBox({ system, labelId: sysId, action: showAnswer, body }),
        h('div', { class: 'quiz-actions' }, runButton),
      );
      append(article, [form, bankBlock({ system, id, index, stale })]);

      // A tap anywhere in the box body puts the cursor in the field inside that tap, which is
      // what an iPhone needs to open its keyboard. The title strip is outside the body.
      body.addEventListener('click', (event) => {
        if (event.target !== field) field.focus();
      });
      // Run takes no focus on a tap, so a phone keyboard does not close and open again.
      runButton.addEventListener('mousedown', (event) => event.preventDefault());
      // A held Enter repeats the key: only the first press runs the line.
      field.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && event.repeat) event.preventDefault();
      });
      // Enter, a phone's Go key, and Run all submit the form. No key codes are read.
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        runLine();
      });
      showAnswer.addEventListener('click', () => {
        if (stale() || !guard()) return;
        endCommand(id, { shown: true });
      });

      const runLine = () => {
        if (stale() || !guard()) return;
        const typed = field.value;
        const result = matchLine(command, typed, matchCtx);
        const words = wordsFor(result);
        if (result.code === 'empty') {
          field.focus();
          return;
        }
        if (result.code === 'accepted') {
          saveLine(id, typed);
          endCommand(id);
          return;
        }
        if (result.counts) {
          saveLine(id, typed);
          const now = gradeAnswer(command, run.answers[id], matchCtx);
          if (now.state !== 'open') {
            endCommand(id);
            return;
          }
          const left = MAX_TRIES - now.tries;
          mount(slot);
          append(log, missEntry(system, { typed, result }, left));
          if (!result.keepLine) field.value = '';
          keepTyping(field);
          announce(`${spokenLabel(words)} ${plural(left, 'try', 'tries')} left.`);
          return;
        }
        // A slip, or a line the tool does not take: no try is used, and nothing is saved.
        mount(slot, noteLine(words.label));
        if (!result.keepLine) field.value = '';
        keepTyping(field);
        announce(`${words.label}. No try used.`);
      };

      mount(app, screen);
      if (opened) openScroll();
      // With a keyboard the cursor is in the field. On a touch screen nothing opens the keyboard
      // until a tap: focus goes to the task, as on the practice page.
      if (touchOnly()) task.focus({ preventScroll: true });
      else field.focus({ preventScroll: true });
      return;
    }

    // The command has ended. Its version was picked when it ended (an answer graded again after a
    // pack edit may end without one: it is picked now).
    const answer = run.answers[id];
    if (!answer.version) {
      chooseVersion(command, answer);
      saveRun();
    }
    const version = versionById(command, answer.version);
    const right = graded.state === 'right';
    // The box as it stood, then the line that printed (the right line as typed, or Answer and the
    // answer), its output, and the next prompt.
    const { body, printed } = endedBody(system, graded, {
      answer: firstLine(command),
      output: outputText(command, version, right ? graded.group : 0, ctx.questionById),
    });
    // The version's follow-up question, asked under the output whichever right line was typed, and
    // after a missed command too. The command's reading waits until the question is checked.
    const question = answer.fu ? followUpOf(version, ctx.questionById) : null;
    const checked = Boolean(question) && Array.isArray(answer.fu.picked);
    const followUp = question ? followUpBlock({ index, question, fu: answer.fu, stale: () => stale() }) : null;

    // Right after the Command bank was opened reads Correct with bank, on any try.
    const head = right
      ? (answer.bank === true ? 'Correct with bank' : graded.tries > 1 ? `Correct on try ${graded.tries}` : 'Correct')
      : 'Incorrect';
    const feedbackHead = h('div', { class: 'feedback-head' }, icon(right ? 'check' : 'x'), head);
    const isLast = index >= total - 1;
    const next = h('button', { type: 'button', class: 'btn btn-primary btn-lg' }, isLast ? 'Results' : 'Next');
    next.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && event.repeat) event.preventDefault();
    });
    next.addEventListener('click', () => {
      if (stale() || !guard()) return;
      goNext();
    });
    append(article, [
      terminalBox({ system, labelId: sysId, body }),
      h('section', { class: `feedback ${right ? 'is-good' : 'is-bad'}`, 'aria-label': 'Result' },
        feedbackHead,
        question ? null : h('div', { class: 'feedback-body' }, commandFacts(ctx, command, 'Answer: ')),
      ),
      followUp ? followUp.element : null,
      // Under a follow-up, the command's own answer and reading come after the question's, as Command.
      checked ? h('section', { class: 'feedback', 'aria-label': 'Command' },
        h('div', { class: 'feedback-body' }, commandFacts(ctx, command, 'Command: '))) : null,
      !question || checked ? h('div', { class: 'quiz-actions' }, next) : null,
    ]);

    mount(app, screen);
    if (opened) openScroll();
    if (followUp && !checked) followUp.stem.focus({ preventScroll: true });
    else next.focus({ preventScroll: true });
    if (justChecked) {
      // As on the practice page: scroll just enough to show Next, with the result above it.
      next.scrollIntoView({ block: 'nearest' });
    } else if (ended && printed && feedbackHead.getBoundingClientRect().bottom > window.innerHeight) {
      // When the result does not fit on the screen, the line that printed goes to the top of the
      // screen with its output under it. When it fits, nothing moves.
      printed.scrollIntoView({ block: 'start' });
    }
  }

  /**
   * The follow-up question under an ended command, as on the practice page: pick, then Check. The
   * pick is saved on Check and graded by the question's current key; then its feedback and reading
   * show. The letter keys pick a choice, and Enter checks, only while focus is inside the question.
   * The question's own exhibit is not shown again: it is the output printed above.
   * Gives { element, stem }.
   */
  function followUpBlock({ index, question, fu, stale }) {
    const checked = Array.isArray(fu.picked);
    const answerSet = new Set(question.answer);
    const isMulti = question.answer.length > 1;
    const choiceById = new Map(question.choices.map((choice) => [choice.id, choice]));
    const order = fu.order.filter((cid) => choiceById.has(cid));
    const selected = new Set(checked ? fu.picked : []);
    const name = `fu-${index}`;
    const stemId = `fu-stem-${index}`;

    const views = order.map((cid, i) => {
      const input = h('input', { type: isMulti ? 'checkbox' : 'radio', name, value: cid, checked: selected.has(cid), disabled: checked });
      const mark = h('span', { class: 'choice-mark' });
      const label = h('label', { class: `choice${checked ? ' is-locked' : ''}` },
        input,
        h('span', { class: 'choice-letter', 'aria-hidden': 'true' }, LETTERS[i]),
        h('span', { class: 'choice-text' }, h('span', { class: 'visually-hidden' }, `${LETTERS[i]}. `), choiceById.get(cid).text),
        mark,
      );
      input.addEventListener('change', () => {
        if (isMulti) {
          if (input.checked) selected.add(cid);
          else selected.delete(cid);
        } else {
          selected.clear();
          selected.add(cid);
        }
        syncChoices();
      });
      return { cid, input, label, mark, letter: LETTERS[i] };
    });

    const checkButton = h('button', { type: 'button', class: 'btn btn-primary btn-lg' }, 'Check');
    const selectHint = h('span', { class: 'muted small' });
    const syncChoices = () => {
      for (const view of views) view.label.classList.toggle('is-selected', !checked && selected.has(view.cid));
      checkButton.disabled = selected.size !== question.answer.length;
      selectHint.textContent = isMulti ? `${selected.size} of ${question.answer.length} selected` : '';
    };

    const letters = views.filter((view) => answerSet.has(view.cid)).map((view) => view.letter);
    let feedback = null;
    if (checked) {
      for (const view of views) {
        const isAnswer = answerSet.has(view.cid);
        const wasPicked = selected.has(view.cid);
        if (isAnswer) view.label.classList.add('is-correct');
        else if (wasPicked) view.label.classList.add('is-wrong');
        append(view.mark, choiceMark(isAnswer, wasPicked));
      }
      const right = gradePick(question, fu.picked) === 'right';
      const headline = right ? 'Correct' : `Incorrect. ${letters.length > 1 ? 'Answers' : 'Answer'}: ${joinLetters(letters)}`;
      const chips = tagChips(question, ctx.objectiveIndex, ctx.unitIndex);
      feedback = h('section', { class: `feedback ${right ? 'is-good' : 'is-bad'}`, 'aria-label': 'Feedback' },
        h('div', { class: 'feedback-head' }, headline),
        h('div', { class: 'feedback-body' },
          referenceBlock(ctx, question),
          chips.length ? h('div', { class: 'q-meta', style: { margin: '0.8rem 0 0' } },
            chips.map((chip) => h('span', { class: 'chip', title: chip.title }, chip.label))) : null,
        ),
      );
    }

    const stem = h('p', { class: 'q-stem', id: stemId, tabindex: '-1' }, question.stem);
    const element = h('section', { class: 'panel question', 'aria-labelledby': stemId },
      h('div', { class: 'q-meta' }, question.status === 'draft' ? h('span', { class: 'badge' }, 'Draft') : null),
      stem,
      isMulti ? h('p', { class: 'q-instruction' }, `Choose ${numberWord(question.answer.length)}.`) : null,
      h('fieldset', { class: `choices${isMulti ? ' is-multi' : ''}` },
        h('legend', { class: 'visually-hidden' }, isMulti ? `Choose ${question.answer.length} answers` : 'Choose one answer'),
        views.map((view) => view.label),
      ),
      feedback,
      checked ? null : h('div', { class: 'quiz-actions' }, checkButton, selectHint),
    );
    syncChoices();

    const check = () => {
      if (checked || stale() || selected.size !== question.answer.length || !guard()) return;
      fu.picked = order.filter((cid) => selected.has(cid));
      saveRun();
      renderCommand({ checked: true });
      announce(gradePick(question, fu.picked) === 'right'
        ? 'Correct.'
        : `Incorrect. The correct ${letters.length > 1 ? 'answers are' : 'answer is'} ${joinLetters(letters)}.`);
    };
    checkButton.addEventListener('click', check);

    // Shortcuts only while focus is inside the question (WCAG 2.1.4), never page-wide.
    element.addEventListener('keydown', (event) => {
      if (checked || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event)) return;
      const onButton = event.target instanceof HTMLElement && event.target.closest('button, a, summary');
      const pick = letterIndex(event.key);
      if (pick >= 0 && pick < views.length) {
        event.preventDefault();
        views[pick].input.click();
        return;
      }
      if (event.key === 'Enter' && !onButton) {
        event.preventDefault();
        check();
      }
    });
    return { element, stem };
  }

  /**
   * The Command bank under an open command (docs/CONTENT-GUIDE.md, "The command bank"): every bank
   * entry of the task's system behind a toggle, closed until it is opened, like the flashcards
   * page's Taken out panel. Opening it saves "bank": true in the command's answer (an answer may
   * then hold no lines), so a right line after it reads Correct with bank and the command comes
   * back in Retry missed. It uses no try and never redraws the screen, so the field keeps its node
   * and what was typed. A system with no entry reads Coming soon.
   */
  function bankBlock({ system, id, index, stale }) {
    const entries = entriesFor(bankList, system);
    if (!entries.length) {
      return h('div', { class: 'panel', style: BANK_PANEL },
        h('div', { class: 'row' },
          h('span', { class: 'faint', style: { fontWeight: '600' } }, 'Command bank'),
          h('span', { class: 'chip' }, 'Coming soon'),
        ),
      );
    }
    const details = h('details', { class: 'panel disclosure', id: `bank-${index}`, style: BANK_PANEL },
      h('summary', { style: BANK_SUMMARY }, h('span', { class: 'chev', 'aria-hidden': 'true' }), 'Command bank'),
      h('ul', { style: BANK_LIST }, entries.map((entry, i) => bankEntry(entry, i))),
    );
    details.addEventListener('toggle', () => {
      if (!details.open || stale()) return;
      const answer = run.answers[id] || (run.answers[id] = { lines: [], shown: false });
      if (answer.bank === true) return;
      answer.bank = true;
      saveRun();
    });
    return details;
  }

  /** One bank entry: the command and its words, its syntax line, each switch with its words, and its reading. */
  function bankEntry(entry, i) {
    const where = ctx.unitIndex.get(entry.section);
    return h('li', { style: i ? BANK_NEXT : null },
      h('p', { style: { margin: '0' } }, h('code', { style: { fontWeight: '700' } }, entry.command), entry.does ? ` ${entry.does}` : null),
      entry.syntax ? h('p', { style: { margin: '0.3rem 0 0' } }, h('code', null, entry.syntax)) : null,
      entry.switches.length
        ? h('dl', { style: BANK_ROWS }, entry.switches.map((row) => [
            h('dt', { style: { margin: '0', overflowWrap: 'anywhere' } }, h('code', null, row.switch)),
            h('dd', { style: { margin: '0' } }, row.does, row.section ? h('span', { class: 'faint' }, ` Reading ${row.section}`) : null),
          ]))
        : null,
      entry.section
        ? h('p', { class: 'muted small', style: { margin: '0.4rem 0 0' } }, `Reading ${entry.section}`, where ? ` ${where.node.title}` : '')
        : null,
    );
  }

  /** After a try that keeps the command open, the cursor stays in the field and the field in view. */
  function keepTyping(field) {
    field.focus({ preventScroll: true });
    field.scrollIntoView({ block: 'nearest' });
  }

  /**
   * A command opens with its top line at the top of the screen on a touch screen (the header
   * scrolls out of view, so the task and the box sit above the keyboard), and at the top of the
   * page elsewhere.
   */
  function openScroll() {
    const top = document.getElementById('command-top');
    if (touchOnly() && top) top.scrollIntoView({ block: 'start' });
    else window.scrollTo({ top: 0 });
  }

  /** Save a line that counted a try, or the line that was accepted, as typed. */
  function saveLine(id, typed) {
    const answer = run.answers[id] || (run.answers[id] = { lines: [], shown: false });
    answer.lines.push(String(typed).substring(0, MAX_TYPED));
    saveRun();
  }

  /** End the open command: right, missed, or shown. Its version is picked now and saved by id. */
  function endCommand(id, { shown = false } = {}) {
    const command = byId.get(id);
    const answer = run.answers[id] || (run.answers[id] = { lines: [], shown: false });
    if (shown) answer.shown = true;
    chooseVersion(command, answer);
    saveRun();
    const graded = gradeAnswer(command, answer, matchCtx);
    renderCommand({ ended: true });
    const version = versionById(command, answer.version);
    if (graded.state === 'right') {
      const text = outputText(command, version, graded.group, ctx.questionById);
      const lines = text ? text.split('\n').length : 0;
      const head = answer.bank === true ? 'Correct with bank.' : graded.tries > 1 ? `Correct on try ${graded.tries}.` : 'Correct.';
      announce(lines ? `${head} Output printed, ${plural(lines, 'line')}.` : `${head} No output.`);
    } else {
      const last = graded.steps[graded.steps.length - 1];
      const miss = !graded.shown && last ? `${spokenLabel(wordsFor(last.result))} ` : '';
      announce(`${miss}Incorrect. The answer is ${firstLine(command)}.`);
    }
  }

  /**
   * The version a command shows, picked once, when it ends: another one than the version last
   * shown for it on this device, when it has more than one. On Retry missed, a command whose
   * question was the only part missed shows the same version again. A follow-up question gets its
   * choice order then too.
   */
  function chooseVersion(command, answer) {
    const ids = printableVersions(command, ctx.questionById).map((version) => version.id);
    answer.version = pickVersion(ids, { keep: retryKeep(command.id), avoid: seen.get(command.id) || null });
    seen.set(command.id, answer.version);
    saveSeen();
    const question = followUpOf(versionById(command, answer.version), ctx.questionById);
    if (question) answer.fu = { order: newChoiceOrder(question), picked: null };
    else delete answer.fu;
  }

  /** In a retry drill: the version a command showed in the drill it came from, when only its question was missed there. */
  function retryKeep(id) {
    if (!run || !run.retry || !run.before || !run.before.answers[id]) return null;
    const outcome = outcomeOf(run.before, id);
    return outcome.status === 'question' && outcome.answer.version ? outcome.answer.version : null;
  }

  function goNext() {
    if (run.index < run.ids.length - 1) {
      run.index += 1;
      saveRun();
      renderCommand({ opened: true });
    } else {
      finish();
    }
  }

  /** The drill ends: it is kept, with what was typed, as the last drill, and its results show. */
  function finish() {
    run.finished = true;
    run.finishedAt = new Date().toISOString();
    saveRun();
    setResumeAddress();
    renderResults();
  }

  /* ------------------------------------------------------------------ */
  /* Results                                                             */
  /* ------------------------------------------------------------------ */

  function renderResults() {
    const tally = tallyRun(run);
    const total = run.ids.length;
    const percent = tally.done ? Math.round((tally.right / tally.done) * 100) : 0;
    const skipped = total - tally.done;
    const retryIds = tally.retryIds;

    // Retry missed: a new drill of the commands just missed (a missed question counts, and so does a
    // command right with the bank), in a new order. A command whose question was the only part missed
    // shows the same version again.
    const retryButton = (cls) => {
      const button = h('button', { type: 'button', class: cls }, 'Retry missed');
      button.addEventListener('click', () => startRun(shuffle([...retryIds]), { retry: true, before: run }));
      return button;
    };
    const again = h('button', { type: 'button', class: 'btn', title: 'Same units, new commands' }, 'New drill');
    again.addEventListener('click', () => {
      const ids = poolIds();
      if (!ids.length) {
        renderSetup({ focusHeading: true });
        return;
      }
      startRun(drawIds(ids.map((cid) => ({ id: cid, weight: weightOf.get(cid) })), Math.min(setup.count, ids.length)));
    });
    const change = h('button', { type: 'button', class: 'btn btn-ghost' }, 'Change units');
    change.addEventListener('click', () => renderSetup({ focusHeading: true }));

    // Each command as the screen showed it when it ended (components/command-review.js), tagged
    // Right, Missed, Question missed, or Not answered, with a With bank chip beside the tag of a
    // command right with the bank. A command not answered shows its answer and the output of its
    // first version, as the practice review shows the key.
    const card = (cid) => {
      const outcome = outcomeOf(run, cid);
      const version = outcome.version || printableVersions(outcome.command, ctx.questionById)[0];
      const group = outcome.graded.state === 'right' ? outcome.graded.group : 0;
      return reviewCard(ctx, {
        number: run.ids.indexOf(cid) + 1,
        command: outcome.command,
        graded: outcome.graded,
        output: outputText(outcome.command, version, group, ctx.questionById),
        question: outcome.question,
        order: outcome.question ? outcome.answer.fu.order : null,
        picked: outcome.question ? outcome.answer.fu.picked : null,
        status: outcome.status,
        withBank: outcome.withBank,
      });
    };

    // Review: the missed commands first, or the full drill in order. The switch redraws only the
    // list, so focus and the page position stay put.
    let reviewView = 'missed';
    const reviewList = h('div');
    const drawReview = () => {
      const all = reviewView === 'all';
      const ids = all ? run.ids : retryIds;
      mount(reviewList,
        ids.length
          ? h('ol', { class: 'missed-list' }, ids.map((cid) => card(cid)))
          : h('p', { style: { margin: 0 } }, 'Nothing missed.'),
        retryIds.length && (all || retryIds.length > 1) ? h('div', { class: 'review-foot' }, retryButton('btn btn-primary btn-lg')) : null,
      );
    };
    const reviewSwitch = segmented('Commands to show', 'review-view', [
      { value: 'missed', label: `Missed (${retryIds.length})` },
      { value: 'all', label: `Full drill (${total})` },
    ], reviewView, (value) => {
      reviewView = value;
      drawReview();
    });
    drawReview();
    const review = h('section', { class: 'panel', 'aria-labelledby': 'review-heading' },
      h('div', { class: 'panel-title' },
        h('div', { class: 'row review-title' }, h('h2', { id: 'review-heading' }, 'Review'), reviewSwitch),
        retryIds.length ? retryButton('btn btn-primary') : null,
      ),
      reviewList,
    );

    mount(app,
      h('div', { class: 'wrap' },
        h('div', { class: 'page-head' }, h('h1', { id: 'results-heading', tabindex: '-1' }, 'Results')),
        h('section', { class: 'panel' },
          h('div', { class: 'score-hero' },
            h('div', { class: 'score-big' }, `${percent}%`),
            h('div', { class: 'score-detail' },
              h('div', null, h('strong', null, `${tally.right} of ${tally.done}`), tally.done === 1 ? ' command' : ' commands'),
              h('div', { class: 'small' }, `${tally.firstTry} on the first try`),
              tally.withBank ? h('div', { class: 'small' }, `${tally.withBank} with bank`) : null,
              tally.questions ? h('div', { class: 'small' }, `${tally.questionsRight} of ${plural(tally.questions, 'question')}`) : null,
              run.retry ? h('div', { class: 'small' }, 'Retry of missed commands') : null,
              skipped > 0 ? h('div', { class: 'small' }, `${skipped} not answered`) : null,
            ),
            h('div', { class: 'score-actions' }, again, change),
          ),
        ),
        // The review comes right after the score: it is the point of the results page.
        review,
      ),
    );
    window.scrollTo({ top: 0 });
    const heading = document.getElementById('results-heading');
    if (heading) heading.focus({ preventScroll: true });
    announce(`Results: ${tally.right} of ${plural(tally.done, 'command')}, ${percent} percent.${retryIds.length ? ` ${retryIds.length} missed, listed below.` : ''}`);
  }
}

/* -------------------------------------------------------------------- */
/* Helpers                                                              */
/* -------------------------------------------------------------------- */

/** A counted miss read aloud: "Wrong command. ifconfig: Linux." */
function spokenLabel(words) {
  return `${words.label}.${words.tag ? ` ${words.tag}.` : ''}`;
}

/** A choice picked by its letter (A to J) or its number (1 to 9), or -1. */
function letterIndex(key) {
  if (!key || key.length !== 1) return -1;
  const letter = LETTERS.indexOf(key.toUpperCase());
  if (letter >= 0) return letter;
  if (/^[1-9]$/.test(key)) return Number(key) - 1;
  return -1;
}

function joinLetters(letters) {
  if (letters.length <= 1) return letters.join('');
  return `${letters.slice(0, -1).join(', ')} and ${letters[letters.length - 1]}`;
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clampInt(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
