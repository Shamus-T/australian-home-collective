export interface SocialImage {
  src: string;
  alt: string;
}

export const DEFAULT_SOCIAL_IMAGE: SocialImage = {
  src: "/images/social-sharing.png?v=3",
  alt: "Australian Home Collective - practical guidance before you buy",
};

const categorySocialImages: Record<string, SocialImage> = {
  Kitchen: {
    src: "/images/social/kitchen.jpg",
    alt: "Australian Home Collective Kitchen guides - what to check before you buy",
  },
  Laundry: {
    src: "/images/social/laundry.jpg",
    alt: "Australian Home Collective Laundry guides - what to check before you buy",
  },
  Bathroom: {
    src: "/images/social/bathroom.jpg",
    alt: "Australian Home Collective Bathroom guides - what to check before you buy",
  },
  Bedroom: {
    src: "/images/social/bedroom.jpg",
    alt: "Australian Home Collective Bedroom guides - what to check before you buy",
  },
  "Living Spaces": {
    src: "/images/social/living-spaces.jpg",
    alt: "Australian Home Collective Living Spaces guides - what to check before you buy",
  },
  "Home Office": {
    src: "/images/social/home-office.jpg",
    alt: "Australian Home Collective Home Office guides - what to check before you buy",
  },
  Pets: {
    src: "/images/social/pets.jpg",
    alt: "Australian Home Collective Pets guides - what to check before you buy",
  },
  "Nursery & Kids": {
    src: "/images/social/nursery-kids.jpg",
    alt: "Australian Home Collective Nursery and Kids guides - what to check before you buy",
  },
  "Garage Storage": {
    src: "/images/social/garage-storage.jpg",
    alt: "Australian Home Collective Garage Storage guides - what to check before you buy",
  },
  "Garage & Storage": {
    src: "/images/social/garage-storage.jpg",
    alt: "Australian Home Collective Garage Storage guides - what to check before you buy",
  },
  "Outdoor & Garden": {
    src: "/images/social/outdoor-garden.jpg",
    alt: "Australian Home Collective Outdoor and Garden guides - what to check before you buy",
  },
};

export function getCategorySocialImage(category?: string): SocialImage {
  if (!category) return DEFAULT_SOCIAL_IMAGE;
  return categorySocialImages[category] ?? DEFAULT_SOCIAL_IMAGE;
}
