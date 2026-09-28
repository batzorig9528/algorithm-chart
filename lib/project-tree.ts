import { flatten, type Block, type Project } from "./flow";
import type { Slot } from "@/types/editor";

export function updateProjectBlock(
  project: Project,
  id: string,
  patch: Partial<Block>,
): Project {
  const next = structuredClone(project);
  const target = flatten(next.blocks).find((b) => b.id === id);
  if (target) Object.assign(target, patch);
  return next;
}
export function insertProjectBlock(
  project: Project,
  block: Block,
  slot: Slot,
): Project {
  const next = structuredClone(project);
  const list = slot.parent
    ? flatten(next.blocks).find((b) => b.id === slot.parent)?.[slot.branch]
    : next.blocks;
  if (!list) throw new Error("Блок нэмэх байрлал олдсонгүй.");
  list.splice(slot.index, 0, block);
  return next;
}
export function removeProjectBlock(project: Project, id: string): Project {
  const next = structuredClone(project);
  function visit(list: Block[]) {
    const index = list.findIndex((b) => b.id === id);
    if (index >= 0) list.splice(index, 1);
    else
      list.forEach((b) => {
        visit(b.children);
        visit(b.otherwise);
      });
  }
  visit(next.blocks);
  return next;
}
