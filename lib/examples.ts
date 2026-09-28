import { block, type Block } from "./flow";

export const examples = [
  {
    title: "Хоёр тооны нийлбэр",
    description: "Хоёр тоо оруулж, нийлбэрийг нь олъё.",
    level: "Анхан шат",
    tag: "Оролт · Тооцоолол",
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
    level: "Анхан шат",
    tag: "Нөхцөл · Үлдэгдэл",
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
    level: "Дунд шат",
    tag: "Давталт · Хувьсагч",
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
