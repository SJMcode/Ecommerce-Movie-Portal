import { NextResponse } from "next/server";
import { createSwaggerSpec } from "next-swagger-doc";

export async function GET() {
  const spec = createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Lonely Rider Movie Portal API",
        version: "1.0.0",
        description: "Interactive API documentation for our movie e-commerce system.",
      },
    },
  });

  return NextResponse.json(spec);
}
