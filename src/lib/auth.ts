
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = process.env.SESSION_SECRET || "your-default-secret-key";
const key = new TextEncoder().encode(secretKey);

interface SessionPayload {
  userId: string;
  email: string;
  expires: Date;
}

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch (error) {
    // This can happen if the token is expired or invalid
    console.error("JWT Decryption Error:", error);
    return null;
  }
}

export async function createSession(userId: string, email: string) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const session = await encrypt({ userId, email, expires });

  cookies().set("session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const sessionCookie = cookies().get("session")?.value;
  if (!sessionCookie) return null;

  return await decrypt(sessionCookie);
}

export async function deleteSession() {
  cookies().delete("session");
}

export async function updateSession(request: NextRequest) {
  const sessionCookie = request.cookies.get("session")?.value;
  if (!sessionCookie) return;

  const parsed = await decrypt(sessionCookie);
  if (parsed) {
    parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const res = NextResponse.next();
    res.cookies.set({
      name: "session",
      value: await encrypt(parsed),
      httpOnly: true,
      expires: parsed.expires,
    });
    return res;
  }
}
