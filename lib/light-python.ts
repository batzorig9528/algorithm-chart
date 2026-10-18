import manifest from "../public/pygame/light/capabilities.json";
import { analyzePython, ASSIST_LIMIT, type PythonIssue } from "./python-editor";

export const LIGHT_API: Record<string, string[]> = manifest;
export type LightIssue = PythonIssue & { to: number };

// Conservative checks for statically named APIs. Dynamic Python attribute access
// still receives a runtime error; this is not a full type checker.
export function lightPythonIssues(source: string): LightIssue[] {
  if (source.length > ASSIST_LIMIT) return [{ from: 0, to: 1, line: 1, message: "Хөнгөн горимд код 100,000 тэмдэгтээс хэтрэхгүй." }];
  const masked = source.split("");
  for (const token of analyzePython(source).tokens) {
    if (token.kind === "comment" || token.kind === "string") {
      for (let i = token.from; i < token.to; i++) if (masked[i] !== "\n") masked[i] = " ";
    }
  }
  const code = masked.join("");
  const issues: LightIssue[] = [];
  const add = (from: number, text: string, message: string) => {
    if (issues.length < 30 && !issues.some(issue => issue.from === from)) issues.push({ from, to: from + text.length, line: source.slice(0, from).split("\n").length, message });
  };
  const aliases = new Map<string, string>([["pygame", "pygame"], ["random", "random"], ["math", "math"]]);
  for (const match of code.matchAll(/\bimport\s+([^\n;]+)/g)) {
    // from-import is handled below.
    const before = code.slice(code.lastIndexOf("\n", match.index) + 1, match.index);
    if (/\bfrom\b/.test(before)) continue;
    for (const part of match[1].split(",")) {
      const imported = /^\s*([\w.]+)(?:\s+as\s+(\w+))?/.exec(part);
      if (!imported) continue;
      const name = imported[1], at = match.index! + match[0].indexOf(name);
      if (!["pygame", "random", "math"].includes(name)) add(at, name, `“${name}” модуль хөнгөн горимд дэмжигдэхгүй. Бүрэн Pygame горим сонгоно уу.`);
      else aliases.set(imported[2] || name, name);
    }
  }
  for (const match of code.matchAll(/\bfrom\s+([\w.]+)\s+import\s+([^\n;]+)/g)) {
    const module = match[1];
    if (!["pygame", "random", "math"].includes(module)) {
      add(match.index!, match[0], `“${module}” модуль хөнгөн горимд дэмжигдэхгүй.`); continue;
    }
    for (const item of match[2].split(",")) {
      const part = /^\s*(\w+|\*)(?:\s+as\s+(\w+))?/.exec(item);
      if (!part) continue;
      if (!LIGHT_API[module].includes(part[1])) add(match.index!, match[0], `“${part[1]}” импорт хөнгөн горимд дэмжигдэхгүй. import ${module} ашиглана уу.`);
      else aliases.set(part[2] || part[1], `${module}.${part[1]}`);
    }
  }
  const resolve = (value: string) => {
    const parts = value.split(".");
    return [aliases.get(parts[0]) ?? parts[0], ...parts.slice(1)].join(".");
  };
  // Track common objects returned by the supported constructors.
  for (const match of code.matchAll(/\b(\w+)\s*=\s*([A-Za-z_]\w*(?:\.\w+)*)\s*\(/g)) {
    const constructor = resolve(match[2]);
    const kind = ({ "pygame.display.set_mode": "Surface", "pygame.time.Clock": "Clock", "pygame.font.SysFont": "Font", "pygame.font.Font": "Font", "pygame.Rect": "Rect" } as Record<string, string>)[constructor];
    if (kind) aliases.set(match[1], kind);
  }
  for (const match of code.matchAll(/\b[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+/g)) {
    const resolved = resolve(match[0]).split(".");
    for (let i = 1; i < resolved.length; i++) {
      const owner = resolved.slice(0, i).join(".");
      if (LIGHT_API[owner] && !LIGHT_API[owner].includes(resolved[i])) {
        add(match.index!, match[0], `“${match[0]}” үйлдэл хөнгөн горимд дэмжигдэхгүй.`); break;
      }
    }
  }
  for (const match of code.matchAll(/\b(async|await)\b|\b(open|input|eval|exec|compile|__import__|getattr|setattr|delattr)\s*\(/g)) {
    add(match.index!, match[0], "Хөнгөн горимд энэ үйлдэл дэмжигдэхгүй. Давталтад clock.tick(30) ашиглана уу; эсвэл бүрэн горим сонгоно уу.");
  }
  return issues.sort((a, b) => a.from - b.from);
}
