import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const publicRoutes = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const { pathname, origin } = request.nextUrl;

  const isPublicRoute = publicRoutes.includes(pathname);

  // 🔒 If user is NOT logged in & trying to access a protected route → send to /login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  // 🔓 If user IS logged in & tries to access a public route → send to home
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL("/", origin));
  }

  // ✅ Otherwise, continue
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
