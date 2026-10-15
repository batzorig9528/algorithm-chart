import { parseExpression, parseTarget, type Expression } from "./expression";
export type Kind =
  | "declare"
  | "input"
  | "output"
  | "assign"
  | "if"
  | "while"
  | "dowhile"
  | "for"
  | "function"
  | "call"
  | "return";
export const variableTypes = {
  int: "Бүхэл тоо",
  real: "Бодит тоо",
  string: "Текст",
  boolean: "Логик",
  array: "Массив",
};
export type VariableType = keyof typeof variableTypes;
export type Block = {
  id: string;
  kind: Kind;
  // declare: comma separated names · function: its name · call: the function called.
  name: string;
  // declare: optional initial value · function: comma separated parameters ·
  // call: comma separated arguments.
  expression: string;
  // declare only: the type of the declared variables.
  type?: VariableType;
  // call only: the variable that receives the returned value (optional).
  result?: string;
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
export type BlockShape =
  | "rectangle"
  | "parallelogram"
  | "diamond"
  | "hexagon"
  | "subroutine"
  | "terminator";
export const definitions: Record<
  Kind,
  {
    label: string;
    english: string;
    description: string;
    color: string;
    shape: BlockShape;
  }
> = {
  declare: {
    label: "Хувьсагч",
    english: "Declare",
    shape: "rectangle",
    description: "Хувьсагч зарлах",
    color: "yellow",
  },
  input: {
    label: "Оролт",
    english: "Input",
    shape: "parallelogram",
    description: "Гараас утга авах",
    color: "blue",
  },
  output: {
    label: "Гаралт",
    english: "Output",
    shape: "parallelogram",
    description: "Үр дүнг хэвлэх",
    color: "green",
  },
  assign: {
    label: "Утга олгох",
    english: "Assign",
    shape: "rectangle",
    description: "Тооцоолол хийх",
    color: "yellow",
  },
  if: {
    label: "Нөхцөл",
    english: "If / Else",
    shape: "diamond",
    description: "Нөхцөл шалгах",
    color: "red",
  },
  while: {
    label: "Давталт",
    english: "While",
    shape: "diamond",
    description: "Нөхцөл биелэх хооронд давтах",
    color: "orange",
  },
  dowhile: {
    label: "Заавал давталт",
    english: "Do while",
    shape: "diamond",
    description: "Нэг удаа гүйцэтгээд, нөхцөл биелэх хооронд давтах",
    color: "orange",
  },
  for: {
    label: "Тоолуур давталт",
    english: "For",
    shape: "hexagon",
    description: "Эхлэлээс төгсгөл хүртэл 1-ээр нэмэгдэн давтах",
    color: "orange",
  },
  function: {
    label: "Функц",
    english: "Function",
    shape: "subroutine",
    description: "Дахин ашиглах хэсэг тодорхойлох",
    color: "purple",
  },
  call: {
    label: "Функц дуудах",
    english: "Call",
    shape: "subroutine",
    description: "Тодорхойлсон функцээ дуудах",
    color: "purple",
  },
  return: {
    label: "Буцаах",
    english: "Return",
    shape: "terminator",
    description: "Функцээс утга буцааж гарах",
    color: "purple",
  },
};
// Comma separated names: declare "a, b, c" · function parameters "a, b".
export function splitNames(source: string): string[] {
  return source
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
export function defaultValue(type: VariableType): Value {
  return type === "string"
    ? ""
    : type === "boolean"
      ? false
      : type === "array"
        ? []
        : 0;
}
function checkType(type: VariableType, value: Value) {
  const ok =
    type === "int"
      ? typeof value === "number" && Number.isInteger(value)
      : type === "real"
        ? typeof value === "number"
        : type === "string"
          ? typeof value === "string"
          : type === "boolean"
            ? typeof value === "boolean"
            : Array.isArray(value);
  if (!ok) throw new Error(`Утга “${variableTypes[type]}” төрөлд тохирохгүй.`);
}
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
type Return = { value?: Value };
export function* execute(
  blocks: Block[],
): Generator<Frame, void, string | undefined> {
  let variables: Variables = Object.create(null);
  const functions = new Map<string, Block>();
  for (const b of flatten(blocks))
    if (b.kind === "function" && !functions.has(b.name.trim()))
      functions.set(b.name.trim(), b);
  let steps = 0;
  let depth = 0;
  const limit = () => {
    if (++steps > 10000)
      throw new Error(
        "10,000 алхмын хязгаарт хүрлээ. Давталтын нөхцөлийг шалгана уу.",
      );
  };
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
  // Runs a list of blocks; a `return` block stops it and hands the value upward.
  function* visit(
    list: Block[],
  ): Generator<Frame, Return | undefined, string | undefined> {
    for (const b of list) {
      limit();
      if (b.kind === "for" && !/^[A-Za-z_]\w*$/.test(b.name))
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
      } else if (b.kind === "declare") {
        const names = splitNames(b.name);
        if (!names.length || names.some((n) => !/^[A-Za-z_]\w*$/.test(n)))
          throw new Error("Хувьсагчийн нэр латин үсгээр эхэлсэн байх ёстой.");
        if (!b.expression.trim() && !b.type)
          throw new Error("Хувьсагчийн эхний утгыг бичнэ үү.");
        for (const n of names) {
          const value = b.expression.trim()
            ? evaluate(b.expression, variables)
            : defaultValue(b.type!);
          if (b.type) checkType(b.type, value);
          variables[n] = value;
        }
        yield { id: b.id, variables: { ...variables } };
      } else if (b.kind === "assign") {
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
        const returned = yield* visit(condition ? b.children : b.otherwise);
        if (returned) return returned;
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
          limit();
          variables[b.name] = i;
          yield { id: b.id, variables: { ...variables } };
          const returned = yield* visit(b.children);
          if (returned) return returned;
        }
      } else if (b.kind === "while") {
        while (true) {
          limit();
          const condition = Boolean(evaluate(b.expression, variables));
          yield { id: b.id, variables: { ...variables } };
          if (!condition) break;
          const returned = yield* visit(b.children);
          if (returned) return returned;
        }
      } else if (b.kind === "dowhile") {
        while (true) {
          limit();
          const returned = yield* visit(b.children);
          if (returned) return returned;
          const condition = Boolean(evaluate(b.expression, variables));
          yield { id: b.id, variables: { ...variables } };
          if (!condition) break;
        }
      } else if (b.kind === "return") {
        const value = b.expression.trim()
          ? evaluate(b.expression, variables)
          : undefined;
        yield { id: b.id, variables: { ...variables } };
        return { value };
      } else if (b.kind === "call") {
        const fn = functions.get(b.name.trim());
        if (!fn) throw new Error(`“${b.name}” функц олдсонгүй.`);
        const params = splitNames(fn.expression);
        const args = (
          parseExpression(`[${b.expression}]`) as Extract<
            Expression,
            { type: "array" }
          >
        ).items.map((item) => evaluateNode(item, variables));
        if (args.length !== params.length)
          throw new Error(
            `“${fn.name}” функц ${params.length} утга авна, ${args.length} өгөгдлөө.`,
          );
        if (++depth > 100)
          throw new Error("Функцийн дуудлага хэт гүнзгий байна.");
        yield { id: b.id, variables: { ...variables } };
        const caller = variables;
        variables = Object.create(null);
        params.forEach((p, i) => (variables[p] = args[i]));
        let returned: Return | undefined;
        try {
          returned = yield* visit(fn.children);
        } finally {
          variables = caller;
          depth--;
        }
        if (b.result?.trim()) {
          if (returned?.value === undefined)
            throw new Error(`“${fn.name}” функц утга буцаасангүй.`);
          store(b.result.trim(), returned.value);
        }
        yield { id: b.id, variables: { ...variables } };
      }
    }
    return undefined;
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
          (b.type === undefined || Object.hasOwn(variableTypes, b.type)) &&
          (b.result === undefined ||
            (typeof b.result === "string" && b.result.length <= 100)) &&
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
