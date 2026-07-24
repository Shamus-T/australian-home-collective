interface GuideNavigationItem {
  href: string;
  title: string;
}

export interface GuideNavigation {
  isActive: boolean;
  categoryHref?: string;
  previous?: GuideNavigationItem;
  next?: GuideNavigationItem;
}

import { getCategoryPath } from "./categories";

const guideSources = import.meta.glob<string>("../pages/guides/**/index.astro", {
  query: "?raw",
  import: "default",
  eager: true,
});

const guideIndexSources = import.meta.glob<string>("../pages/guides/index.astro", {
  query: "?raw",
  import: "default",
  eager: true,
});

const categorySources = import.meta.glob<string>("../pages/categories/*/index.astro", {
  query: "?raw",
  import: "default",
  eager: true,
});

function readComponentProp(source: string, prop: "title" | "category"): string | undefined {
  const component = source.match(/<(?:ArticleLayout|SimpleGuidePage)\b[\s\S]*?>/)?.[0];
  return component?.match(new RegExp(`\\b${prop}="([^"]+)"`))?.[1];
}

const guideByHref = new Map<string, GuideNavigationItem & { category?: string }>(
  Object.entries(guideSources).map(([sourcePath, source]) => {
    const href = sourcePath
      .replace("../pages", "")
      .replace(/index\.astro$/, "");

    return [
      href,
      {
        href,
        title: readComponentProp(source, "title") ?? href,
        category: readComponentProp(source, "category"),
      },
    ];
  }),
);

function orderedGuideHrefs(source: string): string[] {
  return [
    ...new Set(
      [...source.matchAll(/\bhref\s*(?:=|:)\s*"([^"]+)"/g)]
        .map((match) => match[1])
        .filter((href) => href.startsWith("/guides/") && href !== "/guides/"),
    ),
  ];
}

function categoryGuideOrder(category: string, categoryPath?: string): string[] {
  if (!categoryPath) {
    const guideIndexSource = Object.values(guideIndexSources)[0] ?? "";
    return orderedGuideHrefs(guideIndexSource)
      .filter((href) => guideByHref.get(href)?.category === category);
  }

  const sourcePath = `../pages${categoryPath}index.astro`;
  const source = categorySources[sourcePath];
  if (!source) return [];

  return orderedGuideHrefs(source)
    .filter((href) => getCategoryPath(guideByHref.get(href)?.category ?? "") === categoryPath);
}

export function getGuideNavigation(
  currentPath: string,
  category: string,
  categoryPath?: string,
): GuideNavigation {
  const sequence = categoryGuideOrder(category, categoryPath);
  const currentIndex = sequence.indexOf(currentPath);

  if (currentIndex === -1) return { isActive: false };

  const previous = guideByHref.get(sequence[currentIndex - 1]);
  const next = guideByHref.get(sequence[currentIndex + 1]);

  return {
    isActive: true,
    categoryHref: categoryPath ?? "/guides/",
    ...(previous ? { previous: { href: previous.href, title: previous.title } } : {}),
    ...(next ? { next: { href: next.href, title: next.title } } : {}),
  };
}
