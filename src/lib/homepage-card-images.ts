import { getImage } from "astro:assets";
import laundry from "../../public/images/guides/washing-machine-and-dryer-space-what-to-measure-before-buying-storage.webp";
import dishwasher from "../../public/images/guides/dishwasher-sizes-australia.webp";
import fridge from "../../public/images/guides/fridge-dimensions-australia.webp";
import vacuum from "../../public/images/guides/cordless-vacuum-charging-storage-australia.webp";
import coffee from "../../public/images/guides/coffee-machine-formats-australia.webp";
import cooling from "../../public/images/air-conditioning-buying-guide.webp";

const images = {
  "/images/guides/washing-machine-and-dryer-space-what-to-measure-before-buying-storage.webp": laundry,
  "/images/guides/dishwasher-sizes-australia.webp": dishwasher,
  "/images/guides/fridge-dimensions-australia.webp": fridge,
  "/images/guides/cordless-vacuum-charging-storage-australia.webp": vacuum,
  "/images/guides/coffee-machine-formats-australia.webp": coffee,
  "/images/air-conditioning-buying-guide.webp": cooling,
};

// These cards are close enough to the first viewport to load during startup.
// Keep the original image as the fallback and optimise only its delivery.
export async function getHomepageCardSources() {
  return Object.fromEntries(await Promise.all(Object.entries(images).map(async ([path, src]) => {
    const options = { src, width: 1080, widths: [480, 768, 1080], quality: 45 };
    const [avif, webp] = await Promise.all([
      getImage({ ...options, format: "avif" }),
      getImage({ ...options, format: "webp" }),
    ]);
    return [path, { avif: avif.srcSet.attribute, webp: webp.srcSet.attribute }];
  })));
}
