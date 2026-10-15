import { definitions, type BlockShape, type Kind } from "@/lib/flow";

const shapePaths: Record<BlockShape, string> = {
  rectangle: "M3 5H33V23H3Z",
  parallelogram: "M9 5H33L27 23H3Z",
  diamond: "M18 2L34 14L18 26L2 14Z",
  hexagon: "M9 4H27L34 14L27 24H9L2 14Z",
  subroutine: "M3 5H33V23H3Z M8 5V23 M28 5V23",
  terminator: "M12 5H24A9 9 0 0 1 24 23H12A9 9 0 0 1 12 5Z",
};

export function BlockShapeIcon({ kind }: { kind: Kind }) {
  const { shape, color } = definitions[kind];
  return (
    <svg
      className={`block-shape ${color}`}
      width="36"
      height="28"
      viewBox="0 0 36 28"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={shapePaths[shape]}
        fill="var(--block-bg)"
        stroke="var(--block-color)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
