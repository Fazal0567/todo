
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const protectedRoutes = ["/"];
const publicRoutes = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const isProtectedRoute = protectedRoutes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (!session && isProtectedRoute) {
    const absoluteURL = new URL("/login", request.nextUrl.origin);
    return NextResponse.redirect(absoluteURL.toString());
  }

  if (session && publicRoutes.includes(request.nextUrl.pathname)) {
     const absoluteURL = new URL("/", request.nextUrl.origin);
    return NextResponse.redirect(absoluteURL.toString());
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
