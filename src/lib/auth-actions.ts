"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail, getUserById } from "./user-actions";
import { deleteSession, encrypt } from "./auth";
import { cookies } from "next/headers";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function createSession(userId: string) {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found for session creation.");
  }

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const sessionPayload = {
    userId,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    expires,
  };

  const session = await encrypt(sessionPayload); // must return a string

  (await cookies()).set("session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function login(credentials: unknown) {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) {
    return { success: false, error: "Invalid credentials provided." };
  }

  const { email, password } = parsed.data;

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return { success: false, error: "No user found with this email." };
    }

    const match = bcrypt.compare(password, user.password); // ✅ FIXED
    if (!match) {
      return { success: false, error: "Invalid password." };
    }

    await createSession(user._id.toString());
    return { success: true };
  } catch (err) {
    console.error("Login error:", err);
    return { success: false, error: "Something went wrong during login." };
  }
}

export async function signup(data: unknown) {
  const parsed = signupSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid data provided." };
  }

  const { email, password } = parsed.data;

  try {
    const existing = await getUserByEmail(email);
    if (existing) {
      return { success: false, error: "User already exists." };
    }

    const hash = await bcrypt.hash(password, 10);
    await createUser({
      email,
      password: hash,
      displayName: email.split("@")[0],
      avatarUrl: "",
    });

    return { success: true };
  } catch (err) {
    console.error("Signup error:", err);
    return { success: false, error: "Something went wrong during signup." };
  }
}

export async function logout() {
  deleteSession();
}
