const categoryPaths: Record<string, string> = {
  Bathroom: "/categories/bathroom/",
  Bedroom: "/categories/bedroom/",
  "Garage & Storage": "/categories/garage-storage/",
  "Garage Storage": "/categories/garage-storage/",
  "Home Office": "/categories/home-office/",
  Kitchen: "/categories/kitchen/",
  Laundry: "/categories/laundry/",
  "Living Spaces": "/categories/living-spaces/",
  "Nursery & Kids": "/categories/nursery-kids/",
  "Outdoor & Garden": "/categories/outdoor-garden/",
  Pets: "/categories/pets/",
  "Seasonal Guides": "/seasonal/",
};

export function getCategoryPath(category: string): string | undefined {
  return categoryPaths[category];
}
