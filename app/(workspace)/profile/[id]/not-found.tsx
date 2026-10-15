import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <main className="content-page community-page">
      <section className="content-card community-state">
        <h1>Хэрэглэгч олдсонгүй</h1>
        <p>Энэ профайл байхгүй эсвэл устгагдсан байна.</p>
        <Link className="button run-button" href="/rank">
          Эрэмбийн самбар руу
        </Link>
      </section>
    </main>
  );
}
