import type { Metadata } from "next";
import { ProblemLibrary } from "@/components/problems/problem-library";

export const metadata: Metadata = { title: "Бодлогын сан — Flow" };
export default function ProblemsPage() {
  return <ProblemLibrary />;
}
