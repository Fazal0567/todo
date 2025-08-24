
'use server';

import { Collection, ObjectId, WithId } from "mongodb";
import clientPromise from "./mongodb";
import type { Notification, NotificationDocument } from "./types";
import { getSession } from "./auth-client";
import { revalidatePath } from "next/cache";
import { addUserToRoomById } from "./room-actions";

let notificationsCollection: Collection<NotificationDocument>;

async function getNotificationsCollection() {
  if (notificationsCollection) {
    return notificationsCollection;
  }
  try {
    const client = await clientPromise;
    const db = client.db();
    notificationsCollection = db.collection<NotificationDocument>("notifications");
    return notificationsCollection;
  } catch (error) {
     console.error("Database connection failed:", error);
     throw new Error("Could not connect to the database.");
  }
}

function toNotificationObject(doc: WithId<NotificationDocument>): Notification {
  const { _id, ...rest } = doc;
  return {
    id: _id.toHexString(),
    ...rest
  };
}

export async function createNotification(notification: Omit<Notification, 'id'>) {
    try {
        const collection = await getNotificationsCollection();
        await collection.insertOne(notification);
        // We might want to use a push notification service here in a real app
        revalidatePath('/'); // Revalidate to show notification indicator
    } catch (error) {
        console.error('Failed to create notification', error);
    }
}

export async function getNotifications(userId: string): Promise<Notification[]> {
    const session = await getSession();
    if (!session || session.userId !== userId) {
        console.error("Authentication Error: User mismatch or no session.");
        return [];
    }

    try {
        const collection = await getNotificationsCollection();
        const notificationsFromDb = await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
        return notificationsFromDb.map(toNotificationObject);
    } catch (error) {
        console.error("Database Error: Failed to fetch notifications.", error);
        return [];
    }
}

export async function acceptInvite(notificationId: string) {
    const session = await getSession();
    if (!session) {
        return { success: false, error: 'Authentication required' };
    }
    if (!ObjectId.isValid(notificationId)) {
        return { success: false, error: 'Invalid notification ID' };
    }

    try {
        const collection = await getNotificationsCollection();
        const notification = await collection.findOne({ _id: new ObjectId(notificationId) });
        
        if (!notification || notification.userId !== session.userId) {
            return { success: false, error: 'Notification not found or access denied.' };
        }

        // Add user to the room
        const { roomId } = notification.data;
        const addResult = await addUserToRoomById(roomId, session.userId);

        if (!addResult.success) {
            return { success: false, error: addResult.error || 'Failed to join room.' };
        }

        // Delete the notification
        await collection.deleteOne({ _id: new ObjectId(notificationId) });
        
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Accept Invite Error:", error);
        return { success: false, error: "Failed to accept invitation." };
    }
}

export async function declineInvite(notificationId: string) {
    const session = await getSession();
    if (!session) {
        return { success: false, error: 'Authentication required' };
    }
     if (!ObjectId.isValid(notificationId)) {
        return { success: false, error: 'Invalid notification ID' };
    }

    try {
        const collection = await getNotificationsCollection();
        const notification = await collection.findOne({ _id: new ObjectId(notificationId) });
        
        if (!notification || notification.userId !== session.userId) {
            return { success: false, error: 'Notification not found or access denied.' };
        }

        await collection.deleteOne({ _id: new ObjectId(notificationId) });
        
        revalidatePath('/');
        return { success: true };
    } catch (error) {
         console.error("Decline Invite Error:", error);
        return { success: false, error: "Failed to decline invitation." };
    }
}

export async function markNotificationsAsRead(userId: string) {
    const session = await getSession();
    if (!session || session.userId !== userId) {
        return;
    }
     try {
        const collection = await getNotificationsCollection();
        await collection.updateMany({ userId, read: false }, { $set: { read: true } });
        revalidatePath('/');
    } catch (error) {
        console.error("Mark as Read Error:", error);
    }
}
