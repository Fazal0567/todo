
"use server";
// This file is a server actions file, but is intended to be called from the client.
// We need a separate file because middleware cannot be a server action file.

import { cookies } from "next/headers";
import { decrypt, type SessionPayload } from "./auth";

export async function getSession(): Promise<SessionPayload | null> {
  const sessionCookie = cookies().get("session")?.value;
  if (!sessionCookie) return null;

  return await decrypt(sessionCookie);
}
