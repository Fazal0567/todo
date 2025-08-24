
"use server";

import { revalidatePath } from "next/cache";
import { Collection, ObjectId, WithId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import type { Room, RoomDocument } from "./types";
import { getSession } from "./auth-client";
import { redirect } from "next/navigation";
import { getUserByEmail, getUserById } from "./user-actions";
import { createNotification } from "./notification-actions";


let roomsCollection: Collection<RoomDocument>;

async function getRoomsCollection() {
  if (roomsCollection) {
    return roomsCollection;
  }
  try {
    const client = await clientPromise;
    const db = client.db();
    roomsCollection = db.collection<RoomDocument>("rooms");
    return roomsCollection;
  } catch (error) {
     console.error("Database connection failed:", error);
     throw new Error("Could not connect to the database.");
  }
}

function toRoomObject(doc: WithId<RoomDocument>): Room {
  const { _id, ...rest } = doc;
  return {
    id: _id.toHexString(),
    ...rest,
  };
}

export async function createRoom(name: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Authentication required." };
  }

  try {
    const collection = await getRoomsCollection();
    
    const existingRoom = await collection.findOne({ name, userIds: session.userId });
    if (existingRoom) {
      return { error: `You already have a room named "${name}".` };
    }

    const newRoom: RoomDocument = {
      name,
      userIds: [session.userId],
    };
    const result = await collection.insertOne(newRoom);
    
    if (!result.insertedId) {
       return { error: "Failed to create room." };
    }
    
    const newRoomId = result.insertedId.toHexString();
    revalidatePath("/");
    revalidatePath(`/rooms/${newRoomId}`);
  } catch (error) {
    console.error("Database Error: Failed to create room.", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { error: errorMessage };
  }

  const rooms = await getUserRooms(session.userId);
  const newRoom = rooms.find(r => r.name === name);
  if(newRoom) {
    redirect(`/rooms/${newRoom.id}`);
  }
}

export async function getUserRooms(userId: string): Promise<Room[]> {
  try {
    const collection = await getRoomsCollection();
    const roomsFromDb = await collection.find({ userIds: userId }).sort({ name: 1 }).toArray();
    return roomsFromDb.map(toRoomObject);
  } catch (error) {
    console.error("Database Error: Failed to fetch user rooms.", error);
    return [];
  }
}

export async function getRoom(roomId: string, userId: string): Promise<Room | null> {
   if (!ObjectId.isValid(roomId)) {
    return null;
  }
  try {
    const collection = await getRoomsCollection();
    const room = await collection.findOne({ _id: new ObjectId(roomId), userIds: userId });
    return room ? toRoomObject(room) : null;
  } catch (error) {
    console.error("Database Error: Failed to fetch room.", error);
    return null;
  }
}

// This function is for when a user accepts an invite.
export async function addUserToRoomById(roomId: string, userId: string): Promise<{success: boolean, error?: string}> {
  if (!ObjectId.isValid(roomId)) {
    return { success: false, error: "Invalid Room ID." };
  }
  try {
    const collection = await getRoomsCollection();
    await collection.updateOne(
      { _id: new ObjectId(roomId) },
      { $addToSet: { userIds: userId } }
    );
    revalidatePath(`/rooms/${roomId}`);
    return { success: true };
  } catch (error) {
     console.error("Database Error: Failed to add user to room.", error);
    return { success: false, error: "Could not add user to the room." };
  }
}


export async function inviteUserToRoom(roomId: string, userEmail: string): Promise<{success: boolean, error?: string, message?: string}> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Authentication required." };
  }
  
  if (!ObjectId.isValid(roomId)) {
    return { success: false, error: "Invalid Room ID." };
  }

  try {
    const rooms = await getRoomsCollection();
    const roomToUpdate = await rooms.findOne({ _id: new ObjectId(roomId) });

    if (!roomToUpdate) {
        return { success: false, error: "Room not found." };
    }
    
    const isMember = roomToUpdate.userIds.includes(session.userId);
    if (!isMember) {
      return { success: false, error: "You do not have permission to invite users to this room." };
    }
    
    const userToInvite = await getUserByEmail(userEmail);
    if (!userToInvite) {
        return { success: false, error: `User with email "${userEmail}" not found.` };
    }
    
    const userToInviteId = userToInvite._id.toHexString();
    if (roomToUpdate.userIds.includes(userToInviteId)) {
      return { success: false, error: "User is already in this room." };
    }

    // Check for existing pending invitation
    // This part requires access to notifications, so we might need a separate action or direct DB access
    // For now, let's assume we can check. A dedicated `notification-actions` file is better.

    const inviter = await getUserById(session.userId);

    await createNotification({
        userId: userToInviteId,
        type: 'ROOM_INVITE',
        read: false,
        createdAt: new Date(),
        data: {
            roomId: roomId,
            roomName: roomToUpdate.name,
            inviterId: session.userId,
            inviterName: inviter?.displayName || inviter?.email || 'A user'
        }
    });

    return { success: true, message: "Invitation sent successfully." };
    
  } catch (error) {
    console.error("Database Error: Failed to invite user to room.", error);
    return { success: false, error: "Could not send invitation." };
  }
}

export async function leaveRoom(roomId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Authentication required.");
  }
  if (!ObjectId.isValid(roomId)) {
    throw new Error("Invalid Room ID.");
  }

  try {
    const collection = await getRoomsCollection();
    const room = await collection.findOne({ _id: new ObjectId(roomId) });

    if (!room) {
      throw new Error("Room not found.");
    }
    
    if (room.userIds.length === 1 && room.userIds[0] === session.userId) {
      await collection.deleteOne({ _id: new ObjectId(roomId) });
    } else {
      await collection.updateOne(
        { _id: new ObjectId(roomId) },
        { $pull: { userIds: session.userId } }
      );
    }
    
    revalidatePath(`/rooms/${roomId}`);
    revalidatePath("/");
  } catch (error) {
    console.error("Database Error: Failed to leave room.", error);
    throw new Error("Could not leave the room.");
  }

  const remainingRooms = await getUserRooms(session.userId);
  if (remainingRooms.length > 0) {
    redirect(`/rooms/${remainingRooms[0].id}`);
  } else {
    redirect('/rooms/new');
  }
}

// Function for a user to join a public room via a link, if they aren't already in it.
export async function joinRoomViaLink(roomId: string): Promise<void> {
    const session = await getSession();
    if (!session) {
        // User is not logged in, they will be prompted on the page.
        return;
    }

    if (!ObjectId.isValid(roomId)) {
        console.error("Invalid Room ID provided in link.");
        return;
    }

    try {
        const collection = await getRoomsCollection();
        const room = await collection.findOne({ _id: new ObjectId(roomId) });

        if (!room) {
            console.error("Room from link not found.");
            return;
        }

        if (room.userIds.includes(session.userId)) {
            // Already a member, do nothing.
            return;
        }

        // Add the user to the room
        await collection.updateOne(
            { _id: new ObjectId(roomId) },
            { $addToSet: { userIds: session.userId } }
        );
        // We don't revalidate here to avoid render-time errors.
        // The page will refetch the necessary data on load.
    } catch (error) {
        console.error("Database Error: Failed to join room via link.", error);
    }
}
