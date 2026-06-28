# Hexpane — Shortcut Operations & Pointer Drag Engine

**Date:** 2026-06-27
**Status:** Approved design, pending implementation plan

## Problem

The new-tab grid is missing core shortcut operations. Today you can only *add* a
shortcut, *open* it, and drag one app onto another to make a folder. You cannot:

1. Reorder shortcuts within a page
2. Delete a top-level shortcut
3. Edit a shortcut (rename / change URL)
4. Move a shortcut to another page (area)
5. Move or reorder folders (folders aren't draggable today)
6. Reorder items inside a folder
7. Reorder pages (areas)
8. Open a shortcut in a new tab

This spec covers all eight.

## Approach

Replace native HTML5 drag-and-drop **for internal item manipulation** with a
**custom pointer-based drag engine**. Native DnD stays ONLY for the existing
external URL drop (dragging a bookmark/link onto the page → add shortcut); the two
never overlap because internal drag uses `pointerdown`/`pointermove` while external
drop uses `dragover`/`drop` with a `DataTransfer`.

Rationale: native DnD cannot do smooth live reordering, dwell-to-folder, or
cross-page dragging cleanly. A pointer engine gives full control and matches the
"Launchpad / iOS" feel the product targets.

## Interaction model

- **Start:** `pointerdown` on a tile records the origin. The drag begins only after
  the pointer moves past a ~6px threshold, so a press-without-move is still a click.
- **Click (no drag):** open the URL. Plain click → current tab (unchanged).
  Ctrl/⌘-click or middle-click → `window.open(url, "_blank")` (new tab).
- **Live reorder:** while dragging, a floating clone follows the cursor and the
  original tile is dimmed. The target index is computed from cursor position over
  the grid; the dragged item is spliced to that index and the other tiles animate
  to their new positions (FLIP / CSS transition).
- **Dwell-to-folder:** if the cursor rests over another *tile* (not a gap) for
  ~450ms with little movement, that tile is marked as the folder target (scales up,
  highlighted). Releasing while a folder target is active creates a folder
  (app→app) or adds to it (app→folder). Folders cannot nest inside folders.
- **Move between pages:** dragging a tile over a footer page-dot (after a short
  dwell) switches the active page to that area and drops will land there; dragging
  to the far left/right screen edge auto-advances the page (clamped, no wrap).
- **Reorder pages:** the footer page-dots are themselves draggable to reorder areas.
- **Inside a folder:** the folder overlay grid supports the same drag-to-reorder.

## Context menu (`ContextMenu.vue`, new)

Right-click a tile opens a small teleported menu positioned at the cursor:

- **App:** Rename · Edit URL · Open in new tab · Move to page ▸ (submenu of areas) · Delete
- **Folder:** Rename · Move to page ▸ · Delete (dissolves; inner apps move out to the page)

A subtle hover **✕** on each tile offers quick delete as well. Editing reuses the
existing add-shortcut modal pattern (title + URL prefilled). If the URL changes, the
favicon is re-derived from the new hostname.

## Store actions (`area-store.js`)

New actions (all call `saveToLocalStorage()`):

- `reorderItem(areaIndex, fromIdx, toIdx)` — move an item within an area's `apps`.
- `removeItem(areaIndex, idx)` — delete a top-level app or folder.
- `updateItem(areaIndex, idx, { name, url })` — edit an app; if `url`'s hostname
  changed, recompute `icon` from the favicon URL (same direct-URL approach as
  `addAppToArea`). No-op for folders except name (use `renameFolder`).
- `moveItemToArea(fromArea, fromIdx, toArea)` — append an item to another area and
  remove it from the source.
- `reorderArea(fromIdx, toIdx)` — reorder the `areas` list. The view's active page
  index is adjusted so the currently-viewed area stays the one on screen after the
  reorder (recompute `currentArea` from the moved indices).
- `reorderInFolder(areaIndex, folderIdx, fromIdx, toIdx)` — reorder a folder's apps.

Existing `dropOnItem`, `removeFromFolder`, `renameFolder`, `addAppToArea`,
`addArea`, `updateArea`, `deleteArea` remain. Folder-creation on drop may route
through `dropOnItem` or a unified commit in the drag engine — implementation detail.

## Data model

Unchanged. `areas[]` each `{ label, background?, apps[] }`; an item in `apps` is
either an app `{ name, url, icon }` or a folder `{ type: "folder", name, apps[] }`.
Persistence stays in `localStorage` (`areas`, `faviconCache`).

## Components touched

- `HomeView.vue` — remove the native `draggable`/`dragstart`/`dragover`/`drop`
  handlers used for folder creation; add the pointer-drag engine (a composable
  `useGridDrag` or inline), context-menu wiring, edit modal, new-tab open.
- `area-store.js` — the new actions above.
- `ContextMenu.vue` — new teleported menu component.
- `src/plugins/i18n/locales/{en,tr}.js` — new keys: `rename`, `editUrl`, `delete`
  (have it), `openNewTab`, `moveToPage`, edit-modal title, etc.

The external URL-drop window listeners (`onPageDragOver/Leave/Drop`) and the
`bookmarkTitle` lookup stay as-is.

## Edge cases & error handling

- Drag threshold prevents click/drag ambiguity; a drag that ends where it started
  with no reorder is treated as a click.
- Dwell timer is cancelled on movement so passing over a tile doesn't make a folder.
- Folders never nest: dwell-to-folder is ignored when the dragged item is a folder.
- `removeItem` on the last item of an area is allowed (empty area still shows the
  Add tile); `deleteArea` still keeps ≥1 area.
- Moving the only item out of a folder dissolves it (existing `removeFromFolder`
  rule) — keep consistent when moving items between pages out of a folder.
- Pointer capture (`setPointerCapture`) so the drag survives the cursor leaving a
  tile; clean up listeners on `pointerup`/`pointercancel` and component unmount.
- Touch: pointer events cover touch; ensure `touch-action` is set so the page
  doesn't scroll mid-drag.

## Testing / verification

- Build passes (`pnpm build`), no preload warnings.
- Manual in the loaded extension: reorder within a page; create + dissolve a folder
  via dwell; move an item to another page via page-dot; reorder pages; reorder
  inside a folder; right-click → rename / edit URL / delete; hover ✕ delete;
  Ctrl/⌘-click opens a new tab; external bookmark drop still adds a shortcut with
  the correct favicon and title.
- Synthetic checks where feasible (store actions are pure and unit-testable via the
  page context, like the earlier drop verification).

## Out of scope

- Importing a whole bookmark *folder* (separate feature; would use the new
  `bookmarks` permission, not drag).
- Syncing across devices; multi-select drag; undo/redo.
