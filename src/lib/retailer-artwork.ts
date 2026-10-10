import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import branding from "../data/retailer-branding.json";

// Build-time embedding preserves the approved pixels without a separate logo request.
const bytes = readFileSync("public" + branding.goodGuys.src);
if (createHash("sha256").update(bytes).digest("hex") !== branding.goodGuys.sha256) {
  throw new Error("Good Guys artwork differs from the user-approved logo. Do not substitute it.");
}
export const goodGuysArtworkDataUrl = "data:image/png;base64," + bytes.toString("base64");
