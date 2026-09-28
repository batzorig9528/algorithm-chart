import type { Metadata } from "next";
import { HelpGuide } from "@/components/help/help-guide";

export const metadata: Metadata = { title: "Тусламж — Flow" };
export default function HelpPage() {
  return <HelpGuide />;
}
