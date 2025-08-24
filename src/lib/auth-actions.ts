
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
  const sessionPayload = { userId, email: user.email, displayName: user.displayName, expires };
  const session = await encrypt(sessionPayload);

  cookies().set("session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function login(credentials: unknown) {
  const parsedCredentials = loginSchema.safeParse(credentials);

  if (!parsedCredentials.success) {
    return { success: false, error: "Invalid credentials provided." };
  }

  const { email, password } = parsedCredentials.data;

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return { success: false, error: "No user found with this email." };
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      return { success: false, error: "Invalid password." };
    }

    await createSession(user._id.toString());

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Something went wrong during login." };
  }
}

export async function signup(userData: unknown) {
  const parsedData = signupSchema.safeParse(userData);

  if (!parsedData.success) {
    return { success: false, error: "Invalid data provided." };
  }

  const { email, password } = parsedData.data;

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return { success: false, error: "A user with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await createUser({ email, password: hashedPassword, displayName: email.split('@')[0] });

    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: "Something went wrong during signup." };
  }
}

export async function logout() {
  deleteSession();
}
