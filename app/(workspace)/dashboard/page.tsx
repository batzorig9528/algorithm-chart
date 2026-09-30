import type { Metadata } from "next";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";

export const metadata: Metadata = { title: "Хяналтын самбар — Flow" };
export default function DashboardPage() {
  return <TeacherDashboard />;
}
