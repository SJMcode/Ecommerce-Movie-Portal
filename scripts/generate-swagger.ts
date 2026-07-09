import { writeFileSync } from "fs";
import { join } from "path";
import { createSwaggerSpec } from "next-swagger-doc";

console.log("⚙️ Generating static Swagger API specification...");

try {
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

  // Write the compiled spec directly to the public folder
  writeFileSync(
    join(process.cwd(), "public", "swagger.json"),
    JSON.stringify(spec, null, 2)
  );

  console.log("✅ Static Swagger specification generated successfully in public/swagger.json!");
} catch (error) {
  console.error("❌ Failed to generate Swagger specification:", error);
  process.exit(1);
}
