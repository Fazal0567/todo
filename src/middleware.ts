
import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";

const publicRoutes = ["/login", "/signup"]; 

export async function middleware(request: NextRequest) {
  const session = await getSessionFromCookie();
  const { pathname, origin } = request.nextUrl;

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // 🔓 If user IS logged in & tries to access a public route (like /login) → send to home
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL("/", origin));
  }
  
  // Allow accessing a specific room page even if not a member yet,
  // as the page itself handles logic for joining or viewing.
  if (pathname.startsWith('/rooms/')) {
      return NextResponse.next();
  }

  // 🔒 If user is NOT logged in & trying to access a protected route → send to /login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", origin));
  }


  // ✅ Otherwise, continue
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
