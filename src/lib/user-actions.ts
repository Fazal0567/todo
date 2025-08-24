
"use server";

import clientPromise from "@/lib/mongodb";
import { Collection, ObjectId } from "mongodb";
import type { User, UserDocument } from "./types";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createSession } from "./auth-actions";


let usersCollection: Collection<UserDocument>;

async function getUsersCollection() {
  if (usersCollection) {
    return usersCollection;
  }
  const client = await clientPromise;
  const db = client.db();
  usersCollection = db.collection<UserDocument>("users");
  return usersCollection;
}

export async function createUser(userData: Omit<User, "id">) {
  const collection = await getUsersCollection();
  const result = await collection.insertOne(userData);
  return result;
}

export async function getUserByEmail(email: string): Promise<(UserDocument & { _id: ObjectId }) | null> {
  const collection = await getUsersCollection();
  // Ensure we also get the password field
  const user = await collection.findOne({ email });

  if (!user) return null;

  return user;
}

export async function getUserById(userId: string): Promise<User | null> {
  if (!ObjectId.isValid(userId)) {
    return null;
  }
  const collection = await getUsersCollection();
  const user = await collection.findOne({ _id: new ObjectId(userId) });

  if (!user) return null;

  const { _id, password, ...userWithoutSensitiveInfo } = user;

  return {
    id: _id.toHexString(),
    ...userWithoutSensitiveInfo,
  };
}

export async function getUsersByIds(userIds: string[]): Promise<User[]> {
  if (!userIds || userIds.length === 0) {
    return [];
  }
  const collection = await getUsersCollection();
  const objectIds = userIds.map(id => ObjectId.isValid(id) ? new ObjectId(id) : null).filter((id): id is ObjectId => id !== null);

  if (objectIds.length === 0) {
      return [];
  }
  
  const usersFromDb = await collection.find({ _id: { $in: objectIds } }).toArray();

  return usersFromDb.map(user => {
    const { _id, password, ...userWithoutSensitiveInfo } = user;
    return {
      id: _id.toHexString(),
      ...userWithoutSensitiveInfo,
    };
  });
}


export async function updateUserAccount(userId: string, data: { email?: string; password?: string }) {
  if (!ObjectId.isValid(userId)) {
    return { success: false, error: "Invalid user ID." };
  }

  const collection = await getUsersCollection();
  const updateData: Partial<UserDocument> = {};

  if (data.email) {
    const existingUser = await collection.findOne({ email: data.email });
    if (existingUser && existingUser._id.toHexString() !== userId) {
      return { success: false, error: "Email is already in use." };
    }
    updateData.email = data.email;
  }

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  if (Object.keys(updateData).length === 0) {
    return { success: true, message: "No changes were made." };
  }

  try {
    await collection.updateOne({ _id: new ObjectId(userId) }, { $set: updateData });
    await createSession(userId); // Re-create session with potentially new email
    revalidatePath("/settings");
    revalidatePath("/profile");
    return { success: true, message: "Account updated successfully." };
  } catch (error) {
    console.error("Update User Account Error:", error);
    return { success: false, error: "Failed to update account." };
  }
}

export async function updateUserProfile(userId: string, data: { displayName?: string, avatarUrl?: string }) {
   if (!ObjectId.isValid(userId)) {
    return { success: false, error: "Invalid user ID." };
  }
  try {
    const collection = await getUsersCollection();
    await collection.updateOne({ _id: new ObjectId(userId) }, { $set: data });
    await createSession(userId); // Re-create session with new display name/avatar
    revalidatePath("/settings");
    revalidatePath("/profile");
    revalidatePath("/"); // For header to update
    return { success: true, message: "Profile updated successfully." };
  } catch (error) {
     console.error("Update User Profile Error:", error);
    return { success: false, error: "Failed to update profile." };
  }
}

export async function updateNotificationPreferences(userId: string, enabled: boolean) {
   if (!ObjectId.isValid(userId)) {
    return { success: false, error: "Invalid user ID." };
  }
  try {
    const collection = await getUsersCollection();
    await collection.updateOne({ _id: new ObjectId(userId) }, { $set: { emailNotifications: enabled } });
    revalidatePath("/settings");
    return { success: true, message: "Notification preferences updated." };
  } catch (error) {
    console.error("Update Notification Preferences Error:", error);
    return { success: false, error: "Failed to update preferences." };
  }
}
