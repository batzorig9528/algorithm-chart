import { examples } from "../lib/examples";
import { test } from "node:test";
import assert from "node:assert/strict";
import { block, evaluate, execute, validateProject } from "../lib/flow";

test("expression precedence, variables, strings and comparisons", () => {
  assert.equal(evaluate("2 + 3 * (4 - 1)", {}), 11);
  assert.equal(evaluate("a % 2 == 0 && a > 0", { a: 4 }), true);
  assert.equal(evaluate('"Нийлбэр: " + sum', { sum: 12 }), "Нийлбэр: 12");
  assert.equal(evaluate("!(x < 2)", { x: 3 }), true);
  assert.equal(evaluate("-2 * 4", {}), -8);
});
test("rejects undefined variables, invalid syntax, division by zero and JS execution", () => {
  for (const expr of [
    "unknown + 1",
    "4 / 0",
    "3 % 0",
    "(1 + 2",
    "2 3",
    "globalThis.alert(1)",
    "constructor",
    "1; 2",
  ])
    assert.throws(() => evaluate(expr, {}));
});
function runExample(index: number, inputs: string[]) {
  const iterator = execute(examples[index].make());
  const output: string[] = [];
  let frame = iterator.next();
  let count = 0;
  while (!frame.done) {
    if (++count > 1000) throw new Error("Unexpected infinite execution");
    if (frame.value.output !== undefined) output.push(frame.value.output);
    frame = iterator.next(frame.value.input ? inputs.shift() : undefined);
  }
  return output;
}
test("sum uses supplied console input", () =>
  assert.deepEqual(runExample(0, ["7", "5"]), ["12"]));
test("condition executes only the matching branch", () => {
  assert.deepEqual(runExample(1, ["4"]), ["Тэгш тоо"]);
  assert.deepEqual(runExample(1, ["7"]), ["Сондгой тоо"]);
});
test("loop accumulates values and handles zero iterations", () => {
  assert.deepEqual(runExample(2, ["10"]), ["55"]);
  assert.deepEqual(runExample(2, ["0"]), ["0"]);
});
test("infinite loops terminate at the instruction limit", () => {
  const loop = block("while", "", "true");
  assert.throws(() => {
    for (const frame of execute([loop])) void frame;
  }, /10,000/);
});
test("project import rejects malformed content and duplicate IDs", () => {
  const b = block("input", "n");
  assert.equal(validateProject({ title: "Example", blocks: [b] }), true);
  assert.equal(validateProject({ title: "Example", blocks: [b, b] }), false);
  assert.equal(
    validateProject({ title: "Example", blocks: [{ ...b, children: null }] }),
    false,
  );
  assert.equal(
    validateProject({
      title: "Example",
      blocks: [{ ...b, kind: "constructor" }],
    }),
    false,
  );
});

test("project descriptions persist and reject malformed values", () => {
  assert.equal(
    validateProject({
      title: "Миний бодлого",
      description: "Талбай ол",
      blocks: [],
    }),
    true,
  );
  assert.equal(
    validateProject({ title: "Миний бодлого", description: 42, blocks: [] }),
    false,
  );
});

test("for block counts from start to end inclusive and exposes the counter", () => {
  const loop = block("for", "i", "1; 4");
  loop.children = [block("assign", "sum", "sum + i")];
  const blocks = [
    block("declare", "sum", "0"),
    loop,
    block("output", "", "sum"),
  ];
  const gen = execute(blocks);
  let out = "";
  for (let f = gen.next(); !f.done; f = gen.next()) {
    if (f.value.output !== undefined) out = f.value.output;
  }
  assert.equal(out, "10");
});

test("for block honours custom and negative steps", () => {
  function outputs(expression: string) {
    const loop = block("for", "i", expression);
    loop.children = [block("output", "", "i")];
    const gen = execute([loop]);
    const out: string[] = [];
    for (let f = gen.next(); !f.done; f = gen.next())
      if (f.value.output !== undefined) out.push(f.value.output);
    return out;
  }
  assert.deepEqual(outputs("0; 6; 2"), ["0", "2", "4", "6"]);
  assert.deepEqual(outputs("5; 1; -2"), ["5", "3", "1"]);
  assert.throws(() => outputs("1; 5; 0"));
});
test("arrays: literals, indexing, len, element assignment and output", () => {
  assert.deepEqual(evaluate("[1, 2 + 3, []]", {}), [1, 5, []]);
  assert.equal(evaluate("a[1] + a[2]", { a: [1, 2, 3] }), 5);
  assert.equal(evaluate('len(a) + len("abc")', { a: [1, 2] }), 5);
  assert.equal(evaluate("[1, 2] == [1, 2]", {}), true);
  assert.equal(evaluate('"x" + [1, "a"]', {}), 'x[1, "a"]');
  for (const expr of [
    "a[2]",
    "a[-1]",
    "a[0.5]",
    "a + 1",
    "a * 2",
    "len(1)",
    "foo(1)",
  ])
    assert.throws(() => evaluate(expr, { a: [1, 2] }), expr);
  const set = block("declare", "a", "[5, 6]");
  const assign = block("assign", "a[len(a)]", "7");
  const replace = block("assign", "a[0]", "a[0] * 2");
  const out = block("output", "", "a");
  const frames = [...execute([set, assign, replace, out])];
  assert.equal(frames.at(-1)?.output, "[10, 6, 7]");
  assert.deepEqual(frames[0].variables.a, [5, 6]); // earlier frames are not mutated
  assert.throws(() => [...execute([set, block("assign", "a[5]", "1")])]);
});
test("input block can fill an array element", () => {
  const loop = block("for", "i", "0; 2");
  loop.children = [block("input", "a[i]")];
  const run = execute([
    block("declare", "a", "[]"),
    loop,
    block("output", "", "a"),
  ]);
  const inputs = ["4", "x", "6"];
  let frame = run.next();
  let last = "";
  while (!frame.done) {
    if (frame.value.output !== undefined) last = frame.value.output;
    frame = run.next(frame.value.input ? inputs.shift() : undefined);
  }
  assert.equal(last, '[4, "x", 6]');
});
