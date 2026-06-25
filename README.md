# White Rabbit: New Tab

> Discover a stunning start to every tab.

<p align="center">
  <img src="src/assets/preview.png" alt="White Rabbit: New Tab preview" />
</p>

White Rabbit is a customizable new tab extension for Chrome. It replaces the
default new tab page with a beautiful, full-screen background, organized
quick-access shortcuts, and a clean, distraction-free interface that you can
shape to fit the way you browse.

## Features

- **Beautiful Backgrounds** – Each area carries its own full-screen background
  image. Use one of the bundled backgrounds or point an area at any image URL
  you like.
- **Organized Areas** – Group your shortcuts into separate "areas" (for example
  *Development*, *Design*, *Social*) and switch between them from the chips at
  the bottom of the page.
- **Quick-Access Shortcuts** – Add shortcuts to your favorite sites with a name
  and a URL. Click a shortcut card to open the site.
- **Automatic Favicons** – When you add a shortcut, its icon is fetched
  automatically from the site's favicon.
- **Fast Icon Loading via Caching** – Fetched favicons are stored as cached
  data URLs in your browser, so they load instantly on subsequent visits and
  keep working offline.
- **Local Persistence** – Your areas, shortcuts, and preferences are saved in
  the browser's local storage, so they persist across sessions on the same
  machine.
- **Light & Dark Themes** – Built on Vuetify's theming, with a configurable
  dark mode.
- **Internationalization** – Ships with English and Turkish locales via
  `vue-i18n`.

## Tech Stack

- **[Vue 3](https://vuejs.org/)** – Application framework
- **[Vuetify 3](https://vuetifyjs.com/)** – Material Design component library
- **[Pinia](https://pinia.vuejs.org/)** – State management (areas, theme,
  language, favicon cache)
- **[Vue Router](https://router.vuejs.org/)** – Routing (home and settings
  views)
- **[vue-i18n](https://vue-i18n.intlify.dev/)** – Internationalization (English
  and Turkish)
- **[Vite](https://vitejs.dev/)** – Build tooling and dev server
- **Chrome Extension (Manifest V3)** – Packaged as a `chrome_url_overrides`
  new tab page

## Installation

### From the Chrome Web Store

If a published listing is available, install White Rabbit from the Chrome Web
Store and open a new tab to get started.

### From source (load unpacked)

1. Clone this repository and install dependencies (this project uses
   [pnpm](https://pnpm.io/)):
   ```bash
   pnpm install
   ```
2. Build the extension:
   ```bash
   pnpm build
   ```
   This produces a `dist/` folder containing the packaged extension.
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode** (toggle in the top-right corner).
5. Click **Load unpacked** and select the generated **`dist/`** folder.
6. Open a new tab to see White Rabbit.

## Usage

When you open a new tab, you see your current area's background and its
shortcut cards. The chips at the bottom of the screen let you switch between
areas and create new ones.

### Switching and adding areas

- Click any area chip at the bottom of the page to switch to that area.
- Click the **Add Area** chip to create a new area. Provide a label and,
  optionally, a background image URL.

### Adding a shortcut

1. Click the **+** card at the end of the current area's shortcuts.
2. Enter the shortcut's title.
3. Enter the shortcut's URL (e.g. `example.com` — it is normalized to
   `https://` automatically). The favicon is fetched and cached for you.
4. Save. The new shortcut is added to the current area.

### Opening a shortcut

Click a shortcut card to open the linked site.

## Development

Run the Vite dev server with hot-module reloading:

```bash
pnpm install
pnpm dev
```

The dev server runs on `http://localhost:3000`. Note that some
extension-specific behavior (the new tab override, packaged icons, and the
copied `manifest.json`) is only present in a production build; use
`pnpm build` and **Load unpacked** to test the extension inside Chrome.

Available scripts:

| Script                   | Description                                   |
| ------------------------ | --------------------------------------------- |
| `pnpm dev`               | Start the Vite development server             |
| `pnpm build`             | Build the extension into `dist/`              |
| `pnpm preview`           | Preview the production build locally          |
| `pnpm remove-preload`    | Strip `rel="preload"` attributes from the build's `index.html` |

## Project Structure

```
white-rabbit-tab/
├── manifest.json          # Chrome extension manifest (Manifest V3)
├── index.html             # App entry HTML
├── vite.config.mjs        # Vite configuration (Vue, Vuetify, fonts, static copy)
├── remove-preload.js      # Post-build helper to strip preload links
└── src/
    ├── main.js            # App bootstrap
    ├── App.vue            # Root component (router outlet)
    ├── assets/            # Styles, fonts, icons, background, preview image
    ├── layouts/           # BaseLayout (Vuetify app shell + theme/i18n wiring)
    ├── views/
    │   ├── home/          # HomeView – areas, backgrounds, shortcuts
    │   └── settings/      # SettingsView
    └── plugins/
        ├── index.js       # Registers router, Pinia, Vuetify, i18n
        ├── router/        # Vue Router setup
        ├── stores/        # Pinia stores (area-store, theme-store)
        ├── vuetify/       # Vuetify theme and defaults
        └── i18n/          # vue-i18n setup and locale files (en, tr)
```

## License

Released under the [MIT License](LICENSE).
