import { parseExpression, parseTarget, type Expression } from "./expression";
export type Kind =
  "declare" | "input" | "output" | "assign" | "if" | "while" | "for";
export type Block = {
  id: string;
  kind: Kind;
  name: string;
  expression: string;
  children: Block[];
  otherwise: Block[];
};
export type Value = number | string | boolean | Value[];
export type Variables = Record<string, Value>;
export type Project = {
  title: string;
  description?: string;
  // Set when the project was opened from the problem library; enables "Шалгах".
  problemId?: number;
  blocks: Block[];
};
export type Frame = {
  id: string;
  variables: Variables;
  output?: string;
  input?: string;
};
export const definitions: Record<
  Kind,
  { label: string; english: string; description: string; color: string }
> = {
  declare: {
    label: "Хувьсагч",
    english: "Declare",
    description: "Хувьсагч зарлах",
    color: "violet",
  },
  input: {
    label: "Оролт",
    english: "Input",
    description: "Гараас утга авах",
    color: "blue",
  },
  output: {
    label: "Гаралт",
    english: "Output",
    description: "Үр дүнг хэвлэх",
    color: "green",
  },
  assign: {
    label: "Утга олгох",
    english: "Assign",
    description: "Тооцоолол хийх",
    color: "indigo",
  },
  if: {
    label: "Нөхцөл",
    english: "If / Else",
    description: "Нөхцөл шалгах",
    color: "amber",
  },
  while: {
    label: "Давталт",
    english: "While",
    description: "Нөхцөл биелэх хооронд давтах",
    color: "pink",
  },
  for: {
    label: "Тоолуур давталт",
    english: "For",
    description: "Эхлэлээс төгсгөл хүртэл 1-ээр нэмэгдэн давтах",
    color: "teal",
  },
};
// A "for" block keeps its range in `expression` as "start; end; step" (end inclusive,
// step optional and 1 by default; a negative step counts down).
export function splitForBounds(expression: string): [string, string, string] {
  const [start = "", end = "", step = ""] = expression
    .split(";")
    .map((part) => part.trim());
  return [start, end, step];
}
// Text form used by output blocks and string concatenation: [1, "a", true].
export function formatValue(value: Value, nested = false): string {
  if (Array.isArray(value))
    return `[${value.map((item) => formatValue(item, true)).join(", ")}]`;
  return nested && typeof value === "string"
    ? JSON.stringify(value)
    : String(value);
}
function sameValue(a: Value, b: Value): boolean {
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((item, i) => sameValue(item, b[i]))
    );
  return a === b;
}
function position(list: Value, index: Value, append = false): number {
  const n = Number(index);
  if (
    typeof index === "boolean" ||
    Array.isArray(index) ||
    !Number.isInteger(n)
  )
    throw new Error("Индекс бүхэл тоо байх ёстой.");
  const length =
    typeof list === "string" ? list.length : (list as Value[]).length;
  if (n < 0 || n > length - (append ? 0 : 1))
    throw new Error(`Индекс ${n} хүрээнээс гарлаа (урт ${length}).`);
  return n;
}

let serial = 0;
export function block(kind: Kind, name = "", expression = ""): Block {
  return {
    id: `b-${Date.now()}-${++serial}`,
    kind,
    name,
    expression,
    children: [],
    otherwise: [],
  };
}
export function flatten(blocks: Block[]): Block[] {
  return blocks.flatMap((b) => [
    b,
    ...flatten(b.children),
    ...flatten(b.otherwise),
  ]);
}

// Small expression parser: user expressions never execute as JavaScript.
export function evaluate(source: string, variables: Variables): Value {
  return evaluateNode(parseExpression(source), variables);
}
function evaluateNode(root: Expression, variables: Variables): Value {
  function visit(node: Expression): Value {
    if (node.type === "literal") return node.value;
    if (node.type === "variable") {
      if (Object.hasOwn(variables, node.name)) return variables[node.name];
      throw new Error(`“${node.name}” хувьсагч зарлагдаагүй байна.`);
    }
    if (node.type === "array") return node.items.map(visit);
    if (node.type === "index") {
      const list = visit(node.target);
      if (!Array.isArray(list) && typeof list !== "string")
        throw new Error("Индекс зөвхөн массив эсвэл текстэнд ашиглагдана.");
      const i = position(list, visit(node.index));
      return list[i];
    }
    if (node.type === "call") {
      if (node.args.length !== 1)
        throw new Error("len функц яг нэг утга авна.");
      const value = visit(node.args[0]);
      if (!Array.isArray(value) && typeof value !== "string")
        throw new Error("len функц массив эсвэл текст авна.");
      return value.length;
    }
    if (node.type === "unary") {
      const value = visit(node.operand);
      if (node.operator === "!") return !value;
      return node.operator === "-" ? -Number(value) : Number(value);
    }
    let left = visit(node.left);
    const right = visit(node.right);
    const op = node.operator;
    if (
      ["-", "*", "/", "%", "<", ">", "<=", ">="].includes(op) &&
      (Array.isArray(left) || Array.isArray(right))
    )
      throw new Error(
        "Массивыг тооцоолол эсвэл харьцуулалтад ашиглах боломжгүй.",
      );
    switch (op) {
      case "+":
        if (typeof left === "string" || typeof right === "string")
          left = formatValue(left) + formatValue(right);
        else if (Array.isArray(left) || Array.isArray(right))
          throw new Error("Массивыг + үйлдэлд ашиглах боломжгүй.");
        else left = Number(left) + Number(right);
        break;
      case "-":
        left = Number(left) - Number(right);
        break;
      case "*":
        left = Number(left) * Number(right);
        break;
      case "/":
      case "%":
        if (Number(right) === 0) throw new Error("Тэгээр хувааж болохгүй.");
        left =
          op === "/"
            ? Number(left) / Number(right)
            : Number(left) % Number(right);
        break;
      case "==":
        left = sameValue(left, right);
        break;
      case "!=":
        left = !sameValue(left, right);
        break;
      case "<":
        left = left < right;
        break;
      case ">":
        left = left > right;
        break;
      case "<=":
        left = left <= right;
        break;
      case ">=":
        left = left >= right;
        break;
      case "&&":
        left = Boolean(left) && Boolean(right);
        break;
      case "||":
        left = Boolean(left) || Boolean(right);
        break;
    }
    return left;
  }
  const value = visit(root);
  if (
    !Array.isArray(value) &&
    typeof value === "number" &&
    !Number.isFinite(value)
  )
    throw new Error("Тооцооллын үр дүн хязгаараас хэтэрлээ.");
  return value;
}
export function* execute(
  blocks: Block[],
): Generator<Frame, void, string | undefined> {
  const variables: Variables = Object.create(null);
  let steps = 0;
  // Writes a variable, or one element of an array when the name is `a[i]`.
  function store(name: string, value: Value) {
    if (!name.includes("[")) {
      if (!/^[A-Za-z_]\w*$/.test(name))
        throw new Error("Хувьсагчийн нэр латин үсгээр эхэлсэн байх ёстой.");
      variables[name] = value;
      return;
    }
    const target = parseTarget(name);
    const list = Object.hasOwn(variables, target.name)
      ? variables[target.name]
      : undefined;
    if (!Array.isArray(list))
      throw new Error(`“${target.name}” массив биш байна.`);
    const next = [...list];
    next[position(list, evaluateNode(target.index!, variables), true)] = value;
    variables[target.name] = next;
  }
  function* visit(list: Block[]): Generator<Frame, void, string | undefined> {
    for (const b of list) {
      if (++steps > 10000)
        throw new Error(
          "10,000 алхмын хязгаарт хүрлээ. Давталтын нөхцөлийг шалгана уу.",
        );
      if (["declare", "for"].includes(b.kind) && !/^[A-Za-z_]\w*$/.test(b.name))
        throw new Error("Хувьсагчийн нэр латин үсгээр эхэлсэн байх ёстой.");
      if (b.kind === "input") {
        const value = yield {
          id: b.id,
          variables: { ...variables },
          input: b.name,
        };
        if (value === undefined || value.trim() === "")
          throw new Error("Оролтын утга хоосон байна.");
        store(b.name, Number.isFinite(Number(value)) ? Number(value) : value);
        yield { id: b.id, variables: { ...variables } };
      } else if (b.kind === "declare" || b.kind === "assign") {
        store(b.name, evaluate(b.expression, variables));
        yield { id: b.id, variables: { ...variables } };
      } else if (b.kind === "output") {
        yield {
          id: b.id,
          variables: { ...variables },
          output: formatValue(evaluate(b.expression, variables)),
        };
      } else if (b.kind === "if") {
        const condition = Boolean(evaluate(b.expression, variables));
        yield { id: b.id, variables: { ...variables } };
        yield* visit(condition ? b.children : b.otherwise);
      } else if (b.kind === "for") {
        const [startSource, endSource, stepSource] = splitForBounds(
          b.expression,
        );
        const start = Number(evaluate(startSource, variables));
        const end = Number(evaluate(endSource, variables));
        const step = Math.trunc(Number(evaluate(stepSource || "1", variables)));
        if (!Number.isFinite(start) || !Number.isFinite(end))
          throw new Error("Тоолуур давталтын хязгаар тоо байх ёстой.");
        if (!Number.isFinite(step) || step === 0)
          throw new Error("Давталтын өөрчлөлт 0 эсвэл тоо биш байна.");
        for (
          let i = Math.trunc(start);
          step > 0 ? i <= Math.trunc(end) : i >= Math.trunc(end);
          i += step
        ) {
          if (++steps > 10000)
            throw new Error(
              "10,000 алхмын хязгаарт хүрлээ. Давталтын нөхцөлийг шалгана уу.",
            );
          variables[b.name] = i;
          yield { id: b.id, variables: { ...variables } };
          yield* visit(b.children);
        }
      } else {
        while (true) {
          if (++steps > 10000)
            throw new Error(
              "10,000 алхмын хязгаарт хүрлээ. Давталтын нөхцөлийг шалгана уу.",
            );
          const condition = Boolean(evaluate(b.expression, variables));
          yield { id: b.id, variables: { ...variables } };
          if (!condition) break;
          yield* visit(b.children);
        }
      }
    }
  }
  yield* visit(blocks);
}
export function validateProject(value: unknown): value is Project {
  let count = 0;
  const ids = new Set<string>();
  function validList(list: unknown, depth: number): boolean {
    return (
      depth < 15 &&
      Array.isArray(list) &&
      list.every((b) => {
        if (++count > 300 || !b || typeof b.id !== "string" || ids.has(b.id))
          return false;
        ids.add(b.id);
        return (
          Object.hasOwn(definitions, b.kind) &&
          typeof b.name === "string" &&
          typeof b.expression === "string" &&
          b.expression.length <= 1000 &&
          validList(b.children, depth + 1) &&
          validList(b.otherwise, depth + 1)
        );
      })
    );
  }
  const p = value as Project;
  return (
    !!p &&
    typeof p.title === "string" &&
    p.title.length <= 100 &&
    (p.description === undefined ||
      (typeof p.description === "string" && p.description.length <= 5000)) &&
    (p.problemId === undefined || Number.isInteger(p.problemId)) &&
    validList(p.blocks, 0)
  );
}
