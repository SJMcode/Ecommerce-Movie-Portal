"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// Dynamic import prevents server-side rendering issues with Swagger UI components
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocPage() {
  const [spec, setSpec] = useState<object | null>(null);

  useEffect(() => {
    fetch("/api/doc")
      .then((res) => res.json())
      .then((data) => setSpec(data));
  }, []);

  if (!spec) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-white">
        <div className="text-center space-y-2">
          <p className="text-sm text-zinc-400">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen p-4">
      <SwaggerUI spec={spec} />
    </div>
  );
}
