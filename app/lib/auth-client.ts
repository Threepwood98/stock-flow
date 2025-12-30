import { createAuthClient } from "better-auth/react";

const getBaseURL = () => {
  if (typeof window === "undefined") {
    // Server-side: usar variable de entorno
    return process.env.BASE_URL || "http://localhost:5173";
  }

  return window.location.origin;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
