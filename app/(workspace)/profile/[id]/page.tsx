import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, CalendarDays, CheckCircle2, Trophy } from "lucide-react";
import { db } from "@/lib/server/db";
import { getPublicProfile, parsePage } from "@/lib/server/community";
import { Pagination } from "@/components/community/pagination";

export const metadata: Metadata = { title: "Хэрэглэгчийн профайл — Flow" };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Ulaanbaatar",
  }).format(new Date(value));
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  await connection();
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) notFound();
  const profile = await getPublicProfile(
    db,
    Number(id),
    parsePage((await searchParams).page),
  );
  if (!profile) notFound();
  return (
    <main className="content-page community-page">
      <div className="community-container">
        <Link className="community-back" href="/rank">
          <ArrowLeft size={16} aria-hidden="true" /> Эрэмбийн самбар
        </Link>
        <header className="profile-heading">
          <span className="community-avatar profile-avatar" aria-hidden="true">
            {Array.from(profile.name)[0].toUpperCase()}
          </span>
          <div>
            <span className="community-eyebrow">ХЭРЭГЛЭГЧ #{profile.id}</span>
            <h1>{profile.name}</h1>
            <p>Бодлого бодсон амжилт</p>
          </div>
        </header>

        <dl className="community-stats">
          <div>
            <dt>
              <CheckCircle2 size={18} aria-hidden="true" /> Бодсон бодлого
            </dt>
            <dd>{profile.solvedCount}</dd>
          </div>
          <div>
            <dt>
              <Trophy size={18} aria-hidden="true" /> Нийт эрэмбэ
            </dt>
            <dd>{profile.rank ? `#${profile.rank}` : "Байр эзлээгүй"}</dd>
          </div>
          <div>
            <dt>
              <CalendarDays size={18} aria-hidden="true" /> Бүртгүүлсэн
            </dt>
            <dd className="profile-date">
              <time dateTime={profile.createdAt}>
                {dateLabel(profile.createdAt)}
              </time>
            </dd>
          </div>
        </dl>

        <section className="community-panel" aria-labelledby="solved-title">
          <div className="community-panel-heading">
            <h2 id="solved-title">Бодсон бодлогууд</h2>
            <span>{profile.solvedCount} бодлого</span>
          </div>
          {profile.solves.length ? (
            <ul className="profile-solves">
              {profile.solves.map((problem) => (
                <li key={problem.id}>
                  <CheckCircle2
                    size={20}
                    className="solve-check"
                    aria-hidden="true"
                  />
                  <div className="profile-problem">
                    <h3>{problem.title}</h3>
                    <p>
                      #{problem.id}
                      {problem.level ? ` · ${problem.level}` : ""}
                      {problem.tag ? ` · ${problem.tag}` : ""}
                    </p>
                  </div>
                  <time dateTime={problem.solvedAt}>
                    {dateLabel(problem.solvedAt)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <div className="community-state">
              <CheckCircle2 size={36} aria-hidden="true" />
              <h2>Одоогоор бодсон бодлого алга</h2>
              <p>Бодлогоо амжилттай шалгуулсны дараа энд харагдана.</p>
              <Link className="button run-button" href="/problems">
                Бодлогын сан
              </Link>
            </div>
          )}
          <Pagination
            page={profile.page}
            pages={profile.pages}
            href={`/profile/${profile.id}`}
          />
        </section>
      </div>
    </main>
  );
}
