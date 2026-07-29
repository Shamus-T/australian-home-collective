import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const distRoot = path.join(root, "dist");
const sourceRoot = path.join(root, "src");
const rejectedRegistryPath = path.join(root, "docs", "visual", "rejected-image-assets.json");
const errors = [];

function addError(message) {
  errors.push(message);
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function routeOutputPath(route) {
  return path.join(distRoot, ...route.split("/").filter(Boolean), "index.html");
}

function routeHtml(route) {
  const outputPath = routeOutputPath(route);
  if (!fs.existsSync(outputPath)) {
    addError(`${route} has no built output.`);
    return "";
  }
  return fs.readFileSync(outputPath, "utf8");
}

function plainText(html) {
  return html
    .replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&apos;|&#0*39;|&#x0*27;/gi, "'")
    .replace(/&(?:[a-z]+|#\d+|#x[a-f\d]+);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

if (!fs.existsSync(distRoot)) {
  console.error("Editorial standards audit requires a completed dist build.");
  process.exit(1);
}

if (!fs.existsSync(rejectedRegistryPath)) {
  addError("Rejected image registry is missing.");
} else {
  const registry = JSON.parse(fs.readFileSync(rejectedRegistryPath, "utf8"));
  const sourceFiles = walk(sourceRoot).filter((file) => /\.(?:astro|css|js|json|mjs|ts)$/i.test(file));
  const distFiles = walk(distRoot);

  for (const asset of registry.assets ?? []) {
    const publicRelativePath = asset.path.replace(/^public\//, "");
    const publicUrl = `/${publicRelativePath}`;
    const filename = path.posix.basename(asset.path);
    const deployedAssetPath = path.join(distRoot, ...publicRelativePath.split("/"));

    if (fs.existsSync(deployedAssetPath)) {
      addError(`Rejected visual is present in deployable output: ${publicUrl}`);
    }

    for (const file of sourceFiles) {
      const source = fs.readFileSync(file, "utf8");
      if (source.includes(publicUrl) || source.includes(`"${filename}"`) || source.includes(`'${filename}'`)) {
        addError(
          `Rejected visual ${publicUrl} is referenced by ${path.relative(root, file).replaceAll(path.sep, "/")}.`,
        );
      }
    }

    for (const file of distFiles) {
      const contents = fs.readFileSync(file);
      if (contents.includes(Buffer.from(publicUrl)) || contents.includes(Buffer.from(filename))) {
        addError(
          `Rejected visual ${publicUrl} appears in generated file ${path.relative(root, file).replaceAll(path.sep, "/")}.`,
        );
      }
    }
  }
}

const technicalEvidence = new Map([
  ["/guides/coffee-machine-types-australia/", [
    ["espresso cleaning and maintenance", "https://www.breville.com/au/en/coffee-journey/tutorials/espresso-tutorials/cleaning-and-maintenance.html"],
    ["model-specific coffee-machine manuals", "https://www.delonghi.com/en-au/manuals/c/coffee-machines"],
    ["capsule-machine assistance", "https://www.nespresso.com/au/en/machine-assistance"],
  ]],
  ["/guides/cookware-materials-compared/", [
    ["stainless-steel thermal properties", "https://www.assda.asn.au/publications/technical-faqs/faq-10-thermal-expansion-and-design-of-stainless-steel-fabrications"],
    ["induction compatibility", "https://supporthub.electrolux.com.au/support-articles/article/what-cookware-is-suitable-for-cooking-zones-with-induction-heating-"],
    ["coated cookware care", "https://www.tefal.com.au/blogs/tefal-tips/how-to-better-use-my-tefal-cookware"],
    ["cast-iron care", "https://www.lodgecastiron.com/pages/discover-cleaning-and-care-cast-iron"],
    ["carbon-steel care", "https://www.lodgecastiron.com/discover/cleaning-and-care/carbon-steel"],
  ]],
  ["/guides/cordless-stick-vacuums-australia/", [
    ["cordless vacuum performance methods", "https://webstore.iec.ch/en/publication/82454"],
    ["manufacturer run-time conditions and filter care", "https://www.lg.com/au/vacuum-cleaners/handstick-vacuum-cleaners/a9k-evolve/"],
  ]],
  ["/guides/robot-vacuum-buying-guide-australia/", [
    ["robot vacuum performance methods", "https://webstore.iec.ch/en/publication/76953"],
    ["Australian connected-device security", "https://www.cyber.gov.au/protect-yourself/securing-your-devices/how-secure-your-devices/internet-things-devices"],
    ["manufacturer robot maintenance", "https://www.ecovacs.com/au/blog/how-to-clean-robot-vacuum-cleaner"],
  ]],
  ["/guides/mattress-sizes-australia/", [
    ["Sealy manufacturer dimensions and tolerance", "https://www.sealy.com.au/mattress-sizes/"],
    ["SleepMaker manufacturer dimensions and tolerance", "https://www.sleepmaker.com.au/pages/mattress-size-guide"],
    ["SleepMaker base support requirements", "https://afterpurchase.sleepmaker.com.au/hc/en-us/articles/212535668-What-to-expect-from-your-sleep-set"],
  ]],
]);

for (const [route, requirements] of technicalEvidence) {
  const html = routeHtml(route);
  for (const [role, href] of requirements) {
    if (!html.includes(`href="${href}"`)) {
      addError(`${route} is missing required authoritative evidence for ${role}: ${href}`);
    }
  }
}

const electricalRoutes = [
  "/guides/bedside-table-setup-what-to-check-before-you-buy/",
  "/guides/home-office-cable-management-what-to-plan-before-buying-organisers/",
  "/guides/home-office-desk-setup-what-to-measure-before-you-buy/",
  "/guides/living-room-cable-management-what-to-plan-before-buying-organisers/",
  "/guides/living-room-lighting-ideas-for-australian-homes/",
  "/guides/shared-home-office-spaces-how-to-set-up-without-taking-over-the-room/",
];
const electricalSources = [
  "https://www.fire.nsw.gov.au/fire-safety/home-fire-safety/topics/electrical-power-boards",
  "https://www.erac.gov.au/about-erac/",
  "https://www.erac.gov.au/licensing/electrical-licensing/",
  "https://www.energysafe.vic.gov.au/DDIY",
];

for (const route of electricalRoutes) {
  const html = routeHtml(route);
  const text = plainText(html);
  for (const href of electricalSources) {
    if (!html.includes(`href="${href}"`)) {
      addError(`${route} is missing regulator or fire-safety source ${href}`);
    }
  }
  for (const [label, pattern] of [
    ["state and territory scope", /state and territory/i],
    ["jurisdiction check", /check the regulator for the jurisdiction/i],
    ["fixed electrical boundary", /new power points, fixed wiring, in-wall electrical alterations/i],
    ["removable organiser scope", /removable, non-electrical cable wrap/i],
  ]) {
    if (!pattern.test(text)) addError(`${route} is missing ${label} wording.`);
  }
}

const guidesIndexHtml = routeHtml("/guides/");
if (/<h[1-6]\b[^>]*>\s*Home &amp; Lifestyle\s*<\/h[1-6]>/i.test(guidesIndexHtml)) {
  addError("/guides/ has reintroduced the rejected Home & Lifestyle section.");
}
const seasonalGuidesSection = guidesIndexHtml.match(
  /<section\b[^>]*>[\s\S]*?<h2[^>]*>\s*Seasonal Guides\s*<\/h2>([\s\S]*?)<\/section>/i,
)?.[0] ?? "";
if (!seasonalGuidesSection.includes('href="/guides/australian-made-gift-ideas-under-100/"')) {
  addError("/guides/ does not place the Australian made home gift guide inside Seasonal Guides.");
}

const giftRoute = "/guides/australian-made-gift-ideas-under-100/";
const giftHtml = routeHtml(giftRoute);
const giftText = plainText(giftHtml);
if (!/<h1[^>]*>\s*Australian Made Home Gift Ideas Under \$100\s*<\/h1>/i.test(giftHtml)) {
  addError(`${giftRoute} does not use the approved public title.`);
}
if (!/<p class="eyebrow">\s*Seasonal Guides\s*<\/p>/i.test(giftHtml)) {
  addError(`${giftRoute} does not use the Seasonal Guides category label.`);
}
if (/(?:home or lifestyle gift|skincare|clothing sizes|compact personal accessory)/i.test(giftText)) {
  addError(`${giftRoute} has reintroduced non-home gift scope.`);
}
for (const requiredPhrase of [
  /delivered budget/i,
  /care/i,
  /storage/i,
  /ACCC country of origin guidance/i,
  /Australian Made Campaign/i,
]) {
  if (!requiredPhrase.test(giftText)) {
    addError(`${giftRoute} is missing required origin, budget, usefulness, care or storage guidance.`);
  }
}

for (const file of walk(distRoot).filter((candidate) => candidate.endsWith(".html"))) {
  const relativePath = path.relative(distRoot, file).replaceAll(path.sep, "/");
  const html = fs.readFileSync(file, "utf8");
  for (const match of html.matchAll(/<a\b([^>]*\bhref="https?:\/\/[^"]+"[^>]*)>/gi)) {
    const attributes = match[1];
    if (!/\btarget="_blank"/i.test(attributes) || !/\brel="[^"]*\bnoopener\b[^"]*\bnoreferrer\b[^"]*"/i.test(attributes)) {
      addError(`${relativePath} has an external source link without target="_blank" and rel="noopener noreferrer".`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Editorial standards audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Editorial standards audit passed: ${technicalEvidence.size} technical guides, ${electricalRoutes.length} electrical guides, rejected visuals, headings integration, Seasonal Guides scope and external-link security.`,
);
