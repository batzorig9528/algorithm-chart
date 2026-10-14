import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { block, type Block } from "../lib/flow";
import { runBlocks } from "../lib/judge";
import { pythonCode } from "../lib/python";

function python(blocks: Block[]) {
  const result = spawnSync("python3", ["-c", pythonCode(blocks)], {
    encoding: "utf8",
    timeout: 3000,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim().split("\n").filter(Boolean);
}
// Both the block engine and the generated Python must agree.
function both(blocks: Block[], expected: string[]) {
  assert.deepEqual(runBlocks(blocks, "").output, expected);
  assert.deepEqual(python(blocks), expected);
}
function typed(name: string, type: Block["type"], expression = "") {
  const b = block("declare", name, expression);
  b.type = type;
  return b;
}

test("declare creates several typed variables with default values", () => {
  both(
    [
      typed("a, b", "int"),
      typed("s", "string"),
      typed("ok", "boolean"),
      typed("items", "array"),
      block("output", "", 'a + b + "|" + s + "|" + ok + "|" + len(items)'),
    ],
    ["0||false|0"],
  );
});
test("declare with a value sets every name and checks the type", () => {
  both([typed("x, y", "int", "5"), block("output", "", "x + y")], ["10"]);
  assert.match(
    runBlocks([typed("x", "int", '"hi"')], "").error ?? "",
    /тохирохгүй/,
  );
  assert.match(
    runBlocks([typed("x", "int", "1.5")], "").error ?? "",
    /тохирохгүй/,
  );
});
test("do-while runs the body once before checking the condition", () => {
  const loop = block("dowhile", "", "i < 3");
  loop.children = [block("output", "", "i"), block("assign", "i", "i + 1")];
  both([block("declare", "i", "5"), loop], ["5"]);
  const counting = block("dowhile", "", "i < 3");
  counting.children = [block("output", "", "i"), block("assign", "i", "i + 1")];
  both([block("declare", "i", "0"), counting], ["0", "1", "2"]);
});
test("function call passes arguments, returns a value and has its own scope", () => {
  const add = block("function", "add", "a, b");
  add.children = [block("assign", "t", "a + b"), block("return", "", "t")];
  both(
    [
      add,
      block("declare", "t", "100"),
      block("call", "add", "2, 3"),
      Object.assign(block("call", "add", "t, 1"), { result: "r" }),
      block("output", "", "r"),
      block("output", "", "t"),
    ],
    ["101", "100"],
  );
});
test("functions can recurse and return from inside loops", () => {
  const fact = block("function", "fact", "n");
  const base = block("if", "", "n <= 1");
  base.children = [block("return", "", "1")];
  const rest = Object.assign(block("call", "fact", "n - 1"), { result: "m" });
  fact.children = [base, rest, block("return", "", "n * m")];
  both(
    [
      fact,
      Object.assign(block("call", "fact", "5"), { result: "r" }),
      block("output", "", "r"),
    ],
    ["120"],
  );
});
test("call reports unknown functions, wrong argument counts and missing returns", () => {
  assert.match(
    runBlocks([block("call", "nope", "")], "").error ?? "",
    /олдсонгүй/,
  );
  const f = block("function", "f", "a");
  assert.match(
    runBlocks([f, block("call", "f", "1, 2")], "").error ?? "",
    /1 утга/,
  );
  assert.match(
    runBlocks([f, Object.assign(block("call", "f", "1"), { result: "r" })], "")
      .error ?? "",
    /буцаасангүй/,
  );
});
