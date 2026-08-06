import { NextRequest, NextResponse } from "next/server";

import { createAuthToken, verifyPassword } from "@/lib/auth/token";
import { loginSchema } from "@/lib/schemas/auth";
import { zodErrorSerializer } from "@/lib/serializers/zod-error";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success)
    return NextResponse.json(zodErrorSerializer(parsed.error), { status: 400 });

  if (!verifyPassword(parsed.data.password))
    return NextResponse.json({ form: ["Invalid password"] }, { status: 401 });

  return NextResponse.json({ token: createAuthToken() });
}
