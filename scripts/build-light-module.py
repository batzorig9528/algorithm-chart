"""Regenerate the browser module after editing public/pygame/light/pygame.py."""
import json
from pathlib import Path
root = Path(__file__).resolve().parent.parent
source = (root / 'public/pygame/light/pygame.py').read_text()
compile(source, 'pygame.py', 'exec')
(root / 'public/pygame/light/pygame-module.js').write_text('// Generated from pygame.py by scripts/build-light-module.py\nself.FLOW_PYGAME_SOURCE = ' + json.dumps(source, ensure_ascii=False) + ';\n')
