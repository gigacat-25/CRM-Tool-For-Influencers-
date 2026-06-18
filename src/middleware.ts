import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionJWT, signSessionJWT } from "./lib/auth";

// Clerk Route Protection Definition
const isClerkProtectedRoute = createRouteMatcher([
  "/dashboard(.*)", 
  "/influencers(.*)", 
  "/campaigns(.*)", 
  "/brands(.*)", 
  "/whatsapp(.*)", 
  "/finance(.*)", 
  "/reports(.*)",
  "/api/((?!auth/login|public).+)"
]);

// 1. Standard Clerk Middleware
const clerkAuthMiddleware = clerkMiddleware(async (auth, req) => {
  if (isClerkProtectedRoute(req)) {
    await auth.protect();
  }
  return NextResponse.next();
});

// 2. Custom JWT Session Middleware (local fallback)
async function jwtSessionMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/login" || pathname.startsWith("/api/auth");
  const isStaticRoute =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/mock-documents") ||
    pathname.includes("favicon.ico");

  if (isStaticRoute) {
    return NextResponse.next();
  }

  let token = request.cookies.get("session_token")?.value;

  if (!token) {
    const mockUser = {
      userId: "usr_1",
      name: "Sarah Jenkins",
      email: "superadmin@thescene.co",
      role: "super_admin" as const
    };
    token = await signSessionJWT(mockUser);
    
    if (!pathname.startsWith("/api")) {
      const targetUrl = isAuthRoute || pathname === "/" 
        ? new URL("/dashboard", request.url) 
        : new URL(request.url);

      const response = NextResponse.redirect(targetUrl);
      response.cookies.set("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/"
      });
      return response;
    } else {
      request.headers.set("cookie", `session_token=${token}`);
      const response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      });
      response.cookies.set("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/"
      });
      return response;
    }
  }

  const user = await verifySessionJWT(token);

  if (!user) {
    const mockUser = {
      userId: "usr_1",
      name: "Sarah Jenkins",
      email: "superadmin@thescene.co",
      role: "super_admin" as const
    };
    const newToken = await signSessionJWT(mockUser);
    
    if (!pathname.startsWith("/api")) {
      const response = NextResponse.redirect(new URL(request.url));
      response.cookies.set("session_token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/"
      });
      return response;
    } else {
      request.headers.set("cookie", `session_token=${newToken}`);
      const response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      });
      response.cookies.set("session_token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/"
      });
      return response;
    }
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// 3. Unified Middleware Dispatcher
export default async function middleware(request: NextRequest, event: any) {
  const isClerkActive =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder_key_change_me";

  if (isClerkActive) {
    return clerkAuthMiddleware(request, event);
  } else {
    return jwtSessionMiddleware(request);
  }
}

export const config = {
  matcher: [
    // Match all request paths except static files/Next internals
    '/((?!_next|[^?]*\\.[0-9a-z]+$).*)',
    '/(api|trpc)(.*)',
  ],
};
