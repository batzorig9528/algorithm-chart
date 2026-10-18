# Flow — Алгоритмыг дүрслэн бодъё

Next.js, React, TypeScript дээрх Монгол интерфэйстэй визуал алгоритм засварлагч.

## Ажиллуулах

Node.js 20.9+ болон PostgreSQL шаардлагатай.

```sh
cp .env.example .env        # DATABASE_URL-аа бөглөнө
npm install                 # Prisma client-ийг автоматаар үүсгэнэ
npm run db:migrate          # хүснэгтүүд үүсгэнэ
npm run db:seed             # жишээ бодлогууд + (SEED_TEACHER_* байвал) багшийн аккаунт
npm run dev
```

http://localhost:3000 хаягаар нээнэ. Порт ашиглагдаж байвал:

```sh
npm run dev -- --port 4327
```

## Боломжууд

- Хувьсагч, оролт, гаралт, утга олгох, нөхцөл, давталтын блокууд.
- Блок дээр дарж нэмэх, холбоосын `+` тэмдгээр байрлал сонгох, палеттаас чирж нэмэх.
- Нөхцөлийн тийм/үгүй салаа болон давталтын дотор блок нэмэх.
- Блокийн нэр, илэрхийллийг modal цонхонд засах, хадгалах, болих, устгах.
- “Өөрийн бодлого” товчоор нэр, нөхцөл бичээд хоосон схемээс чөлөөтэй угсрах.
- Сайтыг нээх, refresh хийх бүрд хоосон схемээс эхэлнэ. Өмнөх ажил автоматаар ачаалагдахгүй.
- Ажиллуулах, түр зогсоох, үргэлжлүүлэх, алхмаар гүйцэтгэх, хурд тохируулах.
- Консолд оролт өгөх, үр дүн харах, хувьсагчдын утгыг ажиглах.
- Блокуудаас Python 3 код үүсгэн харах, хуулах, `.py` файл татах; undo/redo; схем томруулах/жижигрүүлэх.
- Хоёр тооны нийлбэр, тэгш/сондгой, 1-ээс N хүртэлх нийлбэрийн жишээнүүд.
- Өмнөх ажлаа файлын цэсний “Өмнөх ажлыг нээх” товчоор сонгож сэргээх.
- Засвар хийсний дараа LocalStorage-д автоматаар хадгалах, `.flow.json` экспорт/импорт (нэрийн хажуугийн цэс).

Схем тухайн хөтөч дээр хадгалагдана. Хэрэглэгч, сесс, бодлогын сан PostgreSQL (Prisma) дээр хадгалагдана. Фонтууд апптай хамт үйлчлэгдэнэ.

## Үнэгүй хостинг дээр байршуулах (Vercel + Neon)

SQLite файл serverless хост дээр хадгалагддаггүй тул PostgreSQL ашиглана.

1. [neon.tech](https://neon.tech) дээр үнэгүй Postgres үүсгээд connection string-ээ хуулна.
2. Repo-г [vercel.com](https://vercel.com)-д import хийнэ.
3. Environment variables: `DATABASE_URL` (Neon-ийн pooled холболт), заавал биш `DIRECT_URL` (direct холболт, migration-д), `TEE_API_BASE_URL`.
4. Deploy хийхэд `vercel-build` скрипт `prisma migrate deploy`-г автоматаар ажиллуулна.
5. Эхний удаа seed хийх: өөрийн компьютер дээрээ `DATABASE_URL`, `SEED_TEACHER_EMAIL`, `SEED_TEACHER_PASSWORD`-ийг Neon-ийн утгаар тохируулаад `npm run db:seed`.

Тест: `npm test` нь `DATABASE_URL`-г ашиглана. Тест бүх хүснэгтийг цэвэрлэдэг тул `DATABASE_URL` локал (localhost) Postgres үед л DB-тэй тестүүд ажиллана, үгүй бол алгасна (мэдсээр байж хүчээр ажиллуулах бол `ALLOW_REMOTE_TEST_DB=1`).

## Илэрхийлэл

Хувьсагчийн нэр латин үсэг эсвэл `_`-ээр эхэлнэ. `a + b`, `n % 2 == 0`, `i <= n`, `"Нийлбэр: " + sum` зэрэг илэрхийлэл бичиж болно. `+ - * / %`, харьцуулах операторууд, `&&`, `||`, `!`, хаалт, тоо, текст, boolean дэмжинэ. Оролт болон утга олгох блок байхгүй хувьсагчийг үүсгэж болно.

Илэрхийллийг тусгай parser боловсруулдаг; JavaScript `eval` ашиглахгүй. Нэг ажиллуулалтыг 10,000 алхмаар хязгаарласан. Массив дэмжинэ: `[1, 2, 3]`, `[]` гэж зарлаж, `a[i]` (0-ээс эхэлнэ) гэж уншина, `len(a)` нь уртыг өгнө. Элемент өөрчлөхдөө "Утга олгох" блокийн нэр дээр `a[i]` гэж бичнэ; `a[len(a)]` нь төгсгөлд нэмнэ. Массивыг гаргахад `[1, 2, "a"]` хэлбэртэй хэвлэгдэнэ. Өөр функц, файлд хандах үйлдэл одоогоор дэмжихгүй.

## Python код

Python харагдац нь тухайн схемээс автоматаар үүснэ. `.py татах` товчоор авсан файлыг `python3 filename.py` командаар ажиллуулна. Тоо/текстийн оролт болон үйлдлүүдийг хадгалахын тулд шаардлагатай туслах функцууд кодтой хамт үүснэ. Хөтөчийн “Ажиллуулах” товч нь схемийг ажиллуулна.

## Pygame

Үндсэн цэсний **Pygame** холбоосоор `/pygame` хуудас нээнэ. Нэг Python файл
засаж **Ажиллуулах** дарахад тоглоом, консолын гаралт, алдаа modal дотор
харагдана. **Зогсоох**, **Дахин ажиллуулах**, **.py татах** боломжтой.
Код энэ төхөөрөмжийн LocalStorage-д автоматаар хадгалагдаж, refresh болон
navigation хийсний дараа сэргэнэ. Хадгалалт хаалттай эсвэл дүүрсэн бол мэдэгдэнэ;
**.py татах** товчоор нөөц хуулбар авч болно.

Редактор Python кодыг өнгөөр ялгаж, Python/Pygame функц болон өөрийн `def`
функцүүдийг санал болгоно. `Ctrl+Space` санал нээнэ, ↑/↓ сонгоно,
Enter/Tab оруулна, Esc хаана; Shift+Tab редактороос гарна. Хаалт, хашилт,
блокийн `:` дутуу зэрэг нийтлэг синтаксийн алдааг мөрөөр харуулна. Энэ нь
бүрэн Python compiler/type checker биш; үлдсэн алдааг ажиллуулах үед Python
мэдээлнэ. Туслах боломжууд интернетгүй ажиллах бөгөөд Python runtime-аас хамаарахгүй.
100,000 тэмдэгтээс урт файлд өнгө болон туслах шалгалтыг түр унтраана.

Үндсэн **Хөнгөн Python** горим нь төсөлд багтсан Skulpt interpreter болон
Canvas ашиглана. Runtime файлууд нийлээд ойролцоогоор 615 KB (шахалтгүй);
том Python WebAssembly эсвэл гаднын CDN-ээс файл татахгүй. Browser дотор
тусгаарласан iframe + disposable Worker ажиллана. Нэг тоглоомын worker,
нэг жижиг синтакс шалгах worker байна. 2 GB RAM төхөөрөмж бүрийн гүйцэтгэлийг
баталгаажуулаагүй боловч анхны таталт бүрэн Pygame-ээс мэдэгдэхүйц бага.

Дэмжих боломжууд:

- Python хувьсагч, list/tuple, индекс/slice, `if/else`, `for/while`, `def`, `return`.
- `pygame.display.set_mode`, `set_caption`, `flip`, `update`.
- `pygame.draw.rect`, `circle`, `line`, `ellipse`, `polygon`.
- `screen.fill`, `get_size`, `get_width`, `get_height`; `blit` нь зөвхөн текст.
- `pygame.font.SysFont`/`Font`, `render`; `pygame.Rect`, `colliderect`, `collidepoint`.
- Keyboard, mouse, event.get, key.get_pressed, mouse.get_pos/get_pressed.
- `pygame.time.Clock().tick(fps)` (1–60 FPS), `get_ticks`; random/math-ийн нийтлэг функцүүд.

Бүх дэмжих API нь `public/pygame/light/capabilities.json` файлд байна.
**Snake жишээ** нь жагсаалт, функц, давталт, keyboard, random, онооны текст ашиглана.
Тоглоомын давталт бүрд `clock.tick(30)` дуудна. Тасралтгүй тооцоолол 1.5 секундээс
хэтэрвэл worker алдаа буцаана; Stop нь iframe болон worker-ийг устгана.
Canvas 1280×720, код 100,000 тэмдэгт, кадрын зурах команд 2,000-аар хязгаарлагдана.

Дэмжигдэхгүй импорт, API, async/await болон файл/динамик кодын үйлдлүүдийг
редактор улаанаар доогуур зурж, шалтгааныг мөрөөр харуулна. Light горимын
Python compiler кодыг ажиллуулахгүйгээр синтаксийг шалгана. Статик шалгалт
динамикаар үүсгэсэн бүх объектын төрлийг мэдэхгүй; үлдсэн алдаа runtime-д харагдана.
Улаан тэмдэглэгээтэй үед light Run идэвхгүй байна.

**Бүрэн Pygame**-ийг тусад нь сонгоход хуучин Pygbag `archives/0.9` / Python 3.12 /
pygame-ce runtime гаднын CDN-ээс ачаална. Энэ горимд `async def main()`,
давталт бүрд `await asyncio.sleep(0)`, төгсгөлд `asyncio.run(main())` ашиглана.
Горим солих нь бичсэн кодыг өөрчлөхгүй; **Жишээг сэргээх** тухайн горимын жишээг оруулна.
Хоёр горим хоёулаа урьдчилан бэлтгэгдсэн нэг iframe-ийг Run дээр ашиглана.
Бүрэн горимын 3 минутын хүлээх/цуцлах сонголт хэвээр.

Skulpt-ийн хувилбар, эх сурвалж, лиценз `public/pygame/light/vendor/` дотор байна.
`pygame.py`-г өөрчилсний дараа `python scripts/build-light-module.py` ажиллуулж
browser bundle-ийг шинэчилнэ. Дэмжих API өөрчилбөл capabilities.json болон тестүүдийг шинэчилнэ.

Pygame-ийн UI, алдааны төлөв болон консолын хязгаарын тестүүд:

```sh
npx tsx --test tests/pygame.test.ts tests/python-editor.test.ts tests/light-runtime.test.ts
npx playwright test tests/pygame.spec.ts tests/light-pygame.spec.ts
```

Бодит WebAssembly runtime, canvas, гар/хулгана болон Python traceback шалгах
тестүүдийг интернеттэй үед тусад нь идэвхжүүлнэ:

```sh
PYGAME_RUNTIME_TESTS=1 npx playwright test tests/pygame.spec.ts --workers=1
```

## Шалгах

Python кодын тестэд `python3` шаардлагатай.

```sh
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Тестүүд үүсгэсэн Python кодуудыг Python 3-аар ажиллуулж үр дүнг шалгана.

Playwright нь 4327 порт дээр аппыг нээнэ. Тестүүд тооцоолол, оролт, салаалалт, давталт, өөрчлөлт хадгалах, undo/redo, экспорт болон responsive харагдацыг шалгана.

## Төслийн бүтэц

```text
app/
  page.tsx                 / → /editor чиглүүлэлт
  layout.tsx               HTML, metadata, фонт
  globals.css              CSS импортын дараалал
  (workspace)/
    layout.tsx             Shared provider, header, dialogs, toast
    editor/page.tsx        Алгоритм засварлагч
    problems/page.tsx      Бодлогын сан
    help/page.tsx          Гарын авлага
components/
  editor/                  Toolbar, palette, diagram, Python, console, variables
    dialogs/               Блок ба бодлогын modal цонхнууд
  problems/                Бодлогын сангийн харагдац
  help/                    Гарын авлагын харагдац
  layout/                  Нийтлэг navigation
  ui/                      Modal, icon button, toast
contexts/
  editor-context.tsx       Хуудсуудын хооронд хадгалагдах editor state
hooks/
  use-project.ts           LocalStorage болон undo/redo
  use-execution.ts         Алгоритм ажиллуулах, оролт, түр зогсоох
  use-editor-controller.ts Засварлах үйлдэл, modal, импорт/экспорт
lib/
  flow.ts                  Өгөгдлийн төрөл, interpreter, validation
  expression.ts            Илэрхийлэл задлах parser
  python.ts                Python код үүсгэх
  project-tree.ts          Блок нэмэх, засах, устгах цэвэр функцууд
  examples.ts              Жишээ бодлогууд
  editor-defaults.ts       Шинэ блокийн анхны утгууд
  download.ts              Файл татах нийтлэг функц
styles/                    Үүргээр тусгаарласан CSS
types/                    Editor-ийн UI төрлүүд
tests/                    Unit, Python, Playwright тестүүд
```

`page.tsx` файлууд зөвхөн тухайн хуудсын компонентыг угсарна. UI компонентууд `useEditor()`-оор хэрэгтэй state, action-уудаа авна. React-оос хамааралгүй тооцооллын логик `lib/` дотор байрлана. Шинэ боломж нэмэхдээ тохирох компонент/hook-д нэмнэ.

`(workspace)/layout.tsx` дахь provider-ийн ачаар navigation хийхэд схем, undo/redo, хувьсагчид, түр зогссон ажиллуулалт хадгалагдана. Хуудсыг refresh хийхэд хоосон схем нээгдэнэ. Хадгалсан төслийг файлын цэснээс хүссэн үедээ сэргээж болно. Хоосон схемээр эхлэх нь өмнөх хадгалалтыг дарж бичихгүй.

