import type { Metadata } from "next";
import { PygameWorkspace } from "@/components/pygame/pygame-workspace";

export const metadata: Metadata = {
  title: "Pygame — Flow",
  description: "Python, Pygame код бичиж тоглоомоо хөтөч дээр ажиллуулаарай.",
};

export default function PygamePage() {
  return <PygameWorkspace />;
}
