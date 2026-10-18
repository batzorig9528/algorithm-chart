export const LIGHT_EXAMPLE = `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 400))
pygame.display.set_caption("Миний тоглоом")
clock = pygame.time.Clock()
x, y = 320, 200
running = True

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.MOUSEBUTTONDOWN:
            x, y = event.pos

    keys = pygame.key.get_pressed()
    x += (keys[pygame.K_RIGHT] - keys[pygame.K_LEFT]) * 5
    y += (keys[pygame.K_DOWN] - keys[pygame.K_UP]) * 5
    x = max(20, min(620, x))
    y = max(20, min(380, y))
    screen.fill((22, 24, 40))
    pygame.draw.circle(screen, (160, 143, 255), (x, y), 20)
    pygame.display.flip()
    clock.tick(30)

pygame.quit()
`;

export const SNAKE_EXAMPLE = `import pygame
import random

pygame.init()
screen = pygame.display.set_mode((600, 400))
pygame.display.set_caption("Snake — Сумтай товчоор удирдана")
clock = pygame.time.Clock()
font = pygame.font.SysFont(None, 24)
cell = 20
snake = [(300, 200), (280, 200), (260, 200)]
direction = (20, 0)
score = 0
alive = True
running = True

def food_position():
    # Хоосон нүднээс сонгоно; дүүрсэн самбарт төгсгөлгүй давталт үүсэхгүй.
    free = []
    for row in range(2, 20):
        for col in range(30):
            point = (col * cell, row * cell)
            if point not in snake:
                free.append(point)
    return random.choice(free) if free else None

food = food_position()
while running:
    next_direction = direction
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP and direction != (0, 20):
                next_direction = (0, -20)
            elif event.key == pygame.K_DOWN and direction != (0, -20):
                next_direction = (0, 20)
            elif event.key == pygame.K_LEFT and direction != (20, 0):
                next_direction = (-20, 0)
            elif event.key == pygame.K_RIGHT and direction != (-20, 0):
                next_direction = (20, 0)
    direction = next_direction

    if alive:
        head = (snake[0][0] + direction[0], snake[0][1] + direction[1])
        eating = head == food
        body = snake if eating else snake[:-1]
        if head[0] < 0 or head[0] >= 600 or head[1] < 40 or head[1] >= 400 or head in body:
            alive = False
        else:
            snake.insert(0, head)
            if eating:
                score += 1
                food = food_position()
                if food is None:
                    alive = False
            else:
                snake.pop()

    screen.fill((22, 24, 40))
    for x, y in snake:
        pygame.draw.rect(screen, (100, 220, 150), (x, y, cell - 2, cell - 2))
    if food is not None:
        pygame.draw.rect(screen, (255, 130, 110), (food[0], food[1], cell - 2, cell - 2))
    label = font.render("Оноо: " + str(score), True, (235, 230, 255))
    screen.blit(label, (12, 8))
    if not alive:
        text = font.render("Дууслаа! Дахин ажиллуулах товчийг дарна уу.", True, (255, 180, 120))
        screen.blit(text, (35, 180))
    pygame.display.flip()
    clock.tick(10)

pygame.quit()
`;
