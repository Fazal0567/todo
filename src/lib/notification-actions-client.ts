
"use client";

import {
    getNotifications as getServerNotifications,
} from './notification-actions';

export async function getNotifications(userId: string) {
    return await getServerNotifications(userId);
}
