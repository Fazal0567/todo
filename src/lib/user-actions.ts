
"use server";

import clientPromise from "@/lib/mongodb";
import { Collection, ObjectId } from "mongodb";
import type { User, UserDocument } from "./types";

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

export async function getUserByEmail(email: string): Promise<(User & { _id: ObjectId }) | null> {
  const collection = await getUsersCollection();
  const user = await collection.findOne({ email });

  if (!user) return null;

  return {
    ...user,
    id: user._id.toHexString(),
  };
}
