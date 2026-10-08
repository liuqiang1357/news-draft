import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "News Draft",
    short_name: "News Draft",
    description: "Read, think, and review.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "zh-CN",
    icons: [192, 512].map((size) => ({
      src: `/icons/icon-${size}.png`,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose: "any",
    })),
  };
}
