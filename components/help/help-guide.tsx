import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function HelpGuide() {
  return (
    <main className="content-page">
      <section className="content-card help-card">
        <span className="modal-eyebrow">
          <Sparkles size={17} />
          ЭХЛЭХЭД АМАРХАН
        </span>
        <h1>Санаагаа алгоритм болгоё.</h1>
        <div className="help-steps">
          <div>
            <b>1</b>
            <span>
              <strong>Блокуудаа угсар</strong>Зүүн талын блокийг дарж нэмнэ.
              Схемийн + тэмдгээр хүссэн байрлалдаа оруулна.
            </span>
          </div>
          <div>
            <b>2</b>
            <span>
              <strong>Үйлдлээ тохируул</strong>Блок дээр дарж хувьсагчийн нэр,
              тооцоолол, нөхцөлөө бичнэ. Нөхцөл, давталтын дотор мөн блок нэмж
              болно.
            </span>
          </div>
          <div>
            <b>3</b>
            <span>
              <strong>Ажиллуулж, ажигла</strong>Оролтын утгыг консолд өгнө.
              Алхмаар товчоор блок бүрийг ажиллуулж, утгуудыг ажиглана.
            </span>
          </div>
        </div>
        <div className="help-note">
          Тооцоолол: <code>a + b</code> · Нөхцөл: <code>x &gt; 0</code> · Текст:{" "}
          <code>"Сайн уу"</code>
        </div>
        <Link className="button run-button" href="/editor">
          Засварлагч руу
          <ArrowRight size={15} />
        </Link>
      </section>
    </main>
  );
}
