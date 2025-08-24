import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;
  const session = request.cookies.get("session")?.value; // ✅ read directly

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If logged in & on /login or /signup → redirect home
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL("/", origin));
  }

  // Allow joining rooms even if not yet a member
  if (pathname.startsWith("/rooms/")) {
    return NextResponse.next();
  }

  // If not logged in & accessing protected route → redirect to /login?redirectTo=...
  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
