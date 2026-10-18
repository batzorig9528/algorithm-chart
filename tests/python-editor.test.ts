import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzePython, pythonCompletions, ASSIST_LIMIT } from "../lib/python-editor";
import { PYGAME_EXAMPLE } from "../lib/pygame";
import { boundedLogs } from "../lib/editor-logs";

test("Python highlighting preserves exact source without interpreting HTML", () => {
  const source = 'if True:\n    print("<script> & текст") # comment\n    x = 12.5e-2';
  const { tokens, issues } = analyzePython(source);
  assert.deepEqual(issues, []);
  assert.ok(tokens.some(t => t.kind === "keyword" && source.slice(t.from, t.to) === "if"));
  assert.ok(tokens.some(t => t.kind === "string" && source.slice(t.from, t.to).includes("<script>")));
  assert.ok(tokens.some(t => t.kind === "number" && source.slice(t.from, t.to) === "12.5e-2"));
});

test("common syntax errors have line locations; strings and comments do not cause false brackets", () => {
  assert.equal(analyzePython("print('hello'").issues[0].line, 1);
  assert.match(analyzePython('x = "hello').issues[0].message, /хашилт/);
  assert.match(analyzePython("if True\n    pass").issues[0].message, /:/);
  assert.match(analyzePython("x = (]").issues[0].message, /тохирохгүй/);
  for (const source of [PYGAME_EXAMPLE, '# ([\nprint("(")', 's = """hello\n([)]\nworld"""', 'if (\n    True\n):\n    pass', 'if True: print("ok")', 'match = 1\ncase = 2']) {
    assert.deepEqual(analyzePython(source).issues, [], source);
  }
});

test("completion supports builtins, Pygame members, aliases and user functions", () => {
  assert.equal(pythonCompletions("pri", 3).options[0].insert, "print()");
  assert.ok(pythonCompletions("pygame.draw.ci", 14).options.some(o => o.insert === "circle()"));
  const alias = "import pygame as pg\npg.display.se";
  assert.ok(pythonCompletions(alias, alias.length).options.some(o => o.insert === "set_mode()"));
  const custom = "def jump():\n    pass\nju";
  assert.equal(pythonCompletions(custom, custom.length).options[0].insert, "jump()");
  for (const source of ['# pri', 'print("pri', '"""pri']) assert.equal(pythonCompletions(source, source.length).options.length, 0);
  assert.equal(pythonCompletions("unknown.member", 14).options.length, 0);
  assert.equal(analyzePython("x".repeat(ASSIST_LIMIT + 1)).tokens.length, 0);
});

test("flow logs bound both DOM rows and retained characters, preserving newest output", () => {
  const logs = Array.from({ length: 800 }, (_, i) => ({ type: "output" as const, text: String(i) }));
  assert.equal(boundedLogs(logs).length, 500);
  assert.equal(boundedLogs(logs).at(-1)?.text, "799");
  const large = boundedLogs(Array.from({ length: 800 }, () => ({ type: "output" as const, text: "x".repeat(10_000) })));
  assert.ok(large.reduce((sum, log) => sum + log.text.length, 0) <= 100_000);
  assert.ok(large.every(log => log.text.length <= 4000));
});
