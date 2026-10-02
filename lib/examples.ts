import { block, type Block } from "./flow";

export type ExampleTest = {
  input: string;
  expected: string;
  isSample: boolean;
};

export const examples = [
  {
    title: "Хоёр тооны нийлбэр",
    description: "Хоёр тоо оруулж, нийлбэрийг нь олъё.",
    inputFormat: "Нэг мөрөнд нэг тоо, нийт хоёр тоо.",
    outputFormat: "Хоёр тооны нийлбэр.",
    level: "Анхан шат",
    tag: "Оролт · Тооцоолол",
    tests: [
      { input: "7\n5", expected: "12", isSample: true },
      { input: "-3\n10", expected: "7", isSample: true },
      { input: "0\n0", expected: "0", isSample: false },
      { input: "2.5\n1.5", expected: "4", isSample: false },
    ] as ExampleTest[],
    make: (): Block[] => [
      block("input", "a"),
      block("input", "b"),
      block("assign", "sum", "a + b"),
      block("output", "", "sum"),
    ],
  },
  {
    title: "Тэгш үү, сондгой юу?",
    description: "Тооны үлдэгдлээр нөхцөл шалгаж суръя.",
    inputFormat: "Нэг бүхэл тоо n.",
    outputFormat: "n тэгш бол «Тэгш тоо», сондгой бол «Сондгой тоо».",
    level: "Анхан шат",
    tag: "Нөхцөл · Үлдэгдэл",
    tests: [
      { input: "4", expected: "Тэгш тоо", isSample: true },
      { input: "7", expected: "Сондгой тоо", isSample: true },
      { input: "0", expected: "Тэгш тоо", isSample: false },
      { input: "-3", expected: "Сондгой тоо", isSample: false },
    ] as ExampleTest[],
    make: (): Block[] => {
      const condition = block("if", "", "n % 2 == 0");
      condition.children = [block("output", "", '"Тэгш тоо"')];
      condition.otherwise = [block("output", "", '"Сондгой тоо"')];
      return [block("input", "n"), condition];
    },
  },
  {
    title: "1-ээс N хүртэлх нийлбэр",
    description: "Давталт ашиглан тоонуудыг нэмье.",
    inputFormat: "Нэг натурал тоо n.",
    outputFormat: "1 + 2 + … + n нийлбэр.",
    level: "Дунд шат",
    tag: "Давталт · Хувьсагч",
    tests: [
      { input: "10", expected: "55", isSample: true },
      { input: "1", expected: "1", isSample: false },
      { input: "100", expected: "5050", isSample: false },
      { input: "0", expected: "0", isSample: false },
    ] as ExampleTest[],
    make: (): Block[] => {
      const loop = block("while", "", "i <= n");
      loop.children = [
        block("assign", "sum", "sum + i"),
        block("assign", "i", "i + 1"),
      ];
      return [
        block("input", "n"),
        block("declare", "sum", "0"),
        block("declare", "i", "1"),
        loop,
        block("output", "", "sum"),
      ];
    },
  },
];
