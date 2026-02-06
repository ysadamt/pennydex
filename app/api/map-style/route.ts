import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.PROTOMAPS_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Map API key not configured" },
      { status: 500 },
    );
  }

  try {
    const styleUrl = `https://api.protomaps.com/styles/v5/light/en.json?key=${apiKey}`;
    const response = await fetch(styleUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch map style" },
        { status: response.status },
      );
    }

    const styleJson = await response.json();

    return NextResponse.json(styleJson);
  } catch (error) {
    console.error("Error fetching map style:", error);
    return NextResponse.json(
      { error: "Failed to load map style" },
      { status: 500 },
    );
  }
}
