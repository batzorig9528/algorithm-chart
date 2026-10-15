"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { CommunityLoading } from "@/components/community/community-loading";

export default function MyProfilePage() {
  const { user, ready, openModal } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (user) router.replace(`/profile/${user.id}`);
  }, [user, router]);
  if (!ready || user) return <CommunityLoading />;
  return (
    <main className="content-page community-page">
      <section className="content-card community-state">
        <UserRound size={36} aria-hidden="true" />
        <h1>Миний профайл</h1>
        <p>Өөрийн байр болон бодсон бодлогуудаа харахын тулд нэвтэрнэ үү.</p>
        <button
          className="button run-button"
          onClick={() => openModal("login")}
        >
          Нэвтрэх
        </button>
      </section>
    </main>
  );
}
