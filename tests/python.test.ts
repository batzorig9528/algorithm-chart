import { examples } from "../lib/examples";
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { block, type Block } from "../lib/flow";
import { pythonCode } from "../lib/python";

function run(blocks: Block[], input = "") {
  const result = spawnSync("python3", ["-c", pythonCode(blocks)], {
    input,
    encoding: "utf8",
    timeout: 3000,
  });
  assert.equal(
    result.status,
    0,
    result.stderr || result.error?.message || "Python process failed",
  );
  return result.stdout.trim();
}
test("generated Python runs examples with matching outputs", () => {
  assert.equal(run(examples[0].make(), "7\n5\n"), "12");
  assert.equal(run(examples[1].make(), "4\n"), "Тэгш тоо");
  assert.equal(run(examples[1].make(), "7\n"), "Сондгой тоо");
  assert.equal(run(examples[2].make(), "10\n"), "55");
});
test("empty branches and blank projects produce executable Python", () => {
  assert.equal(run([]), "");
  assert.equal(run([block("if", "", "true")]), "");
  assert.equal(run([block("while", "", "false")]), "");
});
test("Python preserves strings, mixed addition, booleans and operator precedence", () => {
  assert.equal(
    run([
      block("declare", "n", "3"),
      block("output", "", '"true && !false"'),
      block("output", "", '"Тоо: " + n'),
      block("output", "", "!(n < 2) && true"),
      block("output", "", "n > 2 == true"),
      block("output", "", "-5 % 2"),
      block("output", "", "true == 1"),
      block("output", "", "2 + 3 * (4 - 1)"),
    ]),
    "true && !false\nТоо: 3\ntrue\ntrue\n-1\nfalse\n11",
  );
});
test("Python safely maps keywords and helper-name collisions", () => {
  assert.equal(
    run([
      block("declare", "class_", "2"),
      block("declare", "class", "3"),
      block("declare", "print", "5"),
      block("declare", "_flow_add", "7"),
      block("output", "", "class_ + class + print + _flow_add"),
    ]),
    "17",
  );
});
test("invalid expressions cannot inject Python source", () => {
  assert.throws(() => pythonCode([block("output", "", "x; print(1)")]));
  assert.throws(() => pythonCode([block("input", "x\nprint(1)")]));
});
test("for block generates Python matching the flow executor", () => {
  const loop = block("for", "i", "1; n");
  loop.children = [block("assign", "sum", "sum + i")];
  const blocks = [
    block("input", "n"),
    block("declare", "sum", "0"),
    loop,
    block("output", "", "sum"),
  ];
  assert.equal(run(blocks, "10\n"), "55");
  assert.equal(run(blocks, "0\n"), "0");
});
test("for block supports custom and negative steps", () => {
  const up = block("for", "i", "0; n; 2");
  up.children = [block("output", "", "i")];
  assert.equal(run([block("input", "n"), up], "6\n"), "0\n2\n4\n6");
  const down = block("for", "i", "n; 1; -2");
  down.children = [block("output", "", "i")];
  assert.equal(run([block("input", "n"), down], "5\n"), "5\n3\n1");
});
