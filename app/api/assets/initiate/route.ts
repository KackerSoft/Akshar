import { NextResponse } from "next/server";

import { isAuthenticatedRequest } from "@/lib/auth/server";
import { initiateAssetUpload } from "@/lib/server/maalgaadi";

export async function POST() {
  if (!(await isAuthenticatedRequest()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const result = await initiateAssetUpload();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Maalgaadi initiate failed", error);
    return NextResponse.json({ error: "Failed to start upload" }, { status: 502 });
  }
}
