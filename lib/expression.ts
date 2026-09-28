export type Expression =
  | { type: "literal"; value: number | string | boolean }
  | { type: "variable"; name: string }
  | { type: "unary"; operator: string; operand: Expression }
  | { type: "binary"; operator: string; left: Expression; right: Expression };

export function parseExpression(source: string): Expression {
  const tokens: string[] = [];
  const pattern =
    /\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\d+(?:\.\d+)?|[A-Za-z_]\w*|==|!=|<=|>=|&&|\|\||[()+\-*/%<>!])/gy;
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
  function atom(): Expression {
    const t = tokens[cursor++];
    if (!t) throw new Error("Илэрхийлэл дутуу байна.");
    if (t === "(") {
      const value = expression(0);
      if (tokens[cursor++] !== ")") throw new Error("Хаалт дутуу байна.");
      return value;
    }
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
