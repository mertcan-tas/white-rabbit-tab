# White Rabbit: New Tab — Minimal Glass Redesign

**Date:** 2026-06-26
**Status:** Approved design

## Summary

Convert the extension's UI from Vuetify to a minimal "glassmorphism" design built with
Tailwind CSS v4. Remove Vuetify entirely (and its Material Design Icons font), rebuild the
views with plain Vue 3 components styled by Tailwind utility classes plus a small glass
design layer, and complete the currently-empty Settings page. All existing behavior is
preserved; only the look changes (plus Settings gains content).

## Goals

- Replace Vuetify with Tailwind v4 (CSS-first, via `@tailwindcss/vite`).
- A cohesive minimal glassmorphism aesthetic: translucent surfaces, `backdrop-filter`
  blur, thin borders, rounded corners, soft shadows.
- Keep the per-area full-screen background images (glass reads best over imagery).
- Preserve all current features: area carousel, app shortcuts with favicons, add-area /
  add-app dialogs, dark/light theme, TR/EN i18n, localStorage persistence.
- Build the empty `SettingsView` into a glass settings panel (theme + language).
- Smaller, simpler bundle; no two competing style systems.

## Non-Goals (YAGNI)

- No new features: no search bar, no app delete/edit, no drag-and-drop reordering,
  no new keyboard shortcuts. These can be separate future work.
- No backend / chrome storage migration; keep `localStorage` as-is.
- No redesign of the data model in `area-store`.

## Stack Changes

**Remove:**
- `vuetify`
- `vite-plugin-vuetify`
- `@mdi/font`

Removing `@mdi/font` also eliminates the `materialdesignicons-webfont` preload links —
the source of the earlier "unsupported preload type" warnings.

**Add:**
- `tailwindcss` (v4)
- `@tailwindcss/vite`

**Keep:**
- Vue 3, `vue-router`, Pinia (`area-store`, `theme-store`), `vue-i18n` (TR/EN),
  `@fontsource/roboto`, Vite, `vite-plugin-static-copy` (manifest + icons), `unplugin-fonts`
  (Roboto only), `remove-preload.js` (kept as a build-chain safety net).

**Icons:** inline SVG via a small `Icon.vue` component (no icon font). Needed glyphs:
`plus`, `gear`, `close`, `chevron-left`, `chevron-right`, `sun`, `moon`, `globe`, `check`.

## Architecture

```
main.js
  └─ registerPlugins(app)  → router, pinia, i18n   (vuetify removed)
  └─ import "@/assets/css/main.css"                 (was main.scss)

App.vue → <RouterView/>

BaseLayout.vue (thin shell)
  - applies .dark class via theme-store
  - applies document lang via i18n + theme-store
  - initSettings() on mount

views/
  home/HomeView.vue       — area carousel + glass app grid + glass dock + modals
  settings/SettingsView.vue — glass settings panel

components/
  AppCard.vue    — single glass shortcut (favicon + name)
  GlassModal.vue — teleport-based modal shell (used by add-area & add-app)
  Icon.vue       — inline SVG icon set

plugins/stores/
  theme-store.js — toggles .dark on <html>, persists; language unchanged
  area-store.js  — UNCHANGED (areas, favicon cache, add app/area, localStorage)
```

## Styling / Glass System

`src/assets/css/main.css` replaces `main.scss`:

```css
@import "tailwindcss";

/* class-based dark mode so theme-store can toggle <html class="dark"> */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: "Roboto", sans-serif;
}

/* glass surface — tuned via utilities at call sites; base tokens here */
@layer components {
  .glass {
    background: color-mix(in srgb, white 10%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid color-mix(in srgb, white 18%, transparent);
    border-radius: 1rem;
  }
  .dark .glass {
    background: color-mix(in srgb, black 25%, transparent);
    border-color: color-mix(in srgb, white 12%, transparent);
  }
}
```

- Hidden scrollbars and `no-select` behavior from the old SCSS are carried over as small
  utilities or Tailwind classes (`select-none`, `[scrollbar-width:none]`).
- Roboto stays the primary font (via `@fontsource/roboto` + `unplugin-fonts`).

## Theme (dark/light)

- `theme-store` keeps `isDark` + `currentLanguage` state and the existing `localStorage`
  keys (`darkMode`, `language`) and `initSettings()`.
- New behavior: when `isDark` changes, toggle `document.documentElement.classList`
  `"dark"`. Applied in `BaseLayout` (watch + on mount) so Tailwind `dark:` variants and
  `.dark .glass` activate.
- Default theme: dark (matches current `defaultTheme: "dark"`).

## Components

### HomeView.vue
- Full-screen background = current area's `background` image (`bg-cover bg-center`),
  with a subtle dark overlay for contrast.
- Centered glass container holding a responsive grid of `AppCard`s plus a trailing
  "+ Ekle" card that opens the add-app modal.
- Bottom glass "dock": area chips (switch `currentArea`), an "Alan Ekle" chip (opens
  add-area modal), and a ⚙ gear linking to `/settings`.
- Area switching: simple `currentArea` index + optional left/right chevrons; no Vuetify
  carousel. Background swaps with a CSS fade transition.
- Modals use `GlassModal`; validation shows inline messages instead of `alert()`.

### AppCard.vue
- Props: `name`, `url`, `icon`. Renders an anchor (`<a :href>`), glass card, favicon
  avatar, truncated name. Hover: slight lift / brighter glass.

### GlassModal.vue
- Teleport to body, backdrop blur, glass panel, slot for content, emits `close`.
- Closes on backdrop click and Esc. Avoids native dialog/`alert` (also matches the
  project's no-blocking-dialog preference).

### SettingsView.vue
- Glass panel centered on a minimal gradient/dark background.
- Controls: dark/light toggle (sun/moon), language switch (TR/EN, globe), back button to
  `/`. Wires to `theme-store` (`toggleDarkMode`, `setLanguage`).

## i18n

- Keep `vue-i18n` with `tr` / `en` locales. Move user-facing strings used in the redesign
  ("Ekle", "Alan Ekle", "Yeni Alan Ekle", field labels, validation text, settings labels)
  through `t(...)`, adding keys to `locales/tr.js` and `locales/en.js` as needed.

## Routing

- Routes unchanged (`/`, `/settings`, catch-all → home). Add gear nav (home → settings)
  and back nav (settings → home).

## Build / Config

- `vite.config.mjs`: remove `Vuetify()` + `transformAssetUrls`; add `@tailwindcss/vite`.
  `unplugin-vue-components` `Components()` keeps auto-importing from `src/components`,
  `src/layouts`, `src/views`. `viteStaticCopy` (manifest + icons) and `Fonts` (Roboto)
  unchanged.
- `package.json`: dependency swap above. `build` already chains `remove-preload.js`.
- Verify `pnpm build` produces a clean `dist/` and the extension loads without warnings.

## Files Touched

| File | Change |
|------|--------|
| `package.json` | remove vuetify/@mdi/font/vite-plugin-vuetify; add tailwindcss + @tailwindcss/vite |
| `vite.config.mjs` | drop Vuetify plugin; add Tailwind plugin |
| `src/assets/css/main.scss` → `main.css` | Tailwind import + glass layer + carried-over utilities |
| `src/main.js` | import `main.css` instead of `main.scss` |
| `src/plugins/index.js` | remove vuetify registration |
| `src/plugins/vuetify/index.js` | delete |
| `src/plugins/stores/theme-store.js` | toggle `.dark` class on `<html>` |
| `src/layouts/BaseLayout.vue` | thin shell, apply dark class + lang |
| `src/views/home/HomeView.vue` | full rewrite, Tailwind glass |
| `src/views/settings/SettingsView.vue` | build glass settings panel |
| `src/components/AppCard.vue` | new |
| `src/components/GlassModal.vue` | new |
| `src/components/Icon.vue` | new |
| `src/plugins/i18n/locales/{tr,en}.js` | add UI keys |

## Testing / Verification

- `pnpm dev` — visually verify home (areas switch, add app, add area, dark/light, TR/EN)
  and settings.
- `pnpm build` then load `dist/` as an unpacked extension in Chrome:
  - No manifest/icon errors, no preload warnings, no console errors.
  - New tab renders the glass UI; shortcuts open; theme + language persist across reloads.
- Confirm no remaining `vuetify` / `@mdi` imports anywhere in `src`.

## Risks / Notes

- `backdrop-filter` is well-supported in Chrome (the only target), so glass is safe.
- Rewriting `HomeView` is the largest piece; the area/app data contract from `area-store`
  stays identical, limiting blast radius to presentation.
- Inline validation replaces `alert()`, a small UX improvement aligned with "minimal".
