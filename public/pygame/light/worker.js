/* Skulpt executes only inside this disposable worker. No user-code eval on the UI thread. */
importScripts(self.FLOW_BASE + 'vendor/skulpt.min.js', self.FLOW_BASE + 'vendor/skulpt-stdlib.js', self.FLOW_BASE + 'pygame-module.js');
let commands = [], events = [], keys = {}, mouse = [0, 0], buttons = [false, false, false];
let output = '', outputTimer, started = false, previousTick = Date.now();
let startTime = previousTick;
function flushOutput() {
  clearTimeout(outputTimer); outputTimer = undefined;
  if (output) { postMessage({ type: 'output', text: output }); output = ''; }
}
function flush() {
  if (commands.length) { postMessage({ type: 'draw', commands }); commands = []; }
  flushOutput();
}
// Referenced by the native module evaluated by Skulpt's importer.
self.flowCanvas = {
  command(name, args) {
    if (commands.length >= 2000) throw new Sk.builtin.RuntimeError('Нэг кадрт хэт олон дүрс байна. clock.tick(30) ашиглана уу.');
    commands.push([name, args]);
  },
  flush,
  events() { const result = events; events = []; return result; },
  pressed(key) { return !!keys[key]; },
  mouse() { return mouse; },
  buttons() { return buttons; },
  ticks() { return Date.now() - startTime; },
  tick(fps) {
    if (!Number.isFinite(fps)) throw new Sk.builtin.ValueError('FPS тоо байх ёстой.');
    flush();
    const interval = 1000 / Math.max(1, Math.min(60, fps || 30));
    return Sk.misceval.promiseToSuspension(new Promise(resolve => setTimeout(() => {
      const now = Date.now(), elapsed = now - previousTick;
      previousTick = now;
      // Limit uninterrupted computation, not the lifetime of an interactive game.
      Sk.execStart = now;
      resolve(new Sk.builtin.int_(elapsed));
    }, Math.max(0, interval - (Date.now() - previousTick)))));
  },
};
function canvasModule() {
  const mod = {}, api = self.flowCanvas;
  const wrap = fn => new Sk.builtin.func(function(...args) {
    const result = fn(...args.map(arg => Sk.ffi.remapToJs(arg)));
    return result instanceof Sk.misceval.Suspension ? result : Sk.ffi.remapToPy(result === undefined ? null : result);
  });
  mod.command = wrap(api.command); mod.flush = wrap(api.flush); mod.events = wrap(api.events);
  mod.is_pressed = wrap(api.pressed); mod.mouse_pos = wrap(api.mouse); mod.mouse_buttons = wrap(api.buttons);
  mod.ticks = wrap(api.ticks); mod.tick = wrap(api.tick);
  return mod;
}
function read(path) {
  if (path === 'src/lib/pygame.py') return self.FLOW_PYGAME_SOURCE;
  if (path === 'src/lib/_flow_canvas.js') return 'var $builtinmodule = ' + canvasModule.toString();
  const file = Sk.builtinFiles.files[path];
  if (file !== undefined) return file;
  throw new Error('Light горимд энэ модуль дэмжигдэхгүй: ' + path);
}
Sk.configure({
  __future__: Sk.python3, read, execLimit: 1500, yieldLimit: 20,
  killableWhile: true, killableFor: true,
  output(text) {
    output = (output + text).slice(-100000);
    if (outputTimer === undefined) outputTimer = setTimeout(flushOutput, 150);
  },
  inputfun() { throw new Sk.builtin.NotImplementedError('input() дэмжигдэхгүй. Keyboard/mouse ашиглана уу.'); },
  timeoutMsg: () => 'Тооцоолол хэт удаан үргэлжиллээ. Тоглоомын давталтад clock.tick(30) нэмнэ үү.',
});
onmessage = async event => {
  const message = event.data;
  if (message.type === 'input') {
    keys = message.keys || {}; mouse = message.pos || mouse; buttons = message.buttons || buttons;
    if (message.event) events = [...events.slice(-255), message.event];
    return;
  }
  if (message.type !== 'run' || started || typeof message.code !== 'string') return;
  started = true;
  previousTick = startTime = Date.now();
  if (message.code.length > 100000) { postMessage({ type: 'error', text: 'Код 100,000 тэмдэгтээс урт байна.' }); return; }
  postMessage({ type: 'running' });
  try {
    await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('main', false, message.code, true));
    flush(); postMessage({ type: 'completed' });
  } catch (error) {
    flush();
    postMessage({ type: 'error', text: error.toString() });
  }
};
postMessage({ type: 'ready' });
