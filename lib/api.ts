import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./internal-auth";
export function apiError(error: unknown) {
  if (error instanceof ZodError || error instanceof SyntaxError) return NextResponse.json({ error: "Check the submitted fields", details: error instanceof ZodError ? error.flatten().fieldErrors : undefined }, { status: 400 });
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("CRM operation failed", error);
  return NextResponse.json({ error: "Unable to save or load data. Please retry; if it persists, check database configuration." }, { status: 503 });
}
