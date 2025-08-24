
"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail } from "./user-actions";
import { createSession, deleteSession } from "./auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

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

    await createSession(user.id.toString(), user.email);

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
    await createUser({ email, password: hashedPassword });

    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: "Something went wrong during signup." };
  }
}

export async function logout() {
  deleteSession();
}
