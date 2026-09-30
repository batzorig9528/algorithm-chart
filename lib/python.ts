import { type Block, flatten, splitForBounds } from "./flow";
import { type Expression, parseExpression } from "./expression";

// Helpers preserve Flow's automatic number/text inputs and mixed text addition.
const helpers: Record<string, string> = {
  number: `def _flow_number(value):
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return 0
        if text.lower().startswith(("0x", "0b", "0o")):
            return int(text, 0)
    return float(value)`,
  text: `def _flow_text(value):
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)`,
  read: `def _flow_read():
    value = input()
    if not value.strip():
        raise ValueError("Оролтын утга хоосон байна.")
    try:
        number = _flow_number(value)
        if not __import__("math").isfinite(number):
            return value
        return int(number) if float(number).is_integer() else number
    except ValueError:
        return value`,
  add: `def _flow_add(left, right):
    if isinstance(left, str) or isinstance(right, str):
        return _flow_text(left) + _flow_text(right)
    return left + right`,
  equal: `def _flow_equal(left, right):
    def kind(value):
        return "bool" if isinstance(value, bool) else "text" if isinstance(value, str) else "number"
    return kind(left) == kind(right) and left == right`,
  compare: `def _flow_compare(left, right, operator):
    if not (isinstance(left, str) and isinstance(right, str)):
        left, right = _flow_number(left), _flow_number(right)
    return {"<": left < right, ">": left > right, "<=": left <= right, ">=": left >= right}[operator]`,
  logic: `def _flow_logic(left, right, operator):
    return (bool(left) and bool(right)) if operator == "and" else (bool(left) or bool(right))`,
};
const reserved = new Set(
  "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield print input float int str bool isinstance ValueError RuntimeError __import__ main".split(
    " ",
  ),
);

export function pythonCode(blocks: Block[]): string {
  const used = new Set<string>();
  const names = new Map<string, string>();
  const occupied = new Set(
    flatten(blocks)
      .map((b) => b.name)
      .filter(Boolean),
  );
  function name(value: string) {
    if (!/^[A-Za-z_]\w*$/.test(value))
      throw new Error(`Хувьсагчийн нэрийг шалгана уу: ${value}`);
    if (!names.has(value)) {
      let candidate = value;
      if (reserved.has(value) || value.startsWith("_flow_")) {
        candidate = `${value}_`;
        while (occupied.has(candidate) || candidate.startsWith("_flow_"))
          candidate = `var_${candidate}`;
      }
      occupied.add(candidate);
      names.set(value, candidate);
    }
    return names.get(value)!;
  }
  function helper(key: string) {
    used.add(key);
    if (key === "read" || key === "compare") used.add("number");
    if (key === "add") used.add("text");
    return `_flow_${key}`;
  }
  function numeric(node: Expression): boolean {
    return (
      (node.type === "literal" && typeof node.value !== "string") ||
      (node.type === "unary" && node.operator !== "!") ||
      (node.type === "binary" && ["-", "*", "/", "%"].includes(node.operator))
    );
  }
  function number(node: Expression): string {
    const rendered = render(node);
    return numeric(node) ? rendered : `${helper("number")}(${rendered})`;
  }
  function render(node: Expression): string {
    if (node.type === "literal")
      return typeof node.value === "boolean"
        ? node.value
          ? "True"
          : "False"
        : JSON.stringify(node.value);
    if (node.type === "variable") return name(node.name);
    if (node.type === "unary")
      return node.operator === "!"
        ? `(not ${render(node.operand)})`
        : `(${node.operator}${number(node.operand)})`;
    const left = render(node.left),
      right = render(node.right);
    switch (node.operator) {
      case "+":
        return numeric(node.left) && numeric(node.right)
          ? `(${left} + ${right})`
          : `${helper("add")}(${left}, ${right})`;
      case "-":
      case "*":
      case "/":
        return `(${number(node.left)} ${node.operator} ${number(node.right)})`;
      case "%":
        return `__import__("math").fmod(${number(node.left)}, ${number(node.right)})`;
      case "==":
        return `${helper("equal")}(${left}, ${right})`;
      case "!=":
        return `(not ${helper("equal")}(${left}, ${right}))`;
      case "&&":
      case "||":
        return `${helper("logic")}(${left}, ${right}, "${node.operator === "&&" ? "and" : "or"}")`;
      default:
        return `${helper("compare")}(${left}, ${right}, "${node.operator}")`;
    }
  }
  function emit(list: Block[], depth: number): string {
    const pad = "    ".repeat(depth);
    if (!list.length) return `${pad}pass`;
    return list
      .map((b) => {
        if (b.kind === "input")
          return `${pad}${name(b.name)} = ${helper("read")}()`;
        if (b.kind === "for") {
          const [start, end, step] = splitForBounds(b.expression);
          const bound = (source: string) =>
            `int(${number(parseExpression(source))})`;
          const stop = step
            ? `${bound(end)} + (1 if ${bound(step)} > 0 else -1), ${bound(step)}`
            : `${bound(end)} + 1`;
          return `${pad}for ${name(b.name)} in range(${bound(start)}, ${stop}):\n${pad}    _flow_steps += 1\n${pad}    if _flow_steps > 10000:\n${pad}        raise RuntimeError("Давталтын хязгаарт хүрлээ.")\n${emit(b.children, depth + 1)}`;
        }
        const expression = render(parseExpression(b.expression));
        if (b.kind === "if")
          return `${pad}if ${expression}:\n${emit(b.children, depth + 1)}${b.otherwise.length ? `\n${pad}else:\n${emit(b.otherwise, depth + 1)}` : ""}`;
        if (b.kind === "while")
          return `${pad}while ${expression}:\n${pad}    _flow_steps += 1\n${pad}    if _flow_steps > 10000:\n${pad}        raise RuntimeError("Давталтын хязгаарт хүрлээ.")\n${emit(b.children, depth + 1)}`;
        if (b.kind === "output")
          return `${pad}print(${helper("text")}(${expression}))`;
        return `${pad}${name(b.name)} = ${expression}`;
      })
      .join("\n");
  }
  const body = emit(blocks, 1);
  const loopCounter = flatten(blocks).some(
    (b) => b.kind === "while" || b.kind === "for",
  )
    ? "    _flow_steps = 0\n"
    : "";
  const support = [...used].map((key) => helpers[key]).join("\n\n");
  return `# Python 3 · Flow блокоос үүсгэсэн код\ndef main():\n${loopCounter}${body}\n${support ? `\n\n# Оролт болон тоо/текстийн үйлдлүүд\n${support}\n` : ""}\n\nif __name__ == "__main__":\n    main()\n`;
}
