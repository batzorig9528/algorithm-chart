importScripts('vendor/skulpt.min.js');
Sk.configure({ __future__: Sk.python3 });
onmessage = event => {
  const { id, code } = event.data;
  if (typeof code !== 'string' || code.length > 100000) return;
  try {
    // Compilation produces a JS string; it never executes the student's code.
    Sk.compile(code, 'main.py', 'exec', true);
    postMessage({ id, issue: null });
  } catch (error) {
    postMessage({ id, issue: { line: error.traceback?.[0]?.lineno || 1, message: error.toString() } });
  }
};
