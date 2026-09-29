"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useAuthController } from "@/hooks/use-auth-controller";

type AuthContextValue = ReturnType<typeof useAuthController>;
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthController();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used within AuthProvider");
  return auth;
}
