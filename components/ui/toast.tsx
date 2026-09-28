"use client";
import { Check } from "lucide-react";
import { useEditor } from "@/contexts/editor-context";

export function Toast() {
  const { toast } = useEditor();

  return toast ? (
    <div className="toast" role="status">
      <Check size={16} />
      {toast}
    </div>
  ) : null;
}
