<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="(d, i) in paths" :key="i" :d="d" />
    <circle
      v-for="(c, i) in circles"
      :key="`c${i}`"
      :cx="c[0]"
      :cy="c[1]"
      :r="c[2]"
    />
  </svg>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 22 },
  strokeWidth: { type: [Number, String], default: 1.8 },
});

// Minimal line icons (Lucide-style), drawn with currentColor.
const ICONS = {
  plus: { paths: ["M12 5v14", "M5 12h14"] },
  close: { paths: ["M18 6 6 18", "M6 6l12 12"] },
  gear: {
    paths: [
      "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
      "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z",
    ],
  },
  "chevron-left": { paths: ["m15 18-6-6 6-6"] },
  "chevron-right": { paths: ["m9 18 6-6-6-6"] },
  "arrow-left": { paths: ["m12 19-7-7 7-7", "M19 12H5"] },
  sun: {
    paths: [
      "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
      "M12 1v2",
      "M12 21v2",
      "M4.22 4.22l1.42 1.42",
      "M18.36 18.36l1.42 1.42",
      "M1 12h2",
      "M21 12h2",
      "M4.22 19.78l1.42-1.42",
      "M18.36 5.64l1.42-1.42",
    ],
  },
  moon: { paths: ["M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"] },
  globe: {
    paths: ["M12 2a15.3 15.3 0 0 1 0 20", "M12 2a15.3 15.3 0 0 0 0 20", "M2 12h20"],
    circles: [[12, 12, 10]],
  },
  check: { paths: ["M20 6 9 17l-5-5"] },
  search: { paths: ["m21 21-4.35-4.35"], circles: [[11, 11, 7]] },
  display: { paths: ["M3 5h18v11H3z", "M8 20h8", "M12 16v4"] },
  shuffle: {
    paths: ["M16 3h5v5", "M4 20 21 3", "M21 16v5h-5", "M15 15l6 6", "M4 4l5 5"],
  },
  link: {
    paths: [
      "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
      "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    ],
  },
  trash: { paths: ["M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-7 0v12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7"] },
  pencil: { paths: ["M4 20h4L18 10l-4-4L4 16v4zM14 6l4 4"] },
  external: { paths: ["M14 5h5v5M19 5l-8 8M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"] },
  move: { paths: ["M12 3v18M3 12h18M8 7l4-4 4 4M8 17l4 4 4-4M7 8l-4 4 4 4M17 8l4 4-4 4"] },
  download: { paths: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"] },
  upload: { paths: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"] },
  database: {
    paths: [
      "M20 6c0 1.66-3.58 3-8 3S4 7.66 4 6s3.58-3 8-3 8 1.34 8 3Z",
      "M20 6v6c0 1.66-3.58 3-8 3s-8-1.34-8-3V6",
      "M20 12v6c0 1.66-3.58 3-8 3s-8-1.34-8-3v-6",
    ],
  },
};

const paths = computed(() => ICONS[props.name]?.paths ?? []);
const circles = computed(() => ICONS[props.name]?.circles ?? []);
</script>
