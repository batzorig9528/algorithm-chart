import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { LIGHT_EXAMPLE, SNAKE_EXAMPLE } from '../lib/light-examples';
import { lightPythonIssues } from '../lib/light-python';

type Message = { type: string; text?: string; commands?: [string, unknown[]][] };
async function runPython(code: string, stopAfterFrames = 0, initialInput?: Record<string, unknown>) {
  const root = path.join(process.cwd(), 'public/pygame/light');
  const messages: Message[] = [];
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let frames = 0;
  let complete!: () => void;
  const done = new Promise<void>(resolve => { complete = resolve; });
  const context: Record<string, any> = {
    console, FLOW_BASE: '/light/',
    setTimeout(fn: (...args: unknown[]) => void, delay: number, ...args: unknown[]) {
      const timer = setTimeout(() => { timers.delete(timer); fn(...args); }, delay);
      timers.add(timer); return timer;
    },
    clearTimeout(timer: ReturnType<typeof setTimeout>) { clearTimeout(timer); timers.delete(timer); },
    postMessage(message: Message) {
      messages.push(message);
      if (message.type === 'draw' && ++frames === stopAfterFrames) {
        context.onmessage({ data: { type: 'input', event: { type: 256 }, keys: {}, pos: [5, 7], buttons: [false, false, false] } });
      }
      if (message.type === 'completed' || message.type === 'error') complete();
    },
  };
  context.self = context;
  vm.createContext(context);
  context.importScripts = (...files: string[]) => files.forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(root, file.replace('/light/', '')), 'utf8'), context, { filename: file });
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'worker.js'), 'utf8'), context, { filename: 'worker.js' });
  if (initialInput) await context.onmessage({ data: { type: 'input', ...initialInput } });
  await context.onmessage({ data: { type: 'run', code } });
  await done;
  timers.forEach(clearTimeout);
  return messages;
}

test('light Python supports loops, functions, lists, math and random', async () => {
  const messages = await runPython('import random, math\ndef total(values):\n    answer = 0\n    for x in values:\n        if x > 1:\n            answer += x\n    return answer\nprint(total([1, 2, 3]))\nprint(math.sqrt(9))\nprint(random.choice([7]))\n');
  assert.equal(messages.at(-1)?.type, 'completed', JSON.stringify(messages));
  const text = messages.filter(m => m.type === 'output').map(m => m.text).join('');
  assert.match(text, /5\n3.0\n7/);
});

test('both bundled games draw frames and quit via an input event', async () => {
  for (const code of [LIGHT_EXAMPLE, SNAKE_EXAMPLE]) {
    assert.deepEqual(lightPythonIssues(code), []);
    const messages = await runPython(code, 3);
    assert.equal(messages.at(-1)?.type, 'completed', JSON.stringify(messages));
    const commands = messages.flatMap(m => m.commands || []);
    assert.ok(commands.some(([name]) => name === 'size'));
    assert.ok(commands.some(([name]) => ['circle', 'rect'].includes(name)));
    if (code === SNAKE_EXAMPLE) assert.ok(commands.some(([name]) => name === 'text'));
  }
});

test('unsupported imports, aliases, members and async are marked at their source', () => {
  for (const code of ['import os', 'import pygame as pg\npg.image.load("x")', 'from pygame import mixer', 'import pygame\nscreen = pygame.display.set_mode((10,10))\nscreen.convert()', 'async def main():\n    pass', 'input()']) {
    assert.ok(lightPythonIssues(code).length, code);
    for (const issue of lightPythonIssues(code)) assert.ok(code.slice(issue.from, issue.to).length);
  }
  assert.deepEqual(lightPythonIssues('# import os\nprint("pygame.image.load")'), []);
  assert.deepEqual(lightPythonIssues('import pygame as pg\npg.draw.circle(screen, (1,2,3), (0,0), 2)'), []);
});

test('runtime reports unsupported attributes and stops an uninterrupted infinite loop', async () => {
  const unsupported = await runPython('import pygame\npygame.image.load("x")');
  assert.equal(unsupported.at(-1)?.type, 'error');
  assert.match(unsupported.at(-1)?.text || '', /image/);
  const loop = await runPython('while True:\n    pass');
  assert.equal(loop.at(-1)?.type, 'error');
  assert.match(loop.at(-1)?.text || '', /clock.tick|TimeLimit/);
});

test('live compiler detects invalid syntax without executing Python', () => {
  const messages: any[] = [];
  const context: Record<string, any> = { console, postMessage: (m: unknown) => messages.push(m) };
  context.self = context;
  vm.createContext(context);
  context.importScripts = (file: string) => vm.runInContext(fs.readFileSync(path.join('public/pygame/light', file), 'utf8'), context);
  vm.runInContext(fs.readFileSync('public/pygame/light/check-worker.js', 'utf8'), context);
  context.onmessage({ data: { id: 1, code: 'if True\n    pass' } });
  assert.equal(messages[0].id, 1);
  assert.ok(messages[0].issue);
  context.onmessage({ data: { id: 2, code: 'while True:\n    pass' } });
  assert.equal(messages[1].issue, null);
  context.onmessage({ data: { id: 3, code: SNAKE_EXAMPLE } });
  assert.equal(messages[2].issue, null);
});


test('keyboard, mouse and event values reach Python', async () => {
  const messages = await runPython('import pygame\nprint(pygame.key.get_pressed()[pygame.K_RIGHT])\nprint(pygame.mouse.get_pos())\nprint(pygame.mouse.get_pressed())\nfor event in pygame.event.get():\n    print(event.type, event.key)\n', 0, {
    keys: { 1073741903: true }, pos: [23, 45], buttons: [true, false, false], event: { type: 768, key: 1073741903 },
  });
  assert.equal(messages.at(-1)?.type, 'completed', JSON.stringify(messages));
  const output = messages.filter(m => m.type === 'output').map(m => m.text).join('');
  assert.match(output, /True\n\(23, 45\)\n\(True, False, False\)\n768 1073741903/);
});
