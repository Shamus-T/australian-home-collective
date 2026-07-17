import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const args = process.argv.slice(2);

function argument(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

const commit = argument("--commit");
const date = argument("--date");

if (!commit || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
  console.error("Usage: npm run sitemap:update -- --commit <commit> --date YYYY-MM-DD");
  process.exit(1);
}

const changedFiles = execFileSync(
  "git",
  ["show", "--pretty=format:", "--name-only", commit],
  { cwd: root, encoding: "utf8" },
).split(/\r?\n/).filter(Boolean);

const routes = changedFiles.flatMap((file) => {
  const match = file.match(/^src\/pages\/(.+)\/index\.astro$/);
  if (match && !match[1].includes("[")) return [`/${match[1]}/`];
  if (file === "src/pages/index.astro") return ["/"];
  return [];
});

const sitemapPath = path.join(root, "public", "sitemap.xml");
let sitemap = fs.readFileSync(sitemapPath, "utf8");
let updated = 0;

for (const route of new Set(routes)) {
  const escapedUrl = `https://australianhomecollective.com.au${route}`
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(<url><loc>${escapedUrl}<\\/loc><lastmod>)\\d{4}-\\d{2}-\\d{2}(<\\/lastmod><\\/url>)`);
  if (!pattern.test(sitemap)) continue;
  sitemap = sitemap.replace(pattern, `$1${date}$2`);
  updated += 1;
}

fs.writeFileSync(sitemapPath, sitemap);
console.log(`Updated ${updated} sitemap lastmod entries to ${date} from commit ${commit}.`);
