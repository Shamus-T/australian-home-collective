import { readFile } from "node:fs/promises";
import path from "node:path";
import { transform } from "esbuild";

export async function loadSeasonalGuideData(root = process.cwd()) {
  const sourcePath = path.join(root, "src", "data", "seasonalGuides.ts");
  const source = await readFile(sourcePath, "utf8");
  const { code } = await transform(source, {
    loader: "ts",
    format: "esm",
    target: "es2022",
    sourcefile: sourcePath,
  });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
  return import(moduleUrl);
}
