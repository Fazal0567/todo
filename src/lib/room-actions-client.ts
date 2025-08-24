
"use client";

import {
    getUserRooms as getServerUserRooms,
} from './room-actions';


export async function getUserRooms(userId: string) {
    return await getServerUserRooms(userId);
}
