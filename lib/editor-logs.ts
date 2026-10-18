import type { Log } from "../types/editor";

// Keep both DOM nodes and retained text bounded on small devices.
export function boundedLogs(logs: Log[]): Log[] {
  let remaining = 100_000;
  const result: Log[] = [];
  for (let index = logs.length - 1; index >= Math.max(0, logs.length - 500) && remaining > 0; index--) {
    const log = logs[index];
    const text = log.text.slice(-Math.min(remaining, 4000));
    result.push(text === log.text ? log : { ...log, text });
    remaining -= text.length;
  }
  return result.reverse();
}
