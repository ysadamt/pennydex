import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "penny_machines.json");
    const fileContents = fs.readFileSync(filePath, "utf8");
    const machines = JSON.parse(fileContents);

    return NextResponse.json(machines);
  } catch (error) {
    console.error("Error reading machines data:", error);
    return NextResponse.json(
      { error: "Failed to load machines data" },
      { status: 500 },
    );
  }
}
