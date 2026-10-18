"""Flow Light: a deliberately small pygame-compatible teaching API."""
import _flow_canvas as _c

QUIT = 256
KEYDOWN = 768
KEYUP = 769
MOUSEMOTION = 1024
MOUSEBUTTONDOWN = 1025
MOUSEBUTTONUP = 1026
K_LEFT = 1073741904
K_RIGHT = 1073741903
K_UP = 1073741906
K_DOWN = 1073741905
K_SPACE = 32
K_ESCAPE = 27
K_RETURN = 13
K_a = 97
K_d = 100
K_s = 115
K_w = 119

def init():
    return (1, 0)

def quit():
    _c.command('quit', [])

class Rect:
    def __init__(self, *args):
        if len(args) == 1:
            args = args[0]
        if len(args) == 2:
            args = [args[0][0], args[0][1], args[1][0], args[1][1]]
        self.x, self.y, self.width, self.height = args

    @property
    def left(self):
        return self.x

    @property
    def top(self):
        return self.y

    @property
    def right(self):
        return self.x + self.width

    @property
    def bottom(self):
        return self.y + self.height

    def colliderect(self, other):
        other = _rect(other)
        return self.x < other[0] + other[2] and self.right > other[0] and self.y < other[1] + other[3] and self.bottom > other[1]

    def collidepoint(self, *point):
        if len(point) == 1:
            point = point[0]
        return self.x <= point[0] < self.right and self.y <= point[1] < self.bottom

    def move(self, x, y):
        return Rect(self.x + x, self.y + y, self.width, self.height)

def _rect(value):
    if isinstance(value, Rect):
        return [value.x, value.y, value.width, value.height]
    return list(value)

class Surface:
    def __init__(self, size):
        self.width, self.height = size

    def fill(self, color):
        _c.command('fill', [color])

    def get_width(self):
        return self.width

    def get_height(self):
        return self.height

    def get_size(self):
        return (self.width, self.height)

    def blit(self, source, position):
        if not isinstance(source, _Text):
            raise NotImplementedError('Light горимд blit зөвхөн font.render текст зурна.')
        _c.command('text', [source.text, position, source.color, source.size])

class display:
    @staticmethod
    def set_mode(size):
        width, height = size
        if width < 1 or height < 1 or width > 1280 or height > 720:
            raise ValueError('Дэлгэцийн хэмжээ 1..1280 x 1..720 байна.')
        _c.command('size', [int(width), int(height)])
        return Surface((int(width), int(height)))

    @staticmethod
    def set_caption(title):
        _c.command('caption', [str(title)])

    @staticmethod
    def flip():
        _c.flush()

    @staticmethod
    def update():
        _c.flush()

class draw:
    @staticmethod
    def rect(surface, color, rect, width=0):
        _c.command('rect', [color, _rect(rect), width])

    @staticmethod
    def circle(surface, color, center, radius, width=0):
        _c.command('circle', [color, center, radius, width])

    @staticmethod
    def line(surface, color, start, end, width=1):
        _c.command('line', [color, start, end, width])

    @staticmethod
    def ellipse(surface, color, rect, width=0):
        _c.command('ellipse', [color, _rect(rect), width])

    @staticmethod
    def polygon(surface, color, points, width=0):
        _c.command('polygon', [color, points, width])

class Event:
    def __init__(self, item):
        self.type = item['type']
        self.key = item.get('key', 0)
        self.pos = tuple(item.get('pos', [0, 0]))
        self.button = item.get('button', 0)

class event:
    @staticmethod
    def get():
        return [Event(item) for item in _c.events()]

class _Keys:
    def __getitem__(self, key):
        return _c.is_pressed(key)

class key:
    @staticmethod
    def get_pressed():
        return _Keys()

class mouse:
    @staticmethod
    def get_pos():
        return tuple(_c.mouse_pos())

    @staticmethod
    def get_pressed():
        return tuple(_c.mouse_buttons())

class _Clock:
    def tick(self, fps=30):
        return _c.tick(fps)

class time:
    Clock = _Clock

    @staticmethod
    def get_ticks():
        return _c.ticks()

class _Text:
    def __init__(self, text, color, size):
        self.text, self.color, self.size = str(text), color, size

class _Font:
    def __init__(self, name, size):
        self.size = max(8, min(96, int(size)))

    def render(self, text, antialias, color):
        return _Text(text, color, self.size)

class font:
    Font = _Font
    SysFont = _Font
