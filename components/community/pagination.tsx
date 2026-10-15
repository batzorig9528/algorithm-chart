import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pages,
  href,
}: {
  page: number;
  pages: number;
  href: string;
}) {
  if (pages <= 1) return null;
  return (
    <nav className="community-pagination" aria-label="Хуудас сонгох">
      {page > 1 ? (
        <Link href={`${href}?page=${page - 1}`} className="button" rel="prev">
          <ChevronLeft size={16} aria-hidden="true" /> Өмнөх
        </Link>
      ) : (
        <span />
      )}
      <span aria-current="page">
        {page} / {pages}
      </span>
      {page < pages ? (
        <Link href={`${href}?page=${page + 1}`} className="button" rel="next">
          Дараах <ChevronRight size={16} aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
