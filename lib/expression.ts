export type Expression =
  | { type: "literal"; value: number | string | boolean }
  | { type: "variable"; name: string }
  | { type: "unary"; operator: string; operand: Expression }
  | { type: "binary"; operator: string; left: Expression; right: Expression }
  | { type: "array"; items: Expression[] }
  | { type: "index"; target: Expression; index: Expression }
  | { type: "call"; name: string; args: Expression[] };

// Functions callable from expressions, e.g. `len(items)`.
export const functions = ["len"];

// An assign block may write one array element: `items[i]`.
export type Target = { name: string; index?: Expression };
export function parseTarget(source: string): Target {
  const match = /^\s*([A-Za-z_]\w*)\s*(?:\[([\s\S]*)\])?\s*$/.exec(source);
  if (!match) throw new Error(`Хувьсагчийн нэрийг шалгана уу: ${source}`);
  return {
    name: match[1],
    index: match[2] === undefined ? undefined : parseExpression(match[2]),
  };
}
export const targetName = (source: string) =>
  source.replace(/\s*\[[\s\S]*$/, "").trim();

export function parseExpression(source: string): Expression {
  const tokens: string[] = [];
  const pattern =
    /\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\d+(?:\.\d+)?|[A-Za-z_]\w*|==|!=|<=|>=|&&|\|\||[()[\],+\-*/%<>!])/gy;
  let offset = 0;
  while (offset < source.trimEnd().length) {
    pattern.lastIndex = offset;
    const match = pattern.exec(source);
    if (!match)
      throw new Error(`Илэрхийллийг шалгана уу: ${source.slice(offset)}`);
    tokens.push(match[1]);
    offset = pattern.lastIndex;
  }
  let cursor = 0;
  const priorities: Record<string, number> = {
    "||": 1,
    "&&": 2,
    "==": 3,
    "!=": 3,
    "<": 4,
    ">": 4,
    "<=": 4,
    ">=": 4,
    "+": 5,
    "-": 5,
    "*": 6,
    "/": 6,
    "%": 6,
  };
  function list(close: string): Expression[] {
    const items: Expression[] = [];
    if (tokens[cursor] === close) {
      cursor++;
      return items;
    }
    while (true) {
      items.push(expression(0));
      const t = tokens[cursor++];
      if (t === close) return items;
      if (t !== ",") throw new Error("Илэрхийллийн бичиглэлийг шалгана уу.");
    }
  }
  function atom(): Expression {
    let node = primary();
    while (tokens[cursor] === "[") {
      cursor++;
      const index = expression(0);
      if (tokens[cursor++] !== "]") throw new Error("Хаалт дутуу байна.");
      node = { type: "index", target: node, index };
    }
    return node;
  }
  function primary(): Expression {
    const t = tokens[cursor++];
    if (!t) throw new Error("Илэрхийлэл дутуу байна.");
    if (t === "(") {
      const value = expression(0);
      if (tokens[cursor++] !== ")") throw new Error("Хаалт дутуу байна.");
      return value;
    }
    if (t === "[") return { type: "array", items: list("]") };
    if (["-", "+", "!"].includes(t))
      return { type: "unary", operator: t, operand: atom() };
    if (/^\d/.test(t)) return { type: "literal", value: Number(t) };
    if (t[0] === '"') return { type: "literal", value: JSON.parse(t) };
    if (t[0] === "'")
      return {
        type: "literal",
        value: t.slice(1, -1).replace(/\\'/g, "'").replace(/\\n/g, "\n"),
      };
    if (t === "true" || t === "false")
      return { type: "literal", value: t === "true" };
    if (!/^[A-Za-z_]\w*$/.test(t))
      throw new Error(`Илэрхийллийг шалгана уу: ${t}`);
    if (tokens[cursor] === "(") {
      if (!functions.includes(t)) throw new Error(`“${t}” функц олдсонгүй.`);
      cursor++;
      return { type: "call", name: t, args: list(")") };
    }
    return { type: "variable", name: t };
  }
  function expression(min: number): Expression {
    let left = atom();
    while (
      cursor < tokens.length &&
      (priorities[tokens[cursor]] ?? -1) >= min
    ) {
      const operator = tokens[cursor++];
      left = {
        type: "binary",
        operator,
        left,
        right: expression(priorities[operator] + 1),
      };
    }
    return left;
  }
  const result = expression(0);
  if (cursor !== tokens.length)
    throw new Error("Илэрхийллийн бичиглэлийг шалгана уу.");
  return result;
}
