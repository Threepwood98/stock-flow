import { createAuthClient } from "better-auth/react";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Sin baseURL - Better Auth usa la URL actual automáticamente
export const authClient = createAuthClient({
  baseURL: BASE_URL || "http://localhost:5173",
});

export const { signIn, signUp, signOut, useSession } = authClient;
