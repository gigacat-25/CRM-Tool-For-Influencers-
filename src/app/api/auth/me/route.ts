import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionJWT } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    // 1. Try Clerk Auth first if configured
    const isClerkConfigured =
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder_key_change_me";

    if (isClerkConfigured) {
      const clerkUser = await currentUser();
      if (clerkUser) {
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (email) {
          // Find user in database
          let users = await db.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
          let user = users[0];

          if (!user) {
            // Provision user in database
            const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.username || "Clerk User";
            const role = email.toLowerCase() === "thejaswinps@gmail.com" ? "super_admin" : "viewer";
            const newUserId = `usr_${clerkUser.id}`;

            await db.execute(
              "INSERT INTO users (id, name, email, role, password_hash) VALUES (?, ?, ?, ?, ?)",
              [newUserId, name, email, role, ""]
            );

            user = {
              id: newUserId,
              name,
              email,
              role
            };
          }

          return NextResponse.json({
            authenticated: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          });
        }
      }
    }

    // 2. Fallback to custom JWT session token
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await verifySessionJWT(token);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user
    });
  } catch (error) {
    console.error("Auth me route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
