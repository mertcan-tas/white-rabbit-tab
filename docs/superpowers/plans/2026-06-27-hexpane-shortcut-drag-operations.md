# Hexpane Shortcut Operations & Pointer Drag Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full shortcut CRUD (reorder, delete, edit, move-between-pages), folder/page reordering, and open-in-new-tab to the Hexpane new-tab grid, driven by a custom pointer-based drag engine with live reordering and dwell-to-folder.

**Architecture:** Pure logic lives in the Pinia store (`area-store.js`) as small, unit-tested actions. The view (`HomeView.vue`) replaces native HTML5 drag with a pointer (`pointerdown`/`pointermove`/`pointerup`) engine that reorders a local display list animated by Vue `<TransitionGroup>` (FLIP) and commits to the store on drop. A new `ContextMenu.vue` exposes rename/edit/delete/move. External URL-drop (bookmark → shortcut) stays on native DnD untouched.

**Tech Stack:** Vue 3 `<script setup>`, Pinia, vue-i18n, Tailwind v4, Vite. Tests via Vitest + happy-dom (new).

## Global Constraints

- Manifest V3; `permissions: ["bookmarks"]`, no `host_permissions` (favicons load via `<img>`, no fetch).
- Favicons are assigned as URL strings (`https://www.google.com/s2/favicons?domain=<host>&sz=128`); never `fetch()` them.
- Data model unchanged: `areas[]` = `{ label, background?, apps[] }`; an item is an app `{ name, url, icon }` or a folder `{ type:"folder", name, apps[] }`. Persist to `localStorage` keys `areas`, `faviconCache`.
- Folders never nest inside folders.
- Build must stay clean: `pnpm build` succeeds and `remove-preload.js` reports no preload tags.
- **Commits are the user's job.** The implementer does NOT run `git commit`/`git push`. Each task ends at a verified checkpoint; the user commits.
- Manual verification runs in the loaded unpacked extension (reload + fresh new tab) since pointer-drag cannot be unit-tested.

---

## File Structure

- `vite.config.mjs` — add a `test` block (Vitest, happy-dom). *(modify)*
- `package.json` — add `vitest`, `happy-dom` dev deps + `"test": "vitest run"`. *(modify)*
- `src/plugins/stores/area-store.js` — new actions + small URL/host helpers. *(modify)*
- `src/plugins/stores/area-store.test.js` — store unit tests. *(create)*
- `src/components/ContextMenu.vue` — teleported right-click menu. *(create)*
- `src/components/Icon.vue` — add `trash`, `pencil`, `move`, `external` glyphs. *(modify)*
- `src/views/home/HomeView.vue` — pointer drag engine, context menu wiring, edit modal, new-tab open, page-dot drop/reorder, folder-internal reorder. *(modify)*
- `src/plugins/i18n/locales/en.js`, `tr.js` — new keys. *(modify)*

---

## Task 1: Store array helpers + `reorderItem` / `removeItem` (TDD)

**Files:**
- Modify: `vite.config.mjs`, `package.json`
- Modify: `src/plugins/stores/area-store.js`
- Test: `src/plugins/stores/area-store.test.js` (create)

**Interfaces:**
- Produces: `reorderItem(areaIndex, fromIdx, toIdx)`, `removeItem(areaIndex, idx)` on the store. Helper `arrayMove(arr, from, to)` (module-local, not exported).

- [ ] **Step 1: Add test deps and script**

In `package.json` `devDependencies` add `"vitest": "^3.0.0"` and `"happy-dom": "^15.0.0"`, and in `scripts` add `"test": "vitest run"`. Then run:

```bash
pnpm install
```

- [ ] **Step 2: Configure Vitest in `vite.config.mjs`**

Add to the `defineConfig({ ... })` object (top level, alongside `plugins`):

```js
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.js"],
  },
```

- [ ] **Step 3: Write the failing test**

Create `src/plugins/stores/area-store.test.js`:

```js
import { beforeEach, describe, expect, it } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAreaStore } from "./area-store.js";

function seed(store) {
  store.areas = [
    { label: "A", apps: [
      { name: "one", url: "https://one.com", icon: "i1" },
      { name: "two", url: "https://two.com", icon: "i2" },
      { name: "three", url: "https://three.com", icon: "i3" },
    ] },
    { label: "B", apps: [{ name: "b1", url: "https://b1.com", icon: "ib" }] },
  ];
  store.faviconCache = {};
}

describe("reorderItem / removeItem", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("moves an item to a new index", () => {
    const s = useAreaStore();
    seed(s);
    s.reorderItem(0, 0, 2);
    expect(s.areas[0].apps.map((a) => a.name)).toEqual(["two", "three", "one"]);
  });

  it("is a no-op when from === to", () => {
    const s = useAreaStore();
    seed(s);
    s.reorderItem(0, 1, 1);
    expect(s.areas[0].apps.map((a) => a.name)).toEqual(["one", "two", "three"]);
  });

  it("removes an item by index", () => {
    const s = useAreaStore();
    seed(s);
    s.removeItem(0, 1);
    expect(s.areas[0].apps.map((a) => a.name)).toEqual(["one", "three"]);
  });
});
```

- [ ] **Step 4: Run the test, verify it FAILS**

Run: `pnpm test -- area-store`
Expected: FAIL — `reorderItem`/`removeItem` are not functions.

- [ ] **Step 5: Implement the actions**

In `src/plugins/stores/area-store.js`, above `export const useAreaStore`, add the helper:

```js
function arrayMove(arr, from, to) {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return;
  const [el] = arr.splice(from, 1);
  arr.splice(to, 0, el);
}
```

Inside `actions`, add:

```js
    reorderItem(areaIndex, fromIdx, toIdx) {
      const items = this.areas[areaIndex]?.apps;
      if (!items) return;
      arrayMove(items, fromIdx, toIdx);
      this.saveToLocalStorage();
    },

    removeItem(areaIndex, idx) {
      const items = this.areas[areaIndex]?.apps;
      if (!items || idx < 0 || idx >= items.length) return;
      items.splice(idx, 1);
      this.saveToLocalStorage();
    },
```

- [ ] **Step 6: Run the test, verify it PASSES**

Run: `pnpm test -- area-store`
Expected: PASS (3 tests).

- [ ] **Step 7: Checkpoint** — `pnpm build` succeeds. Leave for the user to commit.

---

## Task 2: Store `updateItem`, `moveItemToArea`, `reorderArea`, `reorderInFolder` (TDD)

**Files:**
- Modify: `src/plugins/stores/area-store.js`
- Test: `src/plugins/stores/area-store.test.js`

**Interfaces:**
- Consumes: `arrayMove`, `isFolder` (already exported from the store module).
- Produces:
  - `updateItem(areaIndex, idx, { name, url })` — edits an app; recomputes `icon` from the new hostname when the host changes; ignores folders.
  - `moveItemToArea(fromArea, fromIdx, toArea)` — appends the item to `toArea` and removes it from `fromArea`.
  - `reorderArea(fromIdx, toIdx)` — reorders the `areas` array.
  - `reorderInFolder(areaIndex, folderIdx, fromIdx, toIdx)` — reorders a folder's `apps`.

- [ ] **Step 1: Write the failing tests**

Append to `src/plugins/stores/area-store.test.js`:

```js
describe("updateItem / moveItemToArea / reorderArea / reorderInFolder", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("renames without touching icon", () => {
    const s = useAreaStore(); seed(s);
    s.updateItem(0, 0, { name: "renamed" });
    expect(s.areas[0].apps[0].name).toBe("renamed");
    expect(s.areas[0].apps[0].icon).toBe("i1");
  });

  it("recomputes icon when hostname changes", () => {
    const s = useAreaStore(); seed(s);
    s.updateItem(0, 0, { url: "github.com" });
    expect(s.areas[0].apps[0].url).toBe("https://github.com/");
    expect(s.areas[0].apps[0].icon).toContain("github.com");
  });

  it("moves an item to another area (appended)", () => {
    const s = useAreaStore(); seed(s);
    s.moveItemToArea(0, 0, 1);
    expect(s.areas[0].apps.map((a) => a.name)).toEqual(["two", "three"]);
    expect(s.areas[1].apps.map((a) => a.name)).toEqual(["b1", "one"]);
  });

  it("reorders areas", () => {
    const s = useAreaStore(); seed(s);
    s.reorderArea(0, 1);
    expect(s.areas.map((a) => a.label)).toEqual(["B", "A"]);
  });

  it("reorders items inside a folder", () => {
    const s = useAreaStore();
    setActivePinia(createPinia());
    s.areas = [{ label: "A", apps: [
      { type: "folder", name: "f", apps: [
        { name: "x", url: "https://x.com", icon: "ix" },
        { name: "y", url: "https://y.com", icon: "iy" },
      ] },
    ] }];
    s.faviconCache = {};
    s.reorderInFolder(0, 0, 0, 1);
    expect(s.areas[0].apps[0].apps.map((a) => a.name)).toEqual(["y", "x"]);
  });
});
```

- [ ] **Step 2: Run the tests, verify they FAIL**

Run: `pnpm test -- area-store`
Expected: FAIL — new actions undefined.

- [ ] **Step 3: Add URL/host helpers**

In `src/plugins/stores/area-store.js`, near `arrayMove`, add:

```js
function normalizeUrl(input) {
  if (!input) return null;
  let s = input.trim();
  if (!/^https?:\/\//i.test(s)) s = "https://" + s.replace(/^\/+/, "");
  try {
    return new URL(s);
  } catch {
    return null;
  }
}

function safeHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}
```

- [ ] **Step 4: Implement the actions**

Inside `actions`, add:

```js
    updateItem(areaIndex, idx, { name, url } = {}) {
      const item = this.areas[areaIndex]?.apps?.[idx];
      if (!item || isFolder(item)) return;
      if (name != null) item.name = name;
      if (url != null) {
        const valid = normalizeUrl(url);
        if (valid) {
          const newHost = valid.hostname;
          const changed = newHost !== safeHost(item.url);
          item.url = valid.toString();
          if (changed) {
            item.icon =
              this.faviconCache[newHost] ||
              `https://www.google.com/s2/favicons?domain=${newHost}&sz=128`;
          }
        }
      }
      this.saveToLocalStorage();
    },

    moveItemToArea(fromArea, fromIdx, toArea) {
      if (fromArea === toArea) return;
      const src = this.areas[fromArea]?.apps;
      const dst = this.areas[toArea]?.apps;
      if (!src || !dst || fromIdx < 0 || fromIdx >= src.length) return;
      const [item] = src.splice(fromIdx, 1);
      dst.push(item);
      this.saveToLocalStorage();
    },

    reorderArea(fromIdx, toIdx) {
      arrayMove(this.areas, fromIdx, toIdx);
      this.saveToLocalStorage();
    },

    reorderInFolder(areaIndex, folderIdx, fromIdx, toIdx) {
      const folder = this.areas[areaIndex]?.apps?.[folderIdx];
      if (!isFolder(folder)) return;
      arrayMove(folder.apps, fromIdx, toIdx);
      this.saveToLocalStorage();
    },
```

- [ ] **Step 5: Run the tests, verify they PASS**

Run: `pnpm test -- area-store`
Expected: PASS (all tests, Task 1 + Task 2).

- [ ] **Step 6: Checkpoint** — `pnpm build` succeeds. Leave for the user to commit.

---

## Task 3: Open in new tab (Ctrl/⌘/middle-click)

**Files:**
- Modify: `src/views/home/HomeView.vue`

**Interfaces:**
- Consumes: existing `openUrl(url)`, `onItemClick(item, i)`.
- Produces: `openUrl(url, newTab=false)`; click handlers pass the modifier intent.

- [ ] **Step 1: Update `openUrl` to support new tab**

Replace the existing `openUrl`:

```js
function openUrl(url, newTab = false) {
  if (newTab) window.open(url, "_blank", "noopener");
  else window.location.href = url;
}
```

- [ ] **Step 2: Pass modifier intent from clicks**

Change `onItemClick` to accept the event and detect modifiers:

```js
function onItemClick(item, i, e) {
  if (isFolder(item)) {
    openFolder(i);
    return;
  }
  const newTab = !!(e && (e.metaKey || e.ctrlKey || e.button === 1));
  openUrl(item.url, newTab);
}
```

In the template, update the tile handler to forward the event, and add middle-click support:

```html
                @click="onItemClick(item, i, $event)"
                @auxclick="$event.button === 1 && onItemClick(item, i, $event)"
```

And in the folder overlay, update the inner open button:

```html
                    @click="openUrl(app.url, $event.metaKey || $event.ctrlKey)"
                    @auxclick="$event.button === 1 && openUrl(app.url, true)"
```

- [ ] **Step 3: Verify (manual)**

Run `pnpm build`, reload the extension, open a fresh new tab. Click a tile → opens in current tab. Ctrl/⌘-click or middle-click → opens in a new tab; the new-tab page stays.

- [ ] **Step 4: Checkpoint** — `pnpm build` clean. Leave for the user to commit.

---

## Task 4: Pointer drag engine — live reorder within a page

This replaces the native HTML5 drag (`draggable`/`dragstart`/`dragover`/`drop`) used for folder creation. Folder creation is re-added in Task 5.

**Files:**
- Modify: `src/views/home/HomeView.vue`

**Interfaces:**
- Consumes: `currentItems` (computed), `currentArea` (ref), `areaStore.reorderItem`, `isFolder`, `itemKey`.
- Produces: pointer state (`drag` reactive), `displayItems` (ref), handlers `onTilePointerDown(i, e)`, and a `<TransitionGroup>`-wrapped grid keyed by `itemKey`.

- [ ] **Step 1: Add display list + drag state**

In `<script setup>`, after `currentItems` is defined, add:

```js
// Local display order during a drag; mirrors the store except while dragging.
const displayItems = ref([]);
const isDragging = ref(false);
watch(
  [currentItems, isDragging],
  () => {
    if (!isDragging.value) displayItems.value = currentItems.value.slice();
  },
  { immediate: true }
);

const drag = reactive({
  active: false,        // past the move threshold
  fromIdx: -1,          // original index in displayItems at drag start
  item: null,           // the dragged item object
  x: 0, y: 0,           // current pointer position (for the clone)
  startX: 0, startY: 0, // pointerdown position
});
const THRESHOLD = 6;
```

- [ ] **Step 2: Replace the grid markup with a TransitionGroup over `displayItems`**

In the "Page view" block, replace the inner `<div :key="currentArea" ...>` grid and its `v-for` with a `<TransitionGroup>`. The tiles now iterate `displayItems`, use pointer handlers (no `draggable`/`@dragstart`/`@dragover`/`@drop`), and dim the dragged one:

```html
          <Transition v-else :name="slideName" mode="out-in">
            <TransitionGroup
              :key="currentArea"
              tag="div"
              name="tile"
              class="mx-auto grid w-full max-w-5xl grid-cols-4 justify-items-center
                     gap-x-2 gap-y-7 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7"
            >
              <div
                v-for="(item, i) in displayItems"
                :key="itemKey(item, i)"
                :data-idx="i"
                class="group flex w-[104px] cursor-pointer flex-col items-center gap-2
                       rounded-2xl px-1 py-2 transition hover:bg-white/10"
                :class="{ 'opacity-30': drag.active && drag.fromIdx === i }"
                @pointerdown="onTilePointerDown(i, $event)"
                @click="onItemClick(item, i, $event)"
                @auxclick="$event.button === 1 && onItemClick(item, i, $event)"
                @contextmenu.prevent="onTileContextMenu(item, i, $event)"
              >
                <!-- folder tile and app tile spans: UNCHANGED from current code -->
              </div>

              <!-- Add shortcut button: UNCHANGED, but add :key and it stays last -->
              <button key="__add__" type="button" ... @click="openAppModal"> ... </button>
            </TransitionGroup>
          </Transition>
```

Keep the existing folder-tile `<span>` and app-tile `<span>` markup inside the `<div>` exactly as they are now. `onTileContextMenu` is implemented in Task 6; add a temporary no-op `function onTileContextMenu() {}` now so the build passes, to be replaced in Task 6.

- [ ] **Step 3: Implement pointer drag handlers (reorder only)**

Add to `<script setup>`:

```js
function tileIdxFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  const tile = el?.closest?.("[data-idx]");
  if (!tile) return -1;
  const n = Number(tile.getAttribute("data-idx"));
  return Number.isNaN(n) ? -1 : n;
}

function onTilePointerDown(i, e) {
  if (e.button !== 0) return;            // left button only
  drag.fromIdx = i;
  drag.item = displayItems.value[i];
  drag.startX = e.clientX;
  drag.startY = e.clientY;
  drag.x = e.clientX;
  drag.y = e.clientY;
  drag.active = false;
  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd, { once: true });
}

function onDragMove(e) {
  drag.x = e.clientX;
  drag.y = e.clientY;
  if (!drag.active) {
    if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < THRESHOLD) return;
    drag.active = true;
    isDragging.value = true;
  }
  const overIdx = tileIdxFromPoint(e.clientX, e.clientY);
  // reorder live within displayItems
  if (overIdx >= 0 && overIdx < displayItems.value.length && overIdx !== drag.fromIdx) {
    const arr = displayItems.value;
    const [it] = arr.splice(drag.fromIdx, 1);
    arr.splice(overIdx, 0, it);
    drag.fromIdx = overIdx;
  }
}

function onDragEnd() {
  window.removeEventListener("pointermove", onDragMove);
  const wasActive = drag.active;
  const finalIdx = drag.fromIdx;
  drag.active = false;
  drag.item = null;
  if (wasActive) {
    isDragging.value = false;
    // commit: displayItems already holds the desired order
    const origin = currentItems.value.findIndex((x) => x === displayItems.value[finalIdx]);
    // Simpler & robust: write the whole reordered order back via reorderItem moves.
    commitDisplayOrder();
  }
}

// Apply displayItems order onto the store by computing the single net move is
// unreliable after multiple swaps, so persist the full order directly.
function commitDisplayOrder() {
  const target = displayItems.value;
  areaStore.areas[currentArea.value].apps = target.slice();
  areaStore.saveToLocalStorage();
}
```

> Note: `commitDisplayOrder` writes the reordered array directly (then persists). This is correct because `displayItems` is a shallow copy of the same item objects. Remove the unused `origin` line if your linter flags it.

- [ ] **Step 4: Add the floating drag clone**

Before the Settings button in the template, add a clone that follows the pointer while dragging:

```html
      <!-- Drag clone -->
      <div
        v-if="drag.active && drag.item && !isFolder(drag.item)"
        class="pointer-events-none fixed z-50 flex h-[68px] w-[68px] items-center
               justify-center rounded-[20px] bg-white shadow-2xl ring-1 ring-black/10"
        :style="{ left: drag.x + 'px', top: drag.y + 'px', transform: 'translate(-50%,-50%) scale(1.1)' }"
      >
        <img :src="drag.item.icon" class="h-11 w-11 object-contain" />
      </div>
```

- [ ] **Step 5: Add the FLIP transition CSS**

In `src/assets/css/main.css`, add:

```css
.tile-move { transition: transform 220ms ease; }
```

- [ ] **Step 6: Clean up listeners on unmount**

In the existing `onBeforeUnmount`, add:

```js
  window.removeEventListener("pointermove", onDragMove);
```

- [ ] **Step 7: Verify (manual)**

`pnpm build`, reload, fresh new tab. Press-drag a tile: others shift smoothly; drop reorders; order persists after reload. A press without moving still opens the URL. Search and page-switch still work.

- [ ] **Step 8: Checkpoint** — `pnpm build` clean, `pnpm test` green. Leave for the user to commit.

---

## Task 5: Dwell-to-folder during drag

**Files:**
- Modify: `src/views/home/HomeView.vue`

**Interfaces:**
- Consumes: `drag`, `displayItems`, `areaStore.dropOnItem`, `isFolder`.
- Produces: `drag.folderTarget` (index or -1) and folder commit on drop.

- [ ] **Step 1: Add dwell state**

Add to the `drag` reactive object: `folderTarget: -1`. Add module-level `let dwellTimer = null; let dwellIdx = -1;`.

- [ ] **Step 2: Detect dwell in `onDragMove`**

Replace the reorder section of `onDragMove` with logic that distinguishes "hovering a tile center → folder" from "moved → reorder":

```js
  const overIdx = tileIdxFromPoint(e.clientX, e.clientY);
  const over = displayItems.value[overIdx];
  const draggedIsFolder = isFolder(drag.item);

  // candidate folder target: hovering a DIFFERENT tile, dragged item is an app,
  // and (later) staying still long enough
  if (
    !draggedIsFolder && overIdx >= 0 && overIdx !== drag.fromIdx && over &&
    !(isFolder(over) && over.apps && over.apps.length >= 0 && false)
  ) {
    if (dwellIdx !== overIdx) {
      dwellIdx = overIdx;
      clearTimeout(dwellTimer);
      drag.folderTarget = -1;
      dwellTimer = setTimeout(() => { drag.folderTarget = overIdx; }, 450);
    }
  } else {
    dwellIdx = -1;
    clearTimeout(dwellTimer);
    drag.folderTarget = -1;
  }

  // only reorder when NOT aiming at a folder target
  if (drag.folderTarget === -1 &&
      overIdx >= 0 && overIdx < displayItems.value.length && overIdx !== drag.fromIdx) {
    const arr = displayItems.value;
    const [it] = arr.splice(drag.fromIdx, 1);
    arr.splice(overIdx, 0, it);
    drag.fromIdx = overIdx;
    dwellIdx = -1;
    clearTimeout(dwellTimer);
  }
```

- [ ] **Step 3: Highlight the folder target**

In the tile `:class`, add:

```js
                  'scale-110 ring-2 ring-white/70 bg-white/15': drag.active && drag.folderTarget === i,
```

- [ ] **Step 4: Commit folder on drop**

In `onDragEnd`, before `commitDisplayOrder()`, branch on `folderTarget`:

```js
  if (wasActive) {
    isDragging.value = false;
    clearTimeout(dwellTimer);
    if (drag.folderTarget >= 0 && drag.folderTarget !== finalIdx) {
      // map display indices to store indices, then create/extend a folder
      const draggedItem = displayItems.value[finalIdx];
      const targetItem = displayItems.value[drag.folderTarget];
      const fromStore = currentItems.value.indexOf(draggedItem);
      const toStore = currentItems.value.indexOf(targetItem);
      drag.folderTarget = -1;
      areaStore.dropOnItem(currentArea.value, fromStore, toStore);
    } else {
      drag.folderTarget = -1;
      commitDisplayOrder();
    }
  }
```

- [ ] **Step 5: Verify (manual)**

`pnpm build`, reload. Drag an app and pause on another app ~0.5s → it enlarges → release → folder created. Drag onto an existing folder → added. Quick passes do NOT create folders. Reorder still works when not dwelling.

- [ ] **Step 6: Checkpoint** — build clean. Leave for the user to commit.

---

## Task 6: Context menu + edit/rename/delete + move-to-page

**Files:**
- Create: `src/components/ContextMenu.vue`
- Modify: `src/components/Icon.vue`, `src/views/home/HomeView.vue`, `src/plugins/i18n/locales/en.js`, `tr.js`

**Interfaces:**
- Consumes: `areaStore.updateItem`, `removeItem`, `moveItemToArea`, `renameFolder`, `removeFromFolder` (existing), `currentArea`, `areas`.
- Produces: `ContextMenu.vue` with props `{ x, y, items }` and `@select`; `onTileContextMenu(item, i, e)`, edit-modal state in HomeView.

- [ ] **Step 1: Add icons**

In `src/components/Icon.vue`, add cases to the icon set (match the existing inline-SVG pattern) for `trash`, `pencil`, `external`, `move`. Example paths:

```js
  trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-7 0v12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  pencil: '<path d="M4 20h4L18 10l-4-4L4 16v4zM14 6l4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  external: '<path d="M14 5h5v5M19 5l-8 8M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  move: '<path d="M12 3v18M3 12h18M8 7l4-4 4 4M8 17l4 4 4-4M7 8l-4 4 4 4M17 8l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
```

(If `Icon.vue` uses a different structure, follow its existing convention; the names above are what HomeView references.)

- [ ] **Step 2: Create `ContextMenu.vue`**

```vue
<template>
  <Teleport to="body">
    <Transition name="pop">
      <div v-if="open" class="fixed inset-0 z-[60]" @click="$emit('close')" @contextmenu.prevent="$emit('close')">
        <ul
          class="glass-strong absolute min-w-44 rounded-xl p-1.5 text-sm text-white shadow-2xl"
          :style="{ left: px(x), top: px(y) }"
          @click.stop
        >
          <li v-for="(it, k) in items" :key="k">
            <button
              type="button"
              class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left
                     transition hover:bg-white/15"
              :class="it.danger ? 'text-red-300 hover:bg-red-500/15' : ''"
              @click="pick(it)"
            >
              <Icon v-if="it.icon" :name="it.icon" :size="15" class="shrink-0 opacity-80" />
              <span class="flex-1 truncate">{{ it.label }}</span>
            </button>
          </li>
        </ul>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import Icon from "./Icon.vue";
const props = defineProps({
  open: Boolean, x: Number, y: Number,
  items: { type: Array, default: () => [] },
});
const emit = defineEmits(["select", "close"]);
function px(n) {
  // keep menu on-screen
  return Math.min(n ?? 0, window.innerWidth - 200) + "px";
}
function pick(it) {
  emit("select", it.action);
  emit("close");
}
</script>
```

- [ ] **Step 3: Add i18n keys**

In `en.js` `home`: add `openNewTab: "Open in new tab"`, `moveTo: "Move to page"`, `editShortcut: "Edit shortcut"`, `rename: "Rename"`. In `actions`: ensure `delete` exists (it does). Mirror in `tr.js`: `openNewTab: "Yeni sekmede aç"`, `moveTo: "Şu sayfaya taşı"`, `editShortcut: "Kısayolu düzenle"`, `rename: "Adı değiştir"`.

- [ ] **Step 4: Wire the menu + edit modal in HomeView**

Import and add state:

```js
import ContextMenu from "@/components/ContextMenu.vue";

const ctx = reactive({ open: false, x: 0, y: 0, idx: -1, items: [] });
const showEditModal = ref(false);
const editApp = reactive({ idx: -1, title: "", url: "" });

function onTileContextMenu(item, i, e) {
  ctx.x = e.clientX; ctx.y = e.clientY; ctx.idx = i;
  const moveTargets = areas.value
    .map((a, ai) => ({ a, ai }))
    .filter(({ ai }) => ai !== currentArea.value)
    .map(({ a, ai }) => ({ label: `${t("home.moveTo")}: ${a.label}`, icon: "move", action: { type: "move", to: ai } }));
  if (isFolder(item)) {
    ctx.items = [
      { label: t("home.rename"), icon: "pencil", action: { type: "renameFolder" } },
      ...moveTargets,
      { label: t("actions.delete"), icon: "trash", danger: true, action: { type: "delete" } },
    ];
  } else {
    ctx.items = [
      { label: t("home.openNewTab"), icon: "external", action: { type: "newtab" } },
      { label: t("home.editShortcut"), icon: "pencil", action: { type: "edit" } },
      ...moveTargets,
      { label: t("actions.delete"), icon: "trash", danger: true, action: { type: "delete" } },
    ];
  }
  ctx.open = true;
}

function onCtxSelect(action) {
  const i = ctx.idx;
  const item = currentItems.value[i];
  if (!item) return;
  if (action.type === "newtab") openUrl(item.url, true);
  else if (action.type === "delete") areaStore.removeItem(currentArea.value, i);
  else if (action.type === "move") areaStore.moveItemToArea(currentArea.value, i, action.to);
  else if (action.type === "renameFolder") openFolder(i); // rename via the folder overlay's name field
  else if (action.type === "edit") {
    editApp.idx = i; editApp.title = item.name; editApp.url = item.url;
    showEditModal.value = true;
  }
}

function saveEdit() {
  if (!editApp.title.trim() || !editApp.url.trim()) return;
  areaStore.updateItem(currentArea.value, editApp.idx, {
    name: editApp.title.trim(), url: editApp.url.trim(),
  });
  showEditModal.value = false;
}
```

Add to the template (near the other modals):

```html
      <ContextMenu
        :open="ctx.open" :x="ctx.x" :y="ctx.y" :items="ctx.items"
        @select="onCtxSelect" @close="ctx.open = false"
      />

      <GlassModal v-model="showEditModal" :title="t('home.editShortcut')">
        <div>
          <label class="mb-1.5 block text-xs text-white/60">{{ t("home.appTitle") }}</label>
          <input v-model="editApp.title" class="field" type="text" />
        </div>
        <div>
          <label class="mb-1.5 block text-xs text-white/60">{{ t("home.appUrl") }}</label>
          <input v-model="editApp.url" class="field" type="url" />
        </div>
        <template #actions>
          <button class="btn-ghost" @click="showEditModal = false">{{ t("actions.cancel") }}</button>
          <button class="btn-solid" @click="saveEdit">{{ t("actions.save") }}</button>
        </template>
      </GlassModal>
```

Replace the temporary `onTileContextMenu` no-op from Task 4 with the real one above.

- [ ] **Step 5: Add a hover quick-delete ✕**

Inside the tile `<div>` (make it `relative`), add at the end of the tile content:

```html
                <button
                  type="button"
                  class="absolute -right-0 -top-0 hidden h-5 w-5 place-items-center rounded-full
                         bg-black/70 text-white group-hover:grid hover:bg-black"
                  :aria-label="t('actions.delete')"
                  @click.stop="areaStore.removeItem(currentArea, i)"
                  @pointerdown.stop
                >
                  <Icon name="close" :size="11" />
                </button>
```

(`@pointerdown.stop` prevents starting a drag when clicking ✕.)

- [ ] **Step 6: Verify (manual)**

`pnpm build`, reload. Right-click an app → menu with Open-in-new-tab / Edit / Move to page X / Delete. Edit changes title+URL (favicon updates on host change). Delete removes it. Move sends it to another page. Hover ✕ deletes. Right-click a folder → Rename (opens overlay) / Move / Delete.

- [ ] **Step 7: Checkpoint** — build clean, tests green. Leave for the user to commit.

---

## Task 7: Move item to another page by dropping on a page-dot; reorder pages

**Files:**
- Modify: `src/views/home/HomeView.vue`

**Interfaces:**
- Consumes: `drag`, `areaStore.moveItemToArea`, `areaStore.reorderArea`, `currentArea`.
- Produces: page-dot `data-area` targets honored on item drop; page-dot pointer-drag to reorder areas.

- [ ] **Step 1: Tag page dots and detect them during item drag**

On each page-dot button add `:data-area="i"`. In `onDragEnd`, before the folder/reorder branch, check whether the drop landed on a dot:

```js
  if (wasActive) {
    isDragging.value = false;
    clearTimeout(dwellTimer);
    const dotEl = document.elementFromPoint(drag.x, drag.y)?.closest?.("[data-area]");
    const dotArea = dotEl ? Number(dotEl.getAttribute("data-area")) : -1;
    if (dotArea >= 0 && dotArea !== currentArea.value) {
      const draggedItem = displayItems.value[finalIdx];
      const fromStore = currentItems.value.indexOf(draggedItem);
      drag.folderTarget = -1;
      areaStore.moveItemToArea(currentArea.value, fromStore, dotArea);
    } else if (drag.folderTarget >= 0 && drag.folderTarget !== finalIdx) {
      /* ...folder branch from Task 5... */
    } else {
      drag.folderTarget = -1;
      commitDisplayOrder();
    }
  }
```

Highlight a dot while hovered during an item drag: add to the dot `:class` `{ 'ring-2 ring-white/70 scale-125': drag.active }` is too broad — instead set a `drag.overDot` in `onDragMove` (`const d = document.elementFromPoint(...).closest('[data-area]'); drag.overDot = d ? Number(d.getAttribute('data-area')) : -1;`) and class the dot when `drag.overDot === i`. Add `overDot: -1` to the `drag` object.

- [ ] **Step 2: Page-dot drag to reorder areas**

Add a separate lightweight pointer-drag for the dots row. On a dot, `@pointerdown.stop="onDotPointerDown(i, $event)"`:

```js
const dotDrag = reactive({ active: false, fromIdx: -1, x: 0 });
function onDotPointerDown(i, e) {
  if (e.button !== 0) return;
  dotDrag.fromIdx = i; dotDrag.active = false; dotDrag.x = e.clientX;
  const start = e.clientX;
  function move(ev) {
    if (!dotDrag.active && Math.abs(ev.clientX - start) < THRESHOLD) return;
    dotDrag.active = true;
    const overEl = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.("[data-area]");
    const over = overEl ? Number(overEl.getAttribute("data-area")) : -1;
    if (over >= 0 && over !== dotDrag.fromIdx) {
      areaStore.reorderArea(dotDrag.fromIdx, over);
      if (currentArea.value === dotDrag.fromIdx) currentArea.value = over;
      dotDrag.fromIdx = over;
    }
  }
  function up() {
    window.removeEventListener("pointermove", move);
    dotDrag.active = false;
  }
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up, { once: true });
}
```

Guard the existing dot `@click="goTo(i)"` so a drag doesn't also navigate: change to `@click="!dotDrag.active && goTo(i)"`.

- [ ] **Step 3: Verify (manual)**

`pnpm build`, reload. Drag an app onto another page's dot → it moves there (dot highlights on hover). Drag the dots themselves → pages reorder; the viewed page follows.

- [ ] **Step 4: Checkpoint** — build clean. Leave for the user to commit.

---

## Task 8: Reorder items inside a folder

**Files:**
- Modify: `src/views/home/HomeView.vue`

**Interfaces:**
- Consumes: `openFolderObj`, `folderOpenIndex`, `currentArea`, `areaStore.reorderInFolder`.
- Produces: pointer-drag reorder within the folder overlay grid.

- [ ] **Step 1: Add folder-internal drag state + handlers**

```js
const fdrag = reactive({ active: false, fromIdx: -1, x: 0, y: 0 });
function onFolderPointerDown(k, e) {
  if (e.button !== 0) return;
  fdrag.fromIdx = k; fdrag.active = false;
  const sx = e.clientX, sy = e.clientY;
  function move(ev) {
    if (!fdrag.active && Math.hypot(ev.clientX - sx, ev.clientY - sy) < THRESHOLD) return;
    fdrag.active = true; fdrag.x = ev.clientX; fdrag.y = ev.clientY;
    const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.("[data-fidx]");
    const over = el ? Number(el.getAttribute("data-fidx")) : -1;
    if (over >= 0 && over !== fdrag.fromIdx && folderOpenIndex.value !== null) {
      areaStore.reorderInFolder(currentArea.value, folderOpenIndex.value, fdrag.fromIdx, over);
      fdrag.fromIdx = over;
    }
  }
  function up() { window.removeEventListener("pointermove", move); fdrag.active = false; }
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up, { once: true });
}
```

- [ ] **Step 2: Wire the folder overlay items**

On each folder item wrapper in the overlay, add `:data-fidx="k"` and `@pointerdown="onFolderPointerDown(k, $event)"`, and guard the open button so a drag doesn't open: `@click="!fdrag.active && openUrl(app.url, $event.metaKey || $event.ctrlKey)"`.

- [ ] **Step 3: Verify (manual)**

`pnpm build`, reload. Open a folder, drag items to reorder; order persists.

- [ ] **Step 4: Checkpoint** — build clean, all tests green, `remove-preload` clean. Leave for the user to commit.

---

## Self-Review

- **Spec coverage:** #1 reorder → Task 4; #2 delete → Tasks 6 (menu + ✕) & store Task 1; #3 edit → Task 6 + store Task 2; #4 move to page → Task 6 (menu) & Task 7 (drop on dot); #5 folder move/reorder → folders draggable in Task 4/5 + move in Task 6/7; #6 folder-internal reorder → Task 8; #7 reorder pages → Task 7; #8 open in new tab → Task 3. All covered.
- **Placeholder scan:** Task 4 intentionally adds a temporary `onTileContextMenu` no-op, explicitly replaced in Task 6 — not a placeholder, a sequencing note. No TBD/TODO remain.
- **Type consistency:** store signatures (`reorderItem`, `removeItem`, `updateItem`, `moveItemToArea`, `reorderArea`, `reorderInFolder`) are used with identical names/args across Tasks 4–8. `openUrl(url, newTab)` consistent. `drag` fields (`active`, `fromIdx`, `item`, `x`, `y`, `folderTarget`, `overDot`) introduced before use.
- **Note on `commitDisplayOrder`:** writes the reordered array directly; this is the simplest correct commit since `displayItems` holds the same object references. The `reorderItem` action still exists for programmatic single moves and is unit-tested.
