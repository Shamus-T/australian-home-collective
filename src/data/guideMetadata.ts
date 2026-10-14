export interface GuideCardMetadata {
  title: string;
  image: string;
  imageAlt: string;
  imagePosition: string;
  imagePresentation: "background" | "product";
  imageWidth: number;
  imageHeight: number;
}

const guideSources = import.meta.glob<string>("../pages/guides/**/index.astro", {
  query: "?raw",
  import: "default",
  eager: true,
});

function readAttribute(component: string, attribute: string): string | undefined {
  return component.match(new RegExp(`\\b${attribute}="([^"]+)"`))?.[1];
}

const guideMetadata = new Map<string, GuideCardMetadata>();

for (const [sourcePath, source] of Object.entries(guideSources)) {
  const component = source.match(/<ArticleLayout\b[\s\S]*?>/)?.[0];
  if (!component) continue;

  const href = sourcePath
    .replace("../pages", "")
    .replace(/index\.astro$/, "");
  const title = readAttribute(component, "title");
  const image = readAttribute(component, "image");
  const imageAlt = readAttribute(component, "imageAlt");

  if (!title || !image || !imageAlt) {
    throw new Error(`Active guide metadata is incomplete for ${href}`);
  }

  guideMetadata.set(href, {
    title,
    image,
    imageAlt,
    imagePosition: readAttribute(component, "imagePosition") ?? "center",
    imageWidth: Number(readAttribute(component, "imageWidth") ?? 833),
    imageHeight: Number(readAttribute(component, "imageHeight") ?? 1000),
    imagePresentation: readAttribute(component, "imagePresentation") === "product" ? "product" : "background",
  });
}

export function getGuideCardMetadata(href: string): GuideCardMetadata | undefined {
  return guideMetadata.get(href);
}
