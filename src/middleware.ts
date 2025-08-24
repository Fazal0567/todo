import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // ✅ Read cookie directly from request
  const session = request.cookies.get("session")?.value; // ya jo bhi tumhari cookie key hai

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // 🔓 If logged in & on login/signup → send to home
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL("/", origin));
  }

  // ✅ Allow direct access to /rooms/:id (join logic handled inside page)
  if (pathname.startsWith("/rooms/")) {
    return NextResponse.next();
  }

  // 🔒 If NOT logged in & route is protected → redirect to login WITH redirectTo param
  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("redirectTo", pathname); // preserve path
    return NextResponse.redirect(loginUrl);
  }

  // ✅ Otherwise continue
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
