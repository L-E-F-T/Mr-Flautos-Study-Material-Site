/**
 * Study progress: the ONE place answers and finished tests are recorded.
 *
 * Everything stays in this browser (localStorage). There are no accounts and nothing
 * about a student leaves the device.
 *
 * Two things are kept per exam:
 *   - running totals (answered, correct, streak) for the in-test streak chip;
 *   - a log of finished tests, with a tally per unit, lesson, and objective, which the
 *     Recent history panel (assets/js/components/history-panel.js) turns into trends.
 */
import * as store from './storage.js';

const KEY = 'progress';
/** Oldest entries are dropped past this many tests, to keep storage small. */
export const HISTORY_LIMIT = 200;
const listeners = new Set();

function read() {
  const data = store.load(KEY, null);
  return data && typeof data === 'object' && data.exams && typeof data.exams === 'object'
    ? data
    : { version: 1, exams: {} };
}

function examEntry(data, examId) {
  if (!data.exams[examId] || typeof data.exams[examId] !== 'object') {
    data.exams[examId] = { answered: 0, correct: 0, streak: 0, bestStreak: 0, tests: 0, byQuestion: {}, history: [] };
  }
  const exam = data.exams[examId];
  if (!exam.byQuestion || typeof exam.byQuestion !== 'object') exam.byQuestion = {};
  if (!Array.isArray(exam.history)) exam.history = [];
  return exam;
}

function emit(event) {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (error) {
      // A broken listener must never break studying.
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }
}

/** Record one checked answer. Returns the updated stats for that exam. */
export function recordAnswer({ examId, questionId, correct }) {
  const data = read();
  const exam = examEntry(data, examId);
  exam.answered += 1;
  if (correct) {
    exam.correct += 1;
    exam.streak += 1;
    exam.bestStreak = Math.max(exam.bestStreak, exam.streak);
  } else {
    exam.streak = 0;
  }
  const seen = exam.byQuestion[questionId] || { seen: 0, correct: 0, last: null };
  seen.seen += 1;
  if (correct) seen.correct += 1;
  seen.last = correct ? 1 : 0;
  exam.byQuestion[questionId] = seen;
  store.save(KEY, data);
  emit({ type: 'answer', examId, questionId, correct, at: new Date().toISOString() });
  return summarize(exam);
}

/**
 * Add one finished test to the log. The practice page builds the entry:
 *   {
 *     at: ISO date and time the test finished,
 *     mode: 'unit' | 'objective',      how the student picked topics
 *     retry: boolean,                  a round of only previously missed questions
 *     planned: number,                 questions in the test
 *     total: number, correct: number,  questions answered, and answered correctly
 *     units:      { '3.0': [correct, total], ... },
 *     lessons:    { '3.2': [correct, total], ... },
 *     domains:    { '3.0': [correct, total], ... },   (exam domains; tests logged before
 *                                                    2026-11-12 have none)
 *     objectives: { '3.4': [correct, total], ... },
 *   }
 */
export function recordTestResult({ examId, entry }) {
  const data = read();
  const exam = examEntry(data, examId);
  exam.history.push(entry);
  if (exam.history.length > HISTORY_LIMIT) exam.history.splice(0, exam.history.length - HISTORY_LIMIT);
  exam.tests = (exam.tests || 0) + 1;
  store.save(KEY, data);
  emit({ type: 'test-complete', examId, correct: entry.correct, total: entry.total, at: entry.at });
}

function isEntry(entry) {
  return Boolean(entry) && typeof entry === 'object'
    && Number.isFinite(entry.total) && entry.total > 0
    && Number.isFinite(entry.correct) && entry.correct >= 0 && entry.correct <= entry.total
    && typeof entry.at === 'string';
}

/** Finished tests for an exam, oldest first. Damaged entries are skipped. */
export function getHistory(examId) {
  const exam = read().exams[examId];
  return exam && Array.isArray(exam.history) ? exam.history.filter(isEntry) : [];
}

export function clearHistory(examId) {
  const data = read();
  if (!data.exams[examId]) return;
  data.exams[examId].history = [];
  store.save(KEY, data);
}

function summarize(exam) {
  return {
    answered: exam.answered,
    correct: exam.correct,
    accuracy: exam.answered ? exam.correct / exam.answered : 0,
    streak: exam.streak,
    bestStreak: exam.bestStreak,
    tests: exam.tests,
  };
}

export function getExamStats(examId) {
  const exam = read().exams[examId];
  return exam && typeof exam === 'object' ? summarize(exam) : null;
}

/** Subscribe to progress events. Returns an unsubscribe function. */
export function onProgress(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
