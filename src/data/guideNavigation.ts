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
const guideSourceByHref = new Map<string, string>(
  Object.entries(guideSources).map(([sourcePath, source]) => [
    sourcePath
      .replace("../pages", "")
      .replace(/index\.astro$/, ""),
    source,
  ]),
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

export function isActiveGuideHref(href: string): boolean {
  return guideByHref.has(href);
}

export function getGuideCategoryLink(
  currentPath: string,
): GuideNavigationItem | undefined {
  const guide = guideByHref.get(currentPath);
  if (!guide) return undefined;

  const categoryHref = getCategoryPath(guide.category ?? "") ?? "/guides/";
  return {
    href: categoryHref,
    title: categoryHref === "/guides/"
      ? "Browse all guides"
      : `${guide.category} guides`,
  };
}

export function getGuideBodyDestinations(currentPath: string): Set<string> {
  const source = guideSourceByHref.get(currentPath) ?? "";
  const articleMatch = source.match(/<ArticleLayout\b[\s\S]*?>/);
  if (articleMatch?.index === undefined) return new Set();

  const articleBody = source.slice(
    articleMatch.index + articleMatch[0].length,
    source.lastIndexOf("</ArticleLayout>"),
  );

  return new Set(
    [...articleBody.matchAll(/\bhref="(\/(?:guides|categories)\/[^"]+)"/g)]
      .map((match) => match[1]),
  );
}
