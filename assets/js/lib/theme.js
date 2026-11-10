/**
 * Light / dark mode.
 * assets/js/theme-init.js (a tiny blocking script in <head>) sets <html data-theme="light|dark">
 * before first paint. This module wires up the header toggle ([data-theme-toggle]), remembers the
 * choice on this device, and keeps following the device setting until the student picks one.
 */
import * as store from './storage.js';
import { announce } from './dom.js';

const KEY = 'theme';
const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function savedTheme() {
  const value = store.load(KEY, null);
  return value === 'light' || value === 'dark' ? value : null;
}

export function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  const other = theme === 'dark' ? 'light' : 'dark';
  for (const button of document.querySelectorAll('[data-theme-toggle]')) {
    button.setAttribute('aria-label', `Switch to ${other} mode`);
    button.setAttribute('title', `Switch to ${other} mode`);
  }
  // Tint the browser toolbar on phones to match the page header.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const surface = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
    if (surface) meta.setAttribute('content', surface);
  }
}

let ready = false;

export function initThemeToggle() {
  apply(savedTheme() || currentTheme());
  if (ready) return;
  ready = true;

  for (const button of document.querySelectorAll('[data-theme-toggle]')) {
    button.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      store.save(KEY, next);
      apply(next);
      announce(`${next === 'dark' ? 'Dark' : 'Light'} mode on.`);
    });
  }

  // Follow the device setting for as long as the student has not chosen.
  if (media) {
    const onDeviceChange = (event) => {
      if (!savedTheme()) apply(event.matches ? 'dark' : 'light');
    };
    if (typeof media.addEventListener === 'function') media.addEventListener('change', onDeviceChange);
    else if (typeof media.addListener === 'function') media.addListener(onDeviceChange);
  }

  // Keep other open tabs of the site in step.
  window.addEventListener('storage', (event) => {
    if (event.key && event.key.endsWith(`:${KEY}`)) {
      const theme = savedTheme();
      if (theme) apply(theme);
    }
  });

  // A page brought back by the Back button skips theme-init.js: apply the saved choice again.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) apply(savedTheme() || currentTheme());
  });
}
