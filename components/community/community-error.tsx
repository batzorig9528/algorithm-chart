"use client";

export function CommunityError({ retry }: { retry: () => void }) {
  return (
    <main className="content-page community-page">
      <section className="content-card community-state" role="alert">
        <h1>Мэдээлэл ачаалж чадсангүй</h1>
        <p>Түр хүлээгээд дахин оролдоно уу.</p>
        <button className="button run-button" onClick={retry}>
          Дахин оролдох
        </button>
      </section>
    </main>
  );
}
