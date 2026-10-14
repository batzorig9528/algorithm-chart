export const PYGAME_CHANNEL = "flow-pygame-v1";
export const PYGAME_LOAD_TIMEOUT = 60_000;

export type PygameStatus =
  "loading" | "running" | "completed" | "stopped" | "error";

export type PygameMessage = {
  channel: typeof PYGAME_CHANNEL;
  runId: string;
} & (
  | { type: "ready" | "running" | "completed" | "close" }
  | { type: "output" | "error"; text: string }
);

export function isPygameMessage(value: unknown): value is PygameMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  if (message.channel !== PYGAME_CHANNEL || typeof message.runId !== "string")
    return false;
  if (message.type === "output" || message.type === "error")
    return typeof message.text === "string";
  return ["ready", "running", "completed", "close"].includes(
    message.type as string,
  );
}

// Bound both the line count and very long lines, including print(..., end="").
export function appendPygameOutput(previous: string, chunk: string): string {
  return (previous + chunk).slice(-100_000).split("\n").slice(-500).join("\n");
}

export const PYGAME_EXAMPLE = `import asyncio
import pygame

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Миний Pygame")
clock = pygame.time.Clock()


async def main():
    x, y = 320.0, 200.0
    vx, vy = 140.0, 100.0
    radius = 24
    running = True
    print("Сумтай товчоор удирдах эсвэл дэлгэц дээр дарна уу.")

    while running:
        dt = min(clock.tick(60) / 1000, 0.05)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.MOUSEBUTTONDOWN:
                x, y = event.pos
                print("Хулгана:", event.pos)

        keys = pygame.key.get_pressed()
        dx = keys[pygame.K_RIGHT] - keys[pygame.K_LEFT]
        dy = keys[pygame.K_DOWN] - keys[pygame.K_UP]
        x += (dx * 260 if dx else vx) * dt
        y += (dy * 260 if dy else vy) * dt

        if x < radius or x > 640 - radius:
            vx = -vx
        if y < radius or y > 400 - radius:
            vy = -vy
        x = max(radius, min(640 - radius, x))
        y = max(radius, min(400 - radius, y))

        screen.fill((22, 24, 40))
        pygame.draw.circle(screen, (160, 143, 255), (int(x), int(y)), radius)
        pygame.draw.circle(screen, (235, 230, 255), (int(x) - 7, int(y) - 7), 6)
        pygame.display.flip()
        # Хөтөч дүрсээ шинэчилж, оролт авах боломж олгоно.
        await asyncio.sleep(0)

    pygame.quit()


asyncio.run(main())
`;
