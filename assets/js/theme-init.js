/* Runs before the page paints (a plain blocking script in <head>): applies the saved
   light/dark choice, or the device setting when the student has not chosen yet.
   Keep it tiny and dependency-free. The toggle button lives in assets/js/lib/theme.js. */
(function () {
  var theme = null;
  try {
    theme = JSON.parse(window.localStorage.getItem('certprep:v1:theme'));
  } catch (error) {
    theme = null;
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
