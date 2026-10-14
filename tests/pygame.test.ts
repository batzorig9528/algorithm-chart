import assert from "node:assert/strict";
import { test } from "node:test";
import {
  appendPygameOutput,
  isPygameMessage,
  PYGAME_CHANNEL,
} from "../lib/pygame";

test("pygame messages require the channel, run ID and valid payload", () => {
  assert.equal(isPygameMessage(null), false);
  assert.equal(isPygameMessage({ type: "ready" }), false);
  assert.equal(
    isPygameMessage({ channel: "other", runId: "1", type: "ready" }),
    false,
  );
  assert.equal(
    isPygameMessage({ channel: PYGAME_CHANNEL, runId: "1", type: "run" }),
    false,
  );
  assert.equal(
    isPygameMessage({
      channel: PYGAME_CHANNEL,
      runId: "1",
      type: "error",
      text: {},
    }),
    false,
  );
  assert.equal(
    isPygameMessage({ channel: PYGAME_CHANNEL, runId: "1", type: "ready" }),
    true,
  );
  assert.equal(
    isPygameMessage({
      channel: PYGAME_CHANNEL,
      runId: "1",
      type: "output",
      text: "Сайн уу",
    }),
    true,
  );
});

test("console preserves partial writes and bounds lines and long output", () => {
  assert.equal(appendPygameOutput("Сайн ", "уу\n"), "Сайн уу\n");
  const result = appendPygameOutput(
    "old\n",
    Array.from({ length: 600 }, (_, i) => String(i)).join("\n"),
  );
  assert.equal(result.split("\n").length, 500);
  assert.equal(result.split("\n")[0], "100");
  assert.ok(result.endsWith("599"));
  assert.equal(
    appendPygameOutput("prefix", "x".repeat(120_000)).length,
    100_000,
  );
});
