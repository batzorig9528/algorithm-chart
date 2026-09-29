export type AuthUser = { id: number; email: string; name?: string };
export type AuthModal = "login" | "register" | "tee-login" | null;
export type AuthDraft = { identifier: string; password: string };
