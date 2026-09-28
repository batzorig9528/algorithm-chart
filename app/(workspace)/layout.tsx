import type { ReactNode } from "react";
import { EditorProvider } from "@/contexts/editor-context";
import { AppHeader } from "@/components/layout/app-header";
import { EditorDialogs } from "@/components/editor/dialogs/editor-dialogs";
import { Toast } from "@/components/ui/toast";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <EditorProvider>
      <div className="app-shell">
        <AppHeader />
        {children}
        <EditorDialogs />
        <Toast />
      </div>
    </EditorProvider>
  );
}
