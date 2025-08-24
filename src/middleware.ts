
import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";

// Added /rooms to the public routes for joining via a link
const publicRoutes = ["/login", "/signup"]; 

export async function middleware(request: NextRequest) {
  const session = await getSessionFromCookie();
  const { pathname, origin } = request.nextUrl;

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Allow accessing a specific room page if not logged in,
  // the page itself will handle prompting login.
  if (pathname.startsWith('/rooms/')) {
    if (!session) {
        // Allow access, but the page can prompt for login
        return NextResponse.next();
    }
  }

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
