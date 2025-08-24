
"use server";

import { revalidatePath } from "next/cache";
import { Collection, ObjectId, WithId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import type { Room, RoomDocument } from "./types";
import { getSession } from "./auth-client";
import { redirect } from "next/navigation";
import { getUserByEmail } from "./user-actions";

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
    
    // Check if a room with the same name already exists for this user
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
    // No return needed because redirect will trigger
  } catch (error) {
    console.error("Database Error: Failed to create room.", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { error: errorMessage };
  }

  // This should be outside the try-catch block if the redirect is intended to happen
  // only after a successful creation and no error was returned.
  // However, since we are redirecting from the server, we don't need to return anything on success.
  // The 'no return' will be handled by the form. Let's move the redirect to the end.
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

export async function addUserToRoom(roomId: string, userEmail: string): Promise<{success: boolean, error?: string, message?: string}> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Authentication required." };
  }
  
  if (!ObjectId.isValid(roomId)) {
    return { success: false, error: "Invalid Room ID." };
  }

  try {
    const collection = await getRoomsCollection();
    const roomToUpdate = await collection.findOne({ _id: new ObjectId(roomId) });

    if (!roomToUpdate) {
        return { success: false, error: "Room not found." };
    }
    
    // Allow adding a user if:
    // 1. The person doing the adding is already in the room.
    // 2. The person being added is the same as the person logged in (i.e., joining via link).
    const isMember = roomToUpdate.userIds.includes(session.userId);
    const isAddingSelf = session.email === userEmail;

    if (!isMember && !isAddingSelf) {
      return { success: false, error: "You do not have permission to add users to this room." };
    }
    
    const userToAdd = await getUserByEmail(userEmail);
    if (!userToAdd) {
        return { success: false, error: `User with email "${userEmail}" not found.` };
    }
    
    const userToAddId = userToAdd._id.toHexString();
    if (roomToUpdate.userIds.includes(userToAddId)) {
      // This is not an error, just means they are already in.
      // We can return success to allow the page to load for them.
      return { success: true, message: "User is already in this room." };
    }

    await collection.updateOne(
      { _id: new ObjectId(roomId) },
      { $addToSet: { userIds: userToAddId } }
    );
    
    // NOTE: Removed `revalidatePath` from here as it was causing a render-time error.
    // The page will get the fresh data on the subsequent `getRoom` and `getTasks` calls anyway.
    return { success: true, message: "User added successfully." };
    
  } catch (error) {
    console.error("Database Error: Failed to add user to room.", error);
    return { success: false, error: "Could not add user to the room." };
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
    
    // If the user is the last one in the room, delete the room
    if (room.userIds.length === 1 && room.userIds[0] === session.userId) {
      await collection.deleteOne({ _id: new ObjectId(roomId) });
    } else {
      // Otherwise, just remove the user from the room
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

  // After leaving, redirect to the 'new room' page or the first available room.
  const remainingRooms = await getUserRooms(session.userId);
  if (remainingRooms.length > 0) {
    redirect(`/rooms/${remainingRooms[0].id}`);
  } else {
    redirect('/rooms/new');
  }
}
