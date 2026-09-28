import { parseExpression, type Expression } from "./expression";
export type Kind = "declare" | "input" | "output" | "assign" | "if" | "while";
export type Block = {
  id: string;
  kind: Kind;
  name: string;
  expression: string;
  children: Block[];
  otherwise: Block[];
};
export type Value = number | string | boolean;
export type Variables = Record<string, Value>;
export type Project = { title: string; description?: string; blocks: Block[] };
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
    description: "Үйлдлийг давтах",
    color: "pink",
  },
};
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
  function visit(node: Expression): Value {
    if (node.type === "literal") return node.value;
    if (node.type === "variable") {
      if (Object.hasOwn(variables, node.name)) return variables[node.name];
      throw new Error(`“${node.name}” хувьсагч зарлагдаагүй байна.`);
    }
    if (node.type === "unary") {
      const value = visit(node.operand);
      if (node.operator === "!") return !value;
      return node.operator === "-" ? -Number(value) : Number(value);
    }
    let left = visit(node.left);
    const right = visit(node.right);
    const op = node.operator;
    switch (op) {
      case "+":
        left =
          typeof left === "string" || typeof right === "string"
            ? String(left) + String(right)
            : Number(left) + Number(right);
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
        left = left === right;
        break;
      case "!=":
        left = left !== right;
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
  const value = visit(parseExpression(source));
  if (typeof value === "number" && !Number.isFinite(value))
    throw new Error("Тооцооллын үр дүн хязгаараас хэтэрлээ.");
  return value;
}
export function* execute(
  blocks: Block[],
): Generator<Frame, void, string | undefined> {
  const variables: Variables = Object.create(null);
  let steps = 0;
  function* visit(list: Block[]): Generator<Frame, void, string | undefined> {
    for (const b of list) {
      if (++steps > 10000)
        throw new Error(
          "10,000 алхмын хязгаарт хүрлээ. Давталтын нөхцөлийг шалгана уу.",
        );
      if (
        ["declare", "assign", "input"].includes(b.kind) &&
        !/^[A-Za-z_]\w*$/.test(b.name)
      )
        throw new Error("Хувьсагчийн нэр латин үсгээр эхэлсэн байх ёстой.");
      if (b.kind === "input") {
        const value = yield {
          id: b.id,
          variables: { ...variables },
          input: b.name,
        };
        if (value === undefined || value.trim() === "")
          throw new Error("Оролтын утга хоосон байна.");
        variables[b.name] = Number.isFinite(Number(value))
          ? Number(value)
          : value;
        yield { id: b.id, variables: { ...variables } };
      } else if (b.kind === "declare" || b.kind === "assign") {
        variables[b.name] = evaluate(b.expression, variables);
        yield { id: b.id, variables: { ...variables } };
      } else if (b.kind === "output") {
        yield {
          id: b.id,
          variables: { ...variables },
          output: String(evaluate(b.expression, variables)),
        };
      } else if (b.kind === "if") {
        const condition = Boolean(evaluate(b.expression, variables));
        yield { id: b.id, variables: { ...variables } };
        yield* visit(condition ? b.children : b.otherwise);
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
    validList(p.blocks, 0)
  );
}
