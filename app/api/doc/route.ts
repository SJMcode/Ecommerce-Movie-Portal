import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "public", "swagger.json");
    const fileContent = await fs.readFile(filePath, "utf8");
    const spec = JSON.parse(fileContent);
    return NextResponse.json(spec);
  } catch (error) {
    // Graceful fallback if the file is not yet generated during development
    return NextResponse.json({
      openapi: "3.0.0",
      info: {
        title: "Lonely Rider Movie Portal API",
        version: "1.0.0",
        description: "API documentation is compiling...",
      },
      paths: {},
    });
  }
}
