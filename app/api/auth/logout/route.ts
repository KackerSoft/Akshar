import { NextResponse } from "next/server";

// Stateless auth tokens can't be revoked server-side; the client simply
// clears the cookie. This endpoint exists for symmetry and future use
// (e.g. audit logging) and always succeeds.
export async function POST() {
  return NextResponse.json({ success: true });
}
