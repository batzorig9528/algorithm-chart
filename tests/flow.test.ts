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
