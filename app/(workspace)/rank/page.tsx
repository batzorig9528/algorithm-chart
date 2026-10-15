import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowUpRight, CheckCircle2, Trophy, Users } from "lucide-react";
import { db } from "@/lib/server/db";
import { getLeaderboard, parsePage } from "@/lib/server/community";
import { Pagination } from "@/components/community/pagination";

export const metadata: Metadata = { title: "Эрэмбэ — Flow" };

export default async function RankPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  await connection();
  const data = await getLeaderboard(db, parsePage((await searchParams).page));
  return (
    <main className="content-page community-page">
      <div className="community-container">
        <header className="community-heading">
          <div>
            <span className="community-eyebrow">
              <Trophy size={16} aria-hidden="true" /> FLOW COMMUNITY
            </span>
            <h1>Эрэмбийн самбар</h1>
            <p>
              Бодлого бүр нэг алхам урагш. Бодсон бодлогын тоогоор эрэмбэлэв.
            </p>
          </div>
          <Link className="button" href="/profile">
            Миний профайл <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </header>

        <dl className="community-stats">
          <div>
            <dt>
              <Users size={18} aria-hidden="true" /> Оролцогч
            </dt>
            <dd>{data.participants}</dd>
          </div>
          <div>
            <dt>
              <CheckCircle2 size={18} aria-hidden="true" /> Нийт бодолт
            </dt>
            <dd>{data.totalSolves}</dd>
          </div>
          <div>
            <dt>
              <Trophy size={18} aria-hidden="true" /> Хамгийн олон бодсон
            </dt>
            <dd>{data.highestCount}</dd>
          </div>
        </dl>

        <section className="community-panel" aria-labelledby="ranking-title">
          <div className="community-panel-heading">
            <h2 id="ranking-title">Нийт оролцогчид</h2>
            <span>Ижил тоо · Ижил байр</span>
          </div>
          {data.entries.length ? (
            <div className="community-table-wrap">
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th scope="col">Байр</th>
                    <th scope="col">Хэрэглэгч</th>
                    <th scope="col">Бодсон бодлого</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((entry) => (
                    <tr key={entry.userId}>
                      <td>
                        <span
                          className={`rank-badge${entry.rank <= 3 ? ` rank-${entry.rank}` : ""}`}
                        >
                          {entry.rank}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="ranking-user"
                          href={`/profile/${entry.userId}`}
                        >
                          <span className="community-avatar" aria-hidden="true">
                            {Array.from(entry.name)[0].toUpperCase()}
                          </span>
                          <span className="ranking-identity">
                            <strong>{entry.name}</strong>
                            <small>#{entry.userId}</small>
                          </span>
                          <ArrowUpRight
                            className="ranking-arrow"
                            size={16}
                            aria-hidden="true"
                          />
                        </Link>
                      </td>
                      <td className="ranking-score">{entry.solvedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="community-state">
              <Trophy size={36} aria-hidden="true" />
              <h2>Эхний байрыг эзлээрэй</h2>
              <p>
                Одоогоор бодлого бодсон хэрэглэгч алга. Нэвтэрч, эхний бодлогоо
                бодоорой.
              </p>
              <Link className="button run-button" href="/problems">
                Бодлого бодох
              </Link>
            </div>
          )}
          <Pagination page={data.page} pages={data.pages} href="/rank" />
        </section>
        <p className="community-note">
          Бүх тестийг амжилттай давсан бодлого бүрийг нэг удаа тооцно.
        </p>
      </div>
    </main>
  );
}
