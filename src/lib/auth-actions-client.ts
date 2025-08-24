
"use client";
// This file contains client-side wrappers for auth-related session actions.
// It's not a Server Action file.

import { getSession as getServerSession } from "./auth-client";

export async function getSession() {
  return await getServerSession();
}
