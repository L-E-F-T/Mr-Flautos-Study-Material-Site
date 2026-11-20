/**
 * Command line page: a typed command drill for an exam that has the tool ("commandUnits" in
 * data/exams.json, or, on the teacher's ?drafts=1 look before launch, a listed command pack).
 * docs/COMMAND-LINE-PLAN.md sections 6, 7, and 14.
 *  1. Setup: the units the tool lists, each with its count, and how many commands. A drill in
 *     progress and the last drill show as banners, each with the two-click minus.
 *  2. Command: the task, then a terminal box for the system it names, with one live field. A
 *     right line prints the output of its answer group. A wrong command or the right command with
 *     wrong details uses one of two tries; a slip uses none (the matcher, command-match.js, says
 *     which). Two counted misses, or Show answer, print the answer and its output.
 * The drill is saved on this device after every counted try and every end of a command, and
 * graded again from what was typed when the page loads, so a reload shows the same thing. A
 * version of the output is picked once per command and saved by its id. Nothing is written to the
 * practice test's history: progress.js is not imported.
 * boot.js picks the exam, or sends the browser to the home page for an exam without the tool,
 * before any pack loads.
 */
import { bootExamPage, fetchJSON, includePrivatePacks, showFatal, queryFlag, pageUrl } from '../lib/boot.js';
import { commandState, loadCommandPacks, commandsFromPacks, commandUnits } from '../lib/content.js';
import { h, mount, append, icon, announce, plural } from '../lib/dom.js';
import { buildSelectionTree, itemIdsForLeaves, ancestorAtDepth, tagChips } from '../lib/taxonomy.js';
import * as store from '../lib/storage.js';
import { matchLine, buildContext, specFromItem, wordsFor, SYSTEMS } from '../lib/command-match.js';
import { printableVersions, versionById, outputText, followUpOf, drawWeight, isExtra, referenceOf } from '../lib/command-items.js';
import { usableCommands, drawIds, pickVersion, gradeAnswer, newChoiceOrder, keptChoiceOrder, MAX_TRIES, MAX_TYPED } from '../lib/command-drill.js';
import { createTreePicker } from '../components/tree-picker.js';
import { discardButton } from '../components/discard-button.js';
import { referenceBlock } from '../components/question-review.js';
import {
  touchOnly, commandField, promptText, echoLine, nextPrompt, outputBlock, missLine, noteLine, missEntry, terminalBox,
} from '../components/command-terminal.js';
import { initThemeToggle } from '../lib/theme.js';

initThemeToggle();

// A page brought back by the Back button still holds its old drill in memory. Load it fresh, so
// it never writes an old copy over newer answers.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) window.location.reload();
});

const PRESETS = [5, 10];
// A second Run, Show answer, or Next this soon after the one before does nothing, so a held Enter
// key cannot run a line twice or skip past an output.
const GUARD_MS = 400;

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
  // Each unit is one row (a leaf) with the count of the commands in the draw.
  const tree = buildSelectionTree(roots, commands.filter((command) => setup.extra || !isExtra(command)), (command) => command.units, { maxDepth: 1 });
  const unitsWithCommands = [...tree.leaves.values()].filter((leaf) => leaf.total > 0).map((leaf) => leaf.id);
  if (!unitsWithCommands.length) {
    comingSoon();
    return;
  }
  // First visit: every unit that has commands is checked.
  if (savedSetup && Array.isArray(savedSetup.units)) {
    for (const id of savedSetup.units) if (tree.leaves.has(id)) setup.selected.add(id);
  } else {
    for (const id of unitsWithCommands) setup.selected.add(id);
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

  // Run, Show answer, and Next share one guard (GUARD_MS).
  let lastAction = 0;
  const guard = () => {
    const now = Date.now();
    if (now - lastAction < GUARD_MS) return false;
    lastAction = now;
    return true;
  };

  // "resume=1" in the address during a drill sends a reload straight back into it.
  if (run && !run.finished && queryFlag('resume')) renderCommand({ opened: true });
  else renderSetup();

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
   * still exist and adds new ones, as on the practice page.
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
      if (answer.version !== undefined) {
        if (!printableVersions(command, ctx.questionById).some((version) => version.id === answer.version)) return null;
        kept.version = answer.version;
        const question = followUpOf(versionById(command, answer.version), ctx.questionById);
        if (question && isObject(answer.fu)) {
          kept.fu = { order: keptChoiceOrder(question, answer.fu.order), picked: typeof answer.fu.picked === 'string' ? answer.fu.picked : null };
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

  /** Commands that ended right and missed, graded again from what was typed. */
  function tallyRun(drill) {
    let right = 0;
    let missed = 0;
    for (const id of drill.ids) {
      const graded = gradeAnswer(byId.get(id), drill.answers[id], matchCtx);
      if (graded.state === 'right') right += 1;
      else if (graded.state === 'missed') missed += 1;
    }
    return { right, missed, done: right + missed };
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

    const begin = () => {
      const ids = poolIds();
      if (!ids.length) return;
      if (run && !run.finished && Object.keys(run.answers).length > 0
        && !window.confirm('Start a new drill? The drill in progress will be lost.')) return;
      const pool = ids.map((id) => ({ id, weight: weightOf.get(id) }));
      startRun(drawIds(pool, Math.min(setup.count, ids.length)));
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
        h('span', { class: 'row' }, dismiss),
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
   * command ends the whole screen is drawn again from what was saved, so a reload shows the same.
   * `opened`: the command was just opened (Start, Next, Resume, a reload). `ended`: it just ended.
   */
  function renderCommand({ opened = false, ended = false } = {}) {
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
      append(article, form);

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
    const group = right ? graded.group : 0;
    const answerLine = firstLine(command);
    const last = graded.steps[graded.steps.length - 1];
    const shownLine = right ? last.result.line : answerLine;
    // The box as it stood, then the line that printed (the right line as typed, or Answer and the
    // answer), its output, and the next prompt.
    const body = h('div', { class: 'cl-term-body' });
    let printedEcho = null;
    graded.steps.forEach((step, i) => {
      if (step.result.code === 'accepted') {
        printedEcho = echoLine(system, step.typed);
        append(body, printedEcho);
      } else {
        append(body, missEntry(system, step, MAX_TRIES - i - 1));
      }
    });
    if (!right) {
      printedEcho = echoLine(system, answerLine);
      append(body, [noteLine('Answer'), printedEcho]);
    }
    append(body, [
      outputBlock(outputText(command, version, group, ctx.questionById), shownLine),
      nextPrompt(system),
    ]);

    const head = right ? (graded.tries > 1 ? `Correct on try ${graded.tries}` : 'Correct') : 'Incorrect';
    const chips = tagChips(command, ctx.objectiveIndex, ctx.unitIndex);
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
        h('div', { class: 'feedback-body' },
          h('p', { class: 'cl-answer' }, 'Answer: ', answerCodes(command)),
          referenceBlock(ctx, { reference: referenceOf(command, ctx.questionById) }),
          chips.length ? h('div', { class: 'q-meta', style: { margin: '0.8rem 0 0' } },
            chips.map((chip) => h('span', { class: 'chip', title: chip.title }, chip.label))) : null,
        ),
      ),
      h('div', { class: 'quiz-actions' }, next),
    ]);

    mount(app, screen);
    if (opened) openScroll();
    next.focus({ preventScroll: true });
    // When the result does not fit on the screen, the line that printed goes to the top of the
    // screen with its output under it. When it fits, nothing moves.
    if (ended && printedEcho && feedbackHead.getBoundingClientRect().bottom > window.innerHeight) {
      printedEcho.scrollIntoView({ block: 'start' });
    }
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
      const head = graded.tries > 1 ? `Correct on try ${graded.tries}.` : 'Correct.';
      announce(lines ? `${head} Output printed, ${plural(lines, 'line')}.` : `${head} No output.`);
    } else {
      const last = graded.steps[graded.steps.length - 1];
      const miss = !graded.shown && last ? `${spokenLabel(wordsFor(last.result))} ` : '';
      announce(`${miss}Incorrect. The answer is ${firstLine(command)}.`);
    }
  }

  /**
   * The version a command shows, picked once, when it ends: another one than the version last
   * shown for it on this device, when it has more than one. A follow-up question gets its choice
   * order then too.
   */
  function chooseVersion(command, answer) {
    const ids = printableVersions(command, ctx.questionById).map((version) => version.id);
    answer.version = pickVersion(ids, { avoid: seen.get(command.id) || null });
    seen.set(command.id, answer.version);
    saveSeen();
    const question = followUpOf(versionById(command, answer.version), ctx.questionById);
    if (question) answer.fu = { order: newChoiceOrder(question), picked: null };
    else delete answer.fu;
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

  /** The drill ends: it is kept, with what was typed, as the last drill. */
  function finish() {
    run.finished = true;
    run.finishedAt = new Date().toISOString();
    saveRun();
    window.history.replaceState(window.history.state, '', pageUrl('commands.html', examId));
    renderSetup({ focusHeading: true });
  }
}

/* -------------------------------------------------------------------- */
/* Helpers                                                              */
/* -------------------------------------------------------------------- */

/** The line shown as the answer: the first line of the first answer group. */
function firstLine(command) {
  return command.accept[0].lines.find((line) => typeof line === 'string' && line.trim() !== '');
}

/** Every right line, as code: "ip addr or ifconfig", "a, b, or c". */
function answerCodes(command) {
  const lines = [];
  for (const group of command.accept) {
    for (const line of group.lines) if (typeof line === 'string' && line.trim() !== '' && !lines.includes(line)) lines.push(line);
  }
  const out = [];
  lines.forEach((line, i) => {
    if (i > 0) out.push(i < lines.length - 1 ? ', ' : lines.length > 2 ? ', or ' : ' or ');
    out.push(h('code', null, line));
  });
  return out;
}

/** A counted miss read aloud: "Wrong command. ifconfig: Linux." */
function spokenLabel(words) {
  return `${words.label}.${words.tag ? ` ${words.tag}.` : ''}`;
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clampInt(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
