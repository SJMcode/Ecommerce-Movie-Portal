import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {protocol: "https", hostname: "image.tmdb.org", pathname: "/**"}, // URL images from TMDB
      {protocol: "https", hostname: "upload.wikimedia.org", pathname: "/**"}, // URL images from Wikipedia 
      {protocol: "https", hostname: "m.media-amazon.com", pathname: "/**"}, // URL images from IMDB
    ]
  }
};

export default nextConfig;
