export interface PublishedSeasonalGuide {
  status: "published";
  title: string;
  description: string;
  href: string;
  image: string;
  imageAlt: string;
  imagePosition?: string;
}

export interface PlannedSeasonalGuide {
  status: "planned";
  title: string;
  description: string;
  href?: never;
  image?: never;
  imageAlt?: never;
  imagePosition?: never;
}

export type SeasonalGuide = PublishedSeasonalGuide | PlannedSeasonalGuide;

export interface SeasonalSection {
  id: "winter" | "spring" | "summer" | "autumn";
  title: "Winter" | "Spring" | "Summer" | "Autumn";
  introduction: string;
  guides: readonly SeasonalGuide[];
}

export const seasonalLanding = {
  href: "/seasonal/",
  eyebrow: "Seasonal Guides",
  heading: "Plan for the season ahead",
  description:
    "Practical Australian home guidance for spring, summer, autumn and winter, with regional climate differences kept in view.",
  callToAction: "Explore Seasonal Guides",
  image: "/images/seasonal-guides.webp",
  imageAlt:
    "A contemporary Australian home and garden transitioning naturally through winter, spring, summer and autumn",
  imagePosition: "62% center",
} as const;

const seasonalSectionSource = [
  {
    id: "winter",
    title: "Winter",
    introduction:
      "Winter priorities vary widely across Australia. Cooler southern regions may require regular room or whole-home heating, while households in warmer climates may only need occasional heating during early mornings or cooler evenings.\n\nWinter is also when draughts, poor insulation, condensation and uneven room temperatures become easier to notice. These guides focus on choosing suitable heating options and improving comfort without assuming that every home needs the same solution.",
    guides: [
      {
        status: "published",
        title: "Home Heating Options in Australia",
        description:
          "Compare portable heaters, reverse-cycle air conditioning, ducted systems, electric bedding and other common options before deciding how to heat your home.",
        href: "/guides/home-heating-options-australia/",
        image: "/images/home-heating-options-australia.webp",
        imageAlt:
          "A winter living room with a reverse-cycle air conditioner, an oil column heater and a folded heated throw",
      },
      {
        status: "published",
        title: "How to Reduce Draughts Before Buying a Bigger Heater",
        description:
          "Find avoidable air leaks around doors, windows, exhaust fans and other gaps without blocking the ventilation your home requires.",
        href: "/guides/reduce-draughts-before-buying-bigger-heater/",
        image: "/images/reduce-draughts-before-buying-bigger-heater.webp",
        imageAlt:
          "An Australian living room with a sealed external door, fitted curtains and closed internal doors to reduce winter draughts",
        imagePosition: "63% center",
      },
      {
        status: "published",
        title: "Heating a Bedroom: What Type Suits Overnight Comfort?",
        description:
          "Compare bed warming, reverse-cycle heating and portable options while checking airflow, noise, cords, clearances and safe bedtime use.",
        href: "/guides/heating-a-bedroom-overnight-comfort/",
        image: "/images/heating-a-bedroom-overnight-comfort.webp",
        imageAlt:
          "A winter bedroom with closed curtains, reverse-cycle air conditioning, warm bedding and an electric-blanket controller on the bedside table",
        imagePosition: "75% center",
      },
      {
        status: "published",
        title: "Heating an Open-Plan Living Area",
        description:
          "Measure the complete connected volume, glazing, ceilings and airflow before choosing heating for a kitchen, dining and living area.",
        href: "/guides/heating-an-open-plan-living-area/",
        image: "/images/heating-an-open-plan-living-area.webp",
        imageAlt:
          "An open-plan Australian kitchen, dining and living area heated by a wall-mounted reverse-cycle air conditioner",
        imagePosition: "68% center",
      },
      {
        status: "published",
        title: "Reverse-Cycle Heating Explained",
        description:
          "Understand heat-pump operation, winter efficiency, climate-zone performance, defrost cycles, sizing and installation before relying on reverse-cycle heating.",
        href: "/guides/reverse-cycle-heating-explained/",
        image: "/images/reverse-cycle-heating-explained.webp",
        imageAlt:
          "A contemporary Australian living room with reverse-cycle air conditioning, a ceiling fan and the outdoor unit visible beside the home",
        imagePosition: "65% center",
      },
      {
        status: "published",
        title: "Fan Heater vs Ceramic Heater",
        description:
          "Compare two common portable heating options, including warm-up speed, noise, controls and suitable room use.",
        href: "/guides/fan-heater-vs-ceramic-heater/",
        image: "/images/fan-heater-vs-ceramic-heater.webp",
        imageAlt:
          "A compact fan heater and a taller ceramic heater positioned safely in a winter home interior",
      },
      {
        status: "published",
        title: "Oil Column Heater vs Panel Heater",
        description:
          "Compare two quiet electric heating options, including warm-up time, retained warmth, wall and floor placement, controls and electricity use.",
        href: "/guides/oil-column-heater-vs-panel-heater/",
        image: "/images/oil-column-heater-vs-panel-heater.webp",
        imageAlt:
          "An oil column heater and a wall-mounted panel heater positioned safely in adjoining bedroom and study areas",
        imagePosition: "75% center",
      },
      {
        status: "published",
        title: "Electric Blankets vs Heated Throws",
        description:
          "Understand the difference between warming the bed, warming one person and heating an entire room.",
        href: "/guides/electric-blankets-vs-heated-throws/",
        image: "/images/electric-blankets-vs-heated-throws.webp",
        imageAlt:
          "An electric blanket controller beside a made bed with a heated throw folded over a nearby chair",
      },
      {
        status: "published",
        title: "Condensation and Mould During Winter",
        description:
          "Identify moisture sources, cold surfaces, ventilation problems and leaks before recurring winter condensation develops into a larger mould problem.",
        href: "/guides/condensation-and-mould-during-winter/",
        image: "/images/condensation-and-mould-during-winter.webp",
        imageAlt:
          "Winter condensation on an Australian home window with a small area of mould beginning near the frame",
        imagePosition: "67% center",
      },
    ],
  },
  {
    id: "spring",
    title: "Spring",
    introduction:
      "Spring often brings a shift towards cleaning, maintenance and preparing outdoor areas for warmer weather. It can also be a practical time to inspect cooling equipment and complete outdoor projects before summer demand increases.",
    guides: [
      {
        status: "published",
        title: "Spring Cleaning Checklist",
        description:
          "Work through a practical room-by-room reset without turning seasonal cleaning into an unnecessary shopping exercise.",
        href: "/guides/spring-cleaning-checklist/",
        image: "/images/spring-cleaning-checklist.webp",
        imageAlt:
          "A bright Australian living area prepared for spring cleaning with a vacuum, cleaning caddy, cloths and sorting basket",
      },
      {
        status: "published",
        title: "Spring Home Maintenance Checklist",
        description:
          "Check gutters, windows, cooling, moisture, smoke alarms and outdoor areas before warmer weather arrives.",
        href: "/guides/spring-home-maintenance-checklist/",
        image: "/images/spring-home-maintenance-checklist.webp",
        imageAlt:
          "An Australian homeowner inspecting gutters, windows and flyscreens from ground level on a mild spring morning",
      },
      {
        status: "published",
        title: "Spring Garden Reset Checklist for Australian Homes",
        description:
          "Inspect plants, soil, mulch, pots, irrigation and tools, then set practical priorities before hotter weather arrives.",
        href: "/guides/spring-garden-reset-checklist/",
        image: "/images/guides/spring-garden-reset-checklist.webp",
        imageAlt:
          "An Australian homeowner checking soil in a weathered pot beside a mulched garden bed and coiled hose",
      },
      {
        status: "published",
        title: "How to Keep Flies and Mosquitoes Out of Your Home This Spring and Summer",
        description:
          "Trace insect entry points, repair screens and seals, remove attractants and standing water, and understand product limitations.",
        href: "/guides/keep-flies-mosquitoes-out-of-home/",
        image: "/images/guides/keep-flies-mosquitoes-out-of-home.webp",
        imageAlt:
          "A fitted insect-screen door and screened window on the verandah of an Australian weatherboard home",
      },
      {
        status: "published",
        title: "How to Reduce Pollen and Dust Inside Your Home During Spring",
        description:
          "Trace entry routes, manage outdoor clothes and pet traffic, remove settled material and understand filtration limits.",
        href: "/guides/reduce-pollen-dust-inside-home-spring/",
        image: "/images/guides/reduce-pollen-dust-inside-home-spring.webp",
        imageAlt:
          "A hand using a sage cloth to wipe dust from the track of a screened window beside an Australian home entrance",
      },
      {
        status: "published",
        title: "The 20-Minute Spring Reset",
        description:
          "Choose one small spring job to make a drawer, shelf, surface or everyday area feel easier to use.",
        href: "/guides/20-minute-spring-reset/",
        image: "/images/20-minute-spring-reset.webp",
        imageAlt:
          "An open kitchen drawer and a few everyday items being sorted on a bench in an ordinary Australian home",
      },
      {
        status: "published",
        title: "Outdoor Entertaining Area Guide",
        description:
          "Plan seating, shade, lighting, storage and circulation before buying products for an outdoor entertaining space.",
        href: "/guides/outdoor-entertaining-area-setup-what-to-plan-before-buying-extra-furniture-and-accessories/",
        image:
          "/images/guides/outdoor-entertaining-area-setup-what-to-plan-before-buying-extra-furniture-and-accessories.webp",
        imageAlt:
          "An empty covered patio with flexible chairs, a timber bench, serving console and secure overhead lights",
      },
      {
        status: "published",
        title: "Lawn Care Basics",
        description:
          "Start with the condition of the lawn, local climate and maintenance requirements before choosing equipment or treatments.",
        href: "/guides/lawn-care-basics/",
        image: "/images/lawn-care-basics.webp",
        imageAlt:
          "An Australian backyard lawn with a safely parked mower, garden tools, hose reel and a small area of thinner grass",
      },
    ],
  },
  {
    id: "summer",
    title: "Summer",
    introduction:
      "Summer places different demands on Australian homes depending on location, humidity, building design and exposure to heat. Cooling, airflow and shade are often more useful starting points than simply buying the largest appliance available.",
    guides: [
      {
        status: "published",
        title: "Air Conditioning Buying Guide",
        description:
          "Compare split systems, multi-split arrangements, ducted systems and other cooling options before arranging installation.",
        href: "/guides/air-conditioning-buying-guide/",
        image: "/images/air-conditioning-buying-guide.webp",
        imageAlt:
          "A summer living room with a wall-mounted reverse-cycle air conditioner, ceiling fan and shaded windows",
      },
      {
        status: "published",
        title: "Ceiling Fans Before You Buy",
        description:
          "Check room size, ceiling height, blade clearance, mounting requirements and controls before choosing a ceiling fan.",
        href: "/guides/ceiling-fans-before-you-buy/",
        image: "/images/ceiling-fans-before-you-buy.webp",
        imageAlt:
          "A ceiling fan installed above the seating area of a shaded Australian living room",
        imagePosition: "62% center",
      },
      {
        status: "published",
        title: "Outdoor Shade Options",
        description:
          "Compare permanent and flexible shade solutions for patios, decks, windows and outdoor living areas.",
        href: "/guides/outdoor-shade-setup-for-patios-and-backyards-what-to-check-before-buying/",
        image:
          "/images/guides/outdoor-shade-setup-for-patios-and-backyards-what-to-check-before-buying.webp",
        imageAlt:
          "A retractable awning shading two patio chairs while late-afternoon sun reaches the open lawn",
      },
      {
        status: "published",
        title: "Australian Made Home Gift Ideas Under $100",
        description:
          "Plan useful Australian-made gifts for the home, kitchen, table or garden within a delivered budget.",
        href: "/guides/australian-made-gift-ideas-under-100/",
        image: "/images/australian-made-home-gift-ideas-under-100.webp",
        imageAlt:
          "A modest home gift wrapped in kraft paper beside an unbranded ceramic bowl and folded cotton tea towel on a coral sideboard",
        imagePosition: "60% center",
      },
    ],
  },
  {
    id: "autumn",
    title: "Autumn",
    introduction:
      "Autumn is a useful planning period between the extremes of summer and winter. In cooler parts of Australia, it provides time to address heat loss and organise heating before demand rises. In warmer regions, it may be more relevant for maintenance, ventilation and preparing the home for changing humidity or dry-season conditions.",
    guides: [
      {
        status: "published",
        title: "Preparing Your Home for Winter",
        description:
          "Check heating, draughts, window coverings, bedding and maintenance tasks before colder conditions arrive.",
        href: "/guides/preparing-your-home-for-winter/",
        image: "/images/preparing-your-home-for-winter.webp",
        imageAlt:
          "An Australian living room prepared for winter with curtains, a door seal, reverse-cycle air conditioning and stored winter heating items",
      },
      {
        status: "published",
        title: "Home Insulation Basics",
        description:
          "Understand where homes commonly lose and gain heat, and what to investigate before committing to insulation upgrades.",
        href: "/guides/home-insulation-basics/",
        image: "/images/home-insulation-basics.webp",
        imageAlt:
          "A cutaway of an Australian home showing insulation in the ceiling, roof and external wall",
      },
      {
        status: "published",
        title: "Gutter Maintenance Guide",
        description:
          "Know what to inspect, when professional help may be needed and how local weather conditions affect maintenance timing.",
        href: "/guides/gutter-maintenance-guide/",
        image: "/images/gutter-maintenance-guide.webp",
        imageAlt:
          "Clean gutters and a connected downpipe on an Australian home during autumn",
        imagePosition: "66% center",
      },
    ],
  },
] as const satisfies readonly SeasonalSection[];

const seasonalSectionOrder = ["spring", "summer", "autumn", "winter"] as const;

export const seasonalSections: readonly SeasonalSection[] = seasonalSectionOrder.map((seasonId) => {
  const section = seasonalSectionSource.find((item) => item.id === seasonId);

  if (!section) {
    throw new Error(`Missing seasonal section: ${seasonId}`);
  }

  return section;
});

export const publishedSeasonalGuides = seasonalSections.flatMap((season) =>
  season.guides
    .filter((guide): guide is PublishedSeasonalGuide => guide.status === "published")
    .map((guide) => ({ seasonId: season.id, seasonTitle: season.title, ...guide })),
);
