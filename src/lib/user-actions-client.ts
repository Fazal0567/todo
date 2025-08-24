
"use client";
// This file contains client-side wrappers for server actions.
// It's not a Server Action file.

import {
  getUserById as getServerUserById,
  updateUserAccount as serverUpdateUserAccount,
  updateUserProfile as serverUpdateUserProfile,
  updateNotificationPreferences as serverUpdateNotificationPreferences,
} from "./user-actions";

export async function getUserById(userId: string) {
  return await getServerUserById(userId);
}

export async function updateUserAccount(userId: string, data: { email?: string; password?: string }) {
    return await serverUpdateUserAccount(userId, data);
}

export async function updateUserProfile(userId: string, data: { displayName?: string }) {
    return await serverUpdateUserProfile(userId, data);
}

export async function updateNotificationPreferences(userId: string, enabled: boolean) {
    return await serverUpdateNotificationPreferences(userId, enabled);
}
