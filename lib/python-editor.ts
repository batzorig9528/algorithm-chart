// Small, offline editor assistance. This is deliberately not a Python compiler:
// Python itself reports remaining syntax/runtime errors when the program runs.
export const ASSIST_LIMIT = 100_000;
export type PythonToken = { from: number; to: number; kind: string };
export type PythonIssue = { from: number; line: number; message: string };
const keywords = new Set("False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case".split(" "));
const builtins = "print input len range int float str bool list dict set tuple enumerate zip min max sum abs round sorted open isinstance super".split(" ");

export function analyzePython(source: string) {
  const tokens: PythonToken[] = [];
  const issues: PythonIssue[] = [];
  if (source.length > ASSIST_LIMIT) return { tokens, issues };
  const stack: { char: string; from: number; line: number }[] = [];
  const clean = source.split("");
  const issue = (from: number, line: number, message: string) => {
    if (issues.length < 20) issues.push({ from, line, message });
  };
  let i = 0, line = 1;
  while (i < source.length) {
    const start = i, startLine = line, ch = source[i];
    let kind = "";
    if (ch === "#") {
      while (i < source.length && source[i] !== "\n") i++;
      kind = "comment";
    } else if (ch === "'" || ch === '"') {
      const triple = source.slice(i, i + 3) === ch.repeat(3);
      const end = triple ? ch.repeat(3) : ch;
      i += end.length;
      let closed = false;
      while (i < source.length) {
        if (source.slice(i, i + end.length) === end) { i += end.length; closed = true; break; }
        if (source[i] === "\\") {
          if (source[i + 1] === "\n") line++;
          i = Math.min(i + 2, source.length);
        } else {
          if (source[i] === "\n") { if (!triple) break; line++; }
          i++;
        }
      }
      if (!closed) issue(start, startLine, "Текстийн хашилт хаагдаагүй байна.");
      kind = "string";
    } else if (/[A-Za-z_]/.test(ch)) {
      while (i < source.length && /[\w]/.test(source[i])) i++;
      const word = source.slice(start, i);
      kind = keywords.has(word) ? "keyword" : builtins.includes(word) ? "builtin" : /^\s*\(/.test(source.slice(i)) ? "function" : "name";
    } else if (/\d/.test(ch)) {
      const number = /^(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.[\d_]*)?(?:[eE][+-]?[\d_]+)?j?)/.exec(source.slice(i))!;
      i += number[0].length;
      kind = "number";
    } else {
      if ("([{".includes(ch)) stack.push({ char: ch, from: i, line });
      if (")]}".includes(ch)) {
        const previous = stack.pop();
        if (!previous || "([{".indexOf(previous.char) !== ")]}".indexOf(ch)) issue(i, line, `“${ch}” хаалт тохирохгүй байна.`);
      }
      if (ch === "\n") line++;
      i++;
    }
    if (kind) tokens.push({ from: start, to: i, kind });
    if (kind === "comment" || kind === "string") {
      for (let j = start; j < i; j++) if (clean[j] !== "\n") clean[j] = " ";
      // A string still counts as a statement, e.g. if x: print("hello").
      if (kind === "string") clean[start] = "x";
    }
  }
  for (const open of stack) issue(open.from, open.line, `“${open.char}” хаалт хаагдаагүй байна.`);
  let offset = 0, depth = 0, continued = false;
  clean.join("").split("\n").forEach((text, index) => {
    const trimmed = text.trim();
    const initialDepth = depth;
    for (const char of text) {
      if ("([{".includes(char)) depth++;
      if (")]}".includes(char)) depth--;
    }
    if (!continued && initialDepth === 0 && depth === 0 && !trimmed.endsWith("\\") &&
        /^(?:(?:async\s+)?(?:def|for|with)\b|if\b|elif\b|else\b|while\b|class\b|try\b|except\b|finally\b)/.test(trimmed) &&
        !trimmed.includes(":")) {
      issue(offset + text.search(/\S/), index + 1, "Блокийн нөхцөл эсвэл тодорхойлолтын ард : дутуу байна.");
    }
    continued = trimmed.endsWith("\\");
    offset += text.length + 1;
  });
  return { tokens, issues: issues.sort((a, b) => a.from - b.from) };
}

export type PythonCompletion = { label: string; insert: string; detail: string };
const functions: PythonCompletion[] = builtins.map(label => ({ label, insert: `${label}()`, detail: "Python функц" }));
const members: Record<string, string[]> = {
  pygame: ["init()", "quit()", "display", "draw", "event", "key", "time", "mouse", "font", "Rect()", "Surface()", "QUIT", "KEYDOWN", "MOUSEBUTTONDOWN", "K_LEFT", "K_RIGHT", "K_UP", "K_DOWN"],
  "pygame.display": ["set_mode()", "set_caption()", "flip()", "update()"],
  "pygame.draw": ["circle()", "rect()", "line()", "ellipse()", "polygon()"],
  "pygame.event": ["get()", "pump()"],
  "pygame.key": ["get_pressed()"],
  "pygame.mouse": ["get_pos()", "get_pressed()"],
  "pygame.font": ["SysFont()", "Font()"],
  "pygame.time": ["Clock()", "get_ticks()"],
  asyncio: ["run()", "sleep()", "create_task()"],
  screen: ["fill()", "blit()", "get_width()", "get_height()"],
  clock: ["tick()", "get_fps()"],
};
export function pythonCompletions(source: string, cursor: number, explicit = false) {
  const empty = { from: cursor, options: [] as PythonCompletion[] };
  if (source.length > ASSIST_LIMIT) return empty;
  const match = /[A-Za-z_][\w.]*$/.exec(source.slice(0, cursor));
  if (!match && !explicit) return empty;
  const analysis = analyzePython(source);
  if (analysis.tokens.some(t => (t.kind === "string" || t.kind === "comment") && t.from < cursor &&
      (cursor < t.to || (cursor === t.to && (t.kind === "comment" || analysis.issues.some(issue => issue.from === t.from)))))) return empty;
  const word = match?.[0] ?? "";
  const dot = word.lastIndexOf(".");
  const prefix = word.slice(dot + 1);
  let options: PythonCompletion[];
  if (dot >= 0) {
    let owner = word.slice(0, dot);
    for (const alias of source.matchAll(/^\s*import\s+(pygame|asyncio)\s+as\s+(\w+)/gm)) {
      if (owner === alias[2] || owner.startsWith(alias[2] + ".")) owner = alias[1] + owner.slice(alias[2].length);
    }
    options = (members[owner] ?? []).map(insert => ({ label: insert.replace("()", ""), insert, detail: owner }));
  } else {
    const names = [...source.matchAll(/\bdef\s+([A-Za-z_]\w*)\s*\(/g)].map(m => ({ label: m[1], insert: `${m[1]}()`, detail: "Таны функц" }));
    options = [...names, ...functions, ...[...keywords, "pygame", "asyncio"].map(label => ({ label, insert: label, detail: "Python" }))];
  }
  const seen = new Set<string>();
  return { from: cursor - prefix.length, options: options.filter(o => {
    if (!o.label.startsWith(prefix) || seen.has(o.label)) return false;
    seen.add(o.label); return true;
  }).slice(0, 8) };
}
