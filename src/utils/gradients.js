// Dark, atmospheric multi-color "mesh" gradients (glowing colors over a near-black
// base), inspired by the reference wallpapers. Used as the new-tab background.
export const GRADIENTS = [
  {
    id: "hexpane",
    name: "Hexpane",
    css:
      "radial-gradient(at 22% 14%, #3a5fd6 0, transparent 48%)," +
      "radial-gradient(at 80% 90%, #15213f 0, transparent 55%), #090c13",
  },
  {
    id: "midnight",
    name: "Midnight",
    css:
      "radial-gradient(at 18% 88%, #7c3aed 0, transparent 45%)," +
      "radial-gradient(at 50% 100%, #2563eb 0, transparent 48%)," +
      "radial-gradient(at 88% 78%, #06b6d4 0, transparent 42%), #05060c",
  },
  {
    id: "inferno",
    name: "Inferno",
    css:
      "radial-gradient(at 22% 82%, #ef4444 0, transparent 46%)," +
      "radial-gradient(at 96% 12%, #0e7490 0, transparent 44%), #0a0e1a",
  },
  {
    id: "patriot",
    name: "Patriot",
    css:
      "radial-gradient(at 0% 0%, #1e3a8a 0, transparent 55%)," +
      "radial-gradient(at 100% 4%, #dc2626 0, transparent 52%), #070711",
  },
  {
    id: "halo",
    name: "Halo",
    css:
      "radial-gradient(at 78% 12%, #ddd6fe 0, transparent 42%)," +
      "radial-gradient(at 25% 45%, #3b5bdb 0, transparent 52%), #0a1020",
  },
  {
    id: "prism",
    name: "Prism",
    css: "linear-gradient(115deg, #1e40af 0%, #6d28d9 30%, #ea580c 72%, #dc2626 100%)",
  },
  {
    id: "aurora",
    name: "Aurora",
    css:
      "radial-gradient(at 15% 20%, #6d28d9 0, transparent 45%)," +
      "radial-gradient(at 85% 25%, #0891b2 0, transparent 45%)," +
      "radial-gradient(at 50% 95%, #15803d 0, transparent 50%), #060a0c",
  },
  {
    id: "ember",
    name: "Ember",
    css:
      "radial-gradient(at 25% 80%, #ea580c 0, transparent 46%)," +
      "radial-gradient(at 80% 28%, #b91c1c 0, transparent 45%), #0a0707",
  },
  {
    id: "violet",
    name: "Violet",
    css:
      "radial-gradient(at 20% 25%, #db2777 0, transparent 45%)," +
      "radial-gradient(at 85% 80%, #4338ca 0, transparent 48%), #0a0712",
  },
  {
    id: "ocean",
    name: "Ocean",
    css:
      "radial-gradient(at 30% 20%, #0891b2 0, transparent 48%)," +
      "radial-gradient(at 80% 85%, #1d4ed8 0, transparent 48%), #050a12",
  },
  {
    id: "sunset",
    name: "Sunset",
    css:
      "radial-gradient(at 20% 82%, #f97316 0, transparent 46%)," +
      "radial-gradient(at 82% 18%, #db2777 0, transparent 46%), #0c0709",
  },
  {
    id: "forest",
    name: "Forest",
    css:
      "radial-gradient(at 25% 25%, #15803d 0, transparent 46%)," +
      "radial-gradient(at 85% 80%, #0e7490 0, transparent 48%), #050a08",
  },
  {
    id: "nebula",
    name: "Nebula",
    css:
      "radial-gradient(at 0% 0%, #7b4dff 0, transparent 50%)," +
      "radial-gradient(at 100% 0%, #ff5edf 0, transparent 50%)," +
      "radial-gradient(at 50% 100%, #00d4ff 0, transparent 50%), #0b0820",
  },
];

export const DEFAULT_GRADIENT = GRADIENTS[0].id;

export function gradientCss(id) {
  const found = GRADIENTS.find((g) => g.id === id);
  return (found || GRADIENTS[0]).css;
}
