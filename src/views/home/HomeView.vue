<template>
  <BaseLayout>
    <div ref="rootEl" class="relative h-screen w-screen overflow-hidden text-white">
      <!-- Gradient background (chosen in Settings) — softly blurred -->
      <div class="absolute inset-0 scale-110 blur-2xl" :style="{ background: bgCss }" />
      <div class="noise pointer-events-none absolute inset-0" />
      <div
        class="pointer-events-none absolute inset-0
               bg-gradient-to-b from-transparent via-transparent to-black/30"
      />

      <!-- Content -->
      <div class="relative z-10 flex h-full flex-col">
        <!-- Search -->
        <div class="flex justify-center px-6 pt-16 pb-10">
          <label
            class="group relative flex w-72 items-center gap-2.5 rounded-2xl
                   bg-white/10 px-4 py-2.5 shadow-lg shadow-black/20 ring-1 ring-white/15
                   backdrop-blur-2xl transition-all duration-300 ease-out
                   focus-within:w-96 focus-within:bg-white/15 focus-within:ring-white/30
                   focus-within:shadow-xl focus-within:shadow-black/30"
          >
            <Icon
              name="search"
              :size="17"
              class="shrink-0 text-white/55 transition-colors group-focus-within:text-white/85"
            />
            <input
              v-model="query"
              type="text"
              :placeholder="t('home.search')"
              class="w-full bg-transparent text-sm text-white outline-none
                     placeholder:text-white/45"
            />
          </label>
        </div>

        <!-- Grid — vertically centered. The grid reserves a fixed 4-row height
             (min-h) with its rows packed to the top, so a 3-row and a 4-row area
             stay centered AND start at exactly the same height. -->
        <main class="flex flex-1 items-center justify-center overflow-y-auto px-8">
          <!-- Search results: flat apps, no folders / no drag -->
          <div
            v-if="query"
            class="mx-auto grid w-full max-w-5xl grid-cols-4 justify-items-center
                   gap-x-2 gap-y-7 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7"
          >
            <AppCard
              v-for="app in displayApps"
              :key="app.url"
              :name="app.name"
              :url="app.url"
              :icon="app.icon"
            />
            <p v-if="!displayApps.length" class="ink col-span-full py-10 text-sm text-white/70">
              {{ t("home.noResults") }}
            </p>
          </div>

          <!-- Page view: apps + folders. Plain keyed <div> (instant, correct
               removal). Reorder is animated with a manual FLIP (Web Animations API)
               in the drag handlers; the page-change animation is the keyframe in
               pageAnimClass (chosen in Settings) that replays on :key change. -->
          <div
            v-else
            ref="gridEl"
            :key="currentArea"
            :class="pageAnimClass"
            class="mx-auto grid min-h-[512px] w-full max-w-5xl grid-cols-4 content-start
                   justify-items-center gap-x-2 gap-y-7 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7"
          >
              <div
                v-for="(item, i) in displayItems"
                :key="itemKey(item, i)"
                :data-idx="i"
                :data-key="itemKey(item, i)"
                class="group relative flex w-[104px] cursor-pointer flex-col items-center gap-2
                       rounded-2xl px-1 py-2 transition-colors select-none touch-none hover:bg-white/10"
                :class="{ 'opacity-0': drag.active && item === drag.item }"
                @pointerdown="onTilePointerDown(i, $event)"
                @click="onItemClick(item, i, $event)"
                @auxclick.prevent="$event.button === 1 && onItemClick(item, i, $event)"
                @contextmenu.prevent="onTileContextMenu(item, i, $event)"
              >
                <!-- Folder tile: 2x2 mini previews -->
                <span
                  v-if="isFolder(item)"
                  class="grid h-[68px] w-[68px] grid-cols-2 grid-rows-2 gap-1 rounded-[20px]
                         bg-white/15 p-2 shadow-lg ring-1 ring-white/15 backdrop-blur
                         transition duration-150 group-hover:scale-110"
                  :class="drag.active && drag.overFolder === i
                    ? 'scale-110 ring-4 ring-white/80' : ''"
                >
                  <img
                    v-for="(a, k) in item.apps.slice(0, 4)"
                    :key="k"
                    :src="a.icon"
                    class="h-full w-full rounded-md bg-white object-contain p-0.5"
                    draggable="false"
                  />
                </span>
                <!-- App tile -->
                <span
                  v-else
                  class="flex h-[68px] w-[68px] items-center justify-center overflow-hidden
                         rounded-[20px] bg-white shadow-lg ring-1 ring-black/5
                         transition duration-150 group-hover:scale-110 group-active:scale-95"
                  :class="drag.active && drag.overFolder === i
                    ? 'scale-110 ring-4 ring-white/80' : ''"
                >
                  <img
                    :src="item.icon"
                    :alt="item.name"
                    class="h-11 w-11 object-contain"
                    loading="lazy"
                    draggable="false"
                  />
                </span>
                <span class="ink w-full truncate text-center text-xs font-medium leading-tight">
                  {{ item.name }}
                </span>
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
              </div>

              <!-- Add shortcut (hidden once the area is full — max 4 rows) -->
              <button
                v-if="!currentAreaFull"
                key="__add__"
                type="button"
                class="group flex w-[104px] flex-col items-center gap-2 rounded-2xl px-1 py-2
                       transition hover:bg-white/10"
                @click="openAppModal"
              >
                <span
                  class="grid h-[68px] w-[68px] place-items-center rounded-[20px]
                         border border-dashed border-white/40 text-white/70
                         transition group-hover:scale-110 group-hover:text-white"
                >
                  <Icon name="plus" :size="26" />
                </span>
                <span class="ink text-xs font-medium">{{ t("actions.add") }}</span>
              </button>
          </div>
        </main>

        <!-- Footer: area name (editable) + page dots -->
        <footer class="flex flex-col items-center gap-3 px-6 pb-9 pt-4">
          <button
            v-if="!query"
            type="button"
            class="ink flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5
                   text-xs font-semibold tracking-tight shadow-lg shadow-black/25
                   ring-1 ring-white/20 ring-inset backdrop-blur-2xl transition
                   hover:-translate-y-0.5 hover:bg-white/20 hover:ring-white/35"
            :title="t('home.editArea')"
            @click="openEditArea"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-white/70"></span>
            {{ currentAreaLabel }}
          </button>
          <div v-if="!query" class="flex items-center gap-2.5">
            <button
              v-for="(area, i) in areas"
              :key="i"
              type="button"
              :data-area="i"
              class="h-2 w-2 rounded-full transition"
              :class="[
                currentArea === i ? 'bg-white' : 'bg-white/35 hover:bg-white/65',
                drag.active && drag.overDot === i ? 'ring-2 ring-white/70 scale-125' : '',
              ]"
              :title="area.label"
              :aria-label="area.label"
              @click="!dotDrag.active && goTo(i)"
              @pointerdown.stop="onDotPointerDown(i, $event)"
            />
            <button
              type="button"
              class="ml-1 grid h-5 w-5 place-items-center rounded-full text-white/55
                     transition hover:bg-white/15 hover:text-white"
              :aria-label="t('actions.addArea')"
              @click="openAreaModal"
            >
              <Icon name="plus" :size="13" />
            </button>
          </div>
        </footer>
      </div>

      <!-- Drop a link / bookmark onto the page to add a shortcut -->
      <Transition name="bg-fade">
        <div
          v-if="urlDropActive"
          class="pointer-events-none absolute inset-0 z-40 flex items-center justify-center
                 bg-black/45 p-6 backdrop-blur-sm"
        >
          <div
            class="glass-strong flex flex-col items-center gap-3 rounded-3xl border-2
                   border-dashed border-white/40 px-12 py-9 text-center text-white"
          >
            <span class="grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
              <Icon name="plus" :size="28" />
            </span>
            <p class="text-sm font-medium">{{ t("home.dropToAdd") }}</p>
            <p class="text-xs text-white/60">{{ currentAreaLabel }}</p>
          </div>
        </div>
      </Transition>

      <!-- Drag clone — follows the cursor while dragging -->
      <div
        v-if="drag.active && drag.item"
        class="pointer-events-none fixed z-50 h-[68px] w-[68px]"
        :style="{ left: drag.x + 'px', top: drag.y + 'px', transform: 'translate(-50%,-50%) scale(1.1)' }"
      >
        <span
          v-if="isFolder(drag.item)"
          class="grid h-full w-full grid-cols-2 grid-rows-2 gap-1 rounded-[20px]
                 bg-white/15 p-2 shadow-2xl ring-1 ring-white/20 backdrop-blur-xl"
        >
          <img
            v-for="(a, k) in drag.item.apps.slice(0, 4)"
            :key="k"
            :src="a.icon"
            class="h-full w-full rounded-md bg-white object-contain p-0.5"
          />
        </span>
        <span
          v-else
          class="flex h-full w-full items-center justify-center rounded-[20px]
                 bg-white shadow-2xl ring-1 ring-black/10"
        >
          <img :src="drag.item.icon" class="h-11 w-11 object-contain" />
        </span>
      </div>

      <!-- Folder drag clone — visible while extracting an app from a folder -->
      <div
        v-if="fdrag.active && fdrag.item"
        class="pointer-events-none fixed z-[70] flex h-14 w-14 items-center justify-center
               rounded-[16px] bg-white shadow-2xl ring-1 ring-black/10 transition-transform"
        :class="fdrag.out ? 'scale-110' : ''"
        :style="{ left: fdrag.x + 'px', top: fdrag.y + 'px', transform: 'translate(-50%,-50%)' }"
      >
        <img :src="fdrag.item.icon" class="h-9 w-9 object-contain" />
      </div>

      <!-- Settings -->
      <button
        type="button"
        class="glass absolute bottom-6 right-6 z-20 grid h-10 w-10 place-items-center
               rounded-full text-white/85 transition hover:-translate-y-0.5
               hover:bg-white/20 hover:text-white"
        :aria-label="t('home.settings')"
        @click="showSettings = true"
      >
        <Icon name="gear" :size="19" />
      </button>

      <SettingsModal v-model="showSettings" />

      <ContextMenu
        :open="ctx.open" :x="ctx.x" :y="ctx.y" :items="ctx.items"
        @select="onCtxSelect" @close="ctx.open = false"
      />

      <!-- Folder overlay -->
      <Teleport to="body">
        <Transition name="pop">
          <div
            v-if="openFolderObj"
            class="fixed inset-0 z-50 flex items-center justify-center p-6
                   bg-black/45 backdrop-blur-sm"
            @click.self="onFolderBackdropClick"
          >
            <div
              ref="folderPanelEl"
              class="glass-strong w-full max-w-xl rounded-3xl p-6 text-white transition"
              :class="fdrag.out ? 'scale-95 opacity-80 ring-2 ring-white/30' : ''"
            >
              <div class="mb-5 flex items-center justify-between gap-3">
                <input
                  :value="openFolderObj.name"
                  class="min-w-0 flex-1 border-b border-transparent bg-transparent text-lg
                         font-semibold outline-none transition focus:border-white/30"
                  @input="onRenameFolder"
                />
                <button
                  type="button"
                  class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/70
                         transition hover:bg-white/10 hover:text-white"
                  @click="closeFolder"
                >
                  <Icon name="close" :size="18" />
                </button>
              </div>
              <div class="grid grid-cols-4 gap-3 sm:grid-cols-5">
                <div
                  v-for="(app, k) in openFolderObj.apps"
                  :key="itemKey(app)"
                  :data-fidx="k"
                  class="group/app relative flex flex-col items-center gap-1.5 select-none touch-none"
                  :class="fdrag.active && fdrag.fromIdx === k ? 'opacity-30' : ''"
                  @pointerdown="onFolderPointerDown(k, $event)"
                >
                  <button
                    type="button"
                    class="flex h-14 w-14 items-center justify-center overflow-hidden
                           rounded-[16px] bg-white shadow ring-1 ring-black/5
                           transition hover:scale-105"
                    @click="!fdrag.active && openUrl(app.url, $event.metaKey || $event.ctrlKey)"
                    @auxclick="$event.button === 1 && openUrl(app.url, true)"
                  >
                    <img :src="app.icon" :alt="app.name" class="h-9 w-9 object-contain" />
                  </button>
                  <span class="w-full truncate text-center text-[11px] text-white/85">
                    {{ app.name }}
                  </span>
                  <button
                    type="button"
                    class="absolute -right-1 -top-1 hidden h-5 w-5 place-items-center
                           rounded-full bg-black/70 text-white group-hover/app:grid
                           hover:bg-black"
                    :aria-label="t('home.removeFromFolder')"
                    @click="removeFromFolderInner(k)"
                    @pointerdown.stop
                  >
                    <Icon name="close" :size="11" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Add area modal -->
      <GlassModal v-model="showAreaModal" :title="t('home.newArea')">
        <div>
          <label class="mb-1.5 block text-xs text-white/60">{{ t("home.areaLabel") }}</label>
          <input v-model="newArea.label" class="field" type="text" />
        </div>
        <p v-if="areaError" class="text-xs text-red-300">{{ areaError }}</p>
        <template #actions>
          <button class="btn-ghost" @click="showAreaModal = false">{{ t("actions.cancel") }}</button>
          <button class="btn-solid" @click="saveArea">{{ t("actions.save") }}</button>
        </template>
      </GlassModal>

      <!-- Edit area modal -->
      <GlassModal v-model="showEditAreaModal" :title="t('home.editArea')">
        <div>
          <label class="mb-1.5 block text-xs text-white/60">{{ t("home.areaLabel") }}</label>
          <input v-model="editArea.label" class="field" type="text" />
        </div>
        <p v-if="editAreaError" class="text-xs text-red-300">{{ editAreaError }}</p>
        <template #actions>
          <button
            v-if="areas.length > 1"
            class="mr-auto rounded-xl px-4 py-2 text-sm font-medium text-red-300
                   transition hover:bg-red-500/15"
            @click="deleteCurrentArea"
          >
            {{ t("actions.delete") }}
          </button>
          <button class="btn-ghost" @click="showEditAreaModal = false">{{ t("actions.cancel") }}</button>
          <button class="btn-solid" @click="saveEditArea">{{ t("actions.save") }}</button>
        </template>
      </GlassModal>

      <!-- Add shortcut modal -->
      <GlassModal v-model="showAppModal" :title="t('home.newApp')">
        <div>
          <label class="mb-1.5 block text-xs text-white/60">{{ t("home.appTitle") }}</label>
          <input v-model="newApp.title" class="field" type="text" />
        </div>
        <div>
          <label class="mb-1.5 block text-xs text-white/60">{{ t("home.appUrl") }}</label>
          <input v-model="newApp.url" class="field" type="url" placeholder="github.com" />
        </div>
        <p v-if="appError" class="text-xs text-red-300">{{ appError }}</p>
        <template #actions>
          <button class="btn-ghost" @click="showAppModal = false">{{ t("actions.cancel") }}</button>
          <button class="btn-solid" :disabled="savingApp" @click="saveApp">
            {{ t("actions.save") }}
          </button>
        </template>
      </GlassModal>

      <!-- Edit shortcut modal -->
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
    </div>
  </BaseLayout>
</template>

<script setup>
import { ref, computed, reactive, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { useAreaStore, isFolder } from "@/plugins/stores/area-store.js";
import { useThemeStore } from "@/plugins/stores/theme-store.js";
import BaseLayout from "@/layouts/BaseLayout.vue";
import AppCard from "@/components/AppCard.vue";
import GlassModal from "@/components/GlassModal.vue";
import SettingsModal from "@/components/SettingsModal.vue";
import ContextMenu from "@/components/ContextMenu.vue";
import Icon from "@/components/Icon.vue";

const { t } = useI18n();
const areaStore = useAreaStore();
const themeStore = useThemeStore();
areaStore.loadFromLocalStorage();

const bgCss = computed(() => themeStore.backgroundCss);

const rootEl = ref(null);
const gridEl = ref(null);
const folderPanelEl = ref(null);
const currentArea = ref(0);
const query = ref("");
const direction = ref("next");

// Each area is capped at 4 rows. The column count matches the Tailwind
// breakpoints on the grid (4 / 5 / 6 / 7), so capacity is responsive.
const MAX_ROWS = 4;
const winW = ref(typeof window !== "undefined" ? window.innerWidth : 1280);
const cols = computed(() =>
  winW.value >= 1024 ? 7 : winW.value >= 768 ? 6 : winW.value >= 640 ? 5 : 4
);
const areaCapacity = computed(() => cols.value * MAX_ROWS);
function isAreaFull(i) {
  return (areas.value[i]?.apps?.length ?? 0) >= areaCapacity.value;
}
const currentAreaFull = computed(() => displayItems.value.length >= areaCapacity.value);
const areas = computed(() => areaStore.areas);
const currentItems = computed(() => areas.value[currentArea.value]?.apps ?? []);
const currentAreaLabel = computed(() => areas.value[currentArea.value]?.label ?? "");
// Page (area) change animation class — driven by the user's Settings choice.
// "slide" is directional (depends on whether we moved to a next/prev area).
const pageAnimClass = computed(() => {
  switch (themeStore.pageAnimation) {
    case "none": return "";
    case "fade": return "anim-fade";
    case "zoom": return "anim-zoom";
    default:     return direction.value === "next" ? "anim-slide-next" : "anim-slide-prev";
  }
});

// Stable, GUARANTEED-UNIQUE key per item object. Keying by url broke when two
// shortcuts shared a URL (or one had none) — duplicate/undefined keys make Vue
// crash with "Cannot read properties of undefined (reading 'el')" during patch.
// A WeakMap gives each object its own id that survives reorders (same object →
// same key, so FLIP still works) and never collides.
const keyMap = new WeakMap();
let keySeq = 0;
function itemKey(item) {
  if (!item || typeof item !== "object") return `v-${String(item)}`;
  let k = keyMap.get(item);
  if (!k) { k = `k${++keySeq}`; keyMap.set(item, k); }
  return k;
}

// Local display order during a drag; mirrors the store except while dragging.
// Deep-watch the area's apps array so in-place store mutations (add / delete /
// move / external drop) re-sync the grid — a shallow watch on the computed misses
// them because splice/push keep the same array reference.
const displayItems = ref([]);
const isDragging = ref(false);
watch(
  [() => areaStore.areas[currentArea.value]?.apps, currentArea, isDragging],
  () => {
    if (!isDragging.value) displayItems.value = (currentItems.value || []).slice();
  },
  { deep: true, immediate: true }
);

const drag = reactive({
  active: false,        // past the move threshold
  fromIdx: -1,          // original index of the dragged item (its "home")
  item: null,           // the dragged item object
  x: 0, y: 0,           // current pointer position (for the clone)
  startX: 0, startY: 0, // pointerdown position
  overDot: -1,          // index of the page dot currently under the pointer (-1 = none)
  slots: [],            // static grid-slot centers captured at drag start
  insertIdx: -1,        // where the dragged item's gap currently sits (display index)
  overFolder: -1,       // display index of the tile we'd merge into (-1 = none)
});
const THRESHOLD = 6;
// Pointer must be this close to a tile's center to count as "dropping onto it"
// (folder), versus landing in the gap between tiles (reorder).
const FOLD_RADIUS = 34;
// The other items (everything except the dragged one), in stable order for the
// whole gesture — the dragged item is re-inserted into this at drag.insertIdx.
let dragOthers = null;

let dragJustEnded = false;

// Launchpad-style live search across every area (folders flattened)
const displayApps = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];
  return areas.value
    .flatMap((a) => a.apps)
    .flatMap((item) => (isFolder(item) ? item.apps : [item]))
    .filter((app) => app.name.toLowerCase().includes(q));
});

function openUrl(url, newTab = false) {
  if (newTab) window.open(url, "_blank", "noopener");
  else window.location.href = url;
}
function onItemClick(item, i, e) {
  if (dragJustEnded) return;
  if (isFolder(item)) {
    openFolder(i);
    return;
  }
  const newTab = !!(e && (e.metaKey || e.ctrlKey || e.button === 1));
  openUrl(item.url, newTab);
}

// --- Pointer drag engine: live reorder within a page ---
// Manual FLIP: capture tile positions before a reorder, then animate each tile
// sliding from its old position to the new one after Vue re-renders. (Vue's
// TransitionGroup leave was unreliable in this layout, so we drive it ourselves.)
function captureTileRects() {
  const m = new Map();
  const g = gridEl.value;
  if (g) {
    g.querySelectorAll("[data-key]").forEach((el) =>
      m.set(el.getAttribute("data-key"), el.getBoundingClientRect())
    );
  }
  return m;
}
function flipFrom(prev) {
  const g = gridEl.value;
  if (!g) return;
  const els = g.querySelectorAll("[data-key]");
  // Settle any in-flight FLIP first so we measure true layout positions and
  // never stack two translate animations on the same tile (the other half of
  // the flicker).
  els.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
  els.forEach((el) => {
    const b = prev.get(el.getAttribute("data-key"));
    if (!b) return;
    const n = el.getBoundingClientRect();
    const dx = b.left - n.left;
    const dy = b.top - n.top;
    if (dx || dy) {
      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0,0)" }],
        { duration: 210, easing: "cubic-bezier(0.2, 0, 0, 1)" }
      );
    }
  });
}

// Capture the on-screen CENTER of every tile slot once, while the layout is
// settled. Grid cells never move during a drag (only the items shuffle between
// them via FLIP), so these centers stay valid for the whole gesture — and being
// a static snapshot they're immune to the in-flight FLIP transforms that made
// elementFromPoint() oscillate and flicker.
function captureSlots() {
  const g = gridEl.value;
  const slots = [];
  if (g) {
    g.querySelectorAll("[data-idx]").forEach((el) => {
      const r = el.getBoundingClientRect();
      slots.push({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    });
  }
  return slots;
}

// Nearest slot center to the pointer — a clean grid hit-test (handles diagonal
// moves too) that only changes when the pointer crosses a real cell midpoint.
function slotIdxFromPoint(x, y) {
  const slots = drag.slots;
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < slots.length; i++) {
    const dx = slots[i].x - x;
    const dy = slots[i].y - y;
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

function onTilePointerDown(i, e) {
  if (e.button !== 0) return;            // left button only
  // stop the browser starting a native image/text drag, which would suppress
  // the pointermove stream and break custom dragging with a real mouse
  e.preventDefault();
  drag.fromIdx = i;                      // "home" index — stays fixed for the gesture
  drag.item = displayItems.value[i];
  drag.startX = e.clientX;
  drag.startY = e.clientY;
  drag.x = e.clientX;
  drag.y = e.clientY;
  drag.active = false;
  drag.insertIdx = i;
  drag.overFolder = -1;
  dragOthers = null;
  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd, { once: true });
  window.addEventListener("pointercancel", onDragEnd, { once: true });
}

// Rebuild displayItems = the other items with the dragged item slotted back in
// at `idx` (its gap), animating everyone to their new spot via FLIP.
function placeGapAt(idx) {
  if (idx === drag.insertIdx) return;
  const prev = captureTileRects();
  displayItems.value = [
    ...dragOthers.slice(0, idx),
    drag.item,
    ...dragOthers.slice(idx),
  ];
  drag.insertIdx = idx;
  nextTick(() => flipFrom(prev));
}

function onDragMove(e) {
  drag.x = e.clientX;
  drag.y = e.clientY;
  if (!drag.active) {
    if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < THRESHOLD) return;
    drag.active = true;
    isDragging.value = true;
    document.body.classList.add("dragging");
    drag.slots = captureSlots();   // snapshot cell centers before any FLIP runs
    dragOthers = displayItems.value.filter((_, i) => i !== drag.fromIdx);
  }

  const nIdx = slotIdxFromPoint(e.clientX, e.clientY);
  const len = displayItems.value.length;
  if (nIdx >= 0 && nIdx < len) {
    if (nIdx === drag.insertIdx) {
      // pointer is over the dragged item's own gap — nothing to decide
      drag.overFolder = -1;
    } else {
      const slot = drag.slots[nIdx];
      const d = Math.hypot(e.clientX - slot.x, e.clientY - slot.y);
      const canFold = !isFolder(drag.item);   // only apps merge into folders
      if (d <= FOLD_RADIUS && canFold) {
        // resting on top of another tile → folder target; keep the gap put
        drag.overFolder = nIdx;
      } else {
        // in the gap around a tile → reorder. Which side decides before/after;
        // a small dead-band around the centerline avoids jitter.
        drag.overFolder = -1;
        if (Math.abs(e.clientX - slot.x) > 6) {
          const oj = nIdx < drag.insertIdx ? nIdx : nIdx - 1;
          const side = e.clientX < slot.x ? 0 : 1;
          const desired = Math.max(0, Math.min(dragOthers.length, oj + side));
          placeGapAt(desired);
        }
      }
    }
  }

  // track which page dot (if any) the pointer is over (for cross-page move)
  const dotEl = document.elementFromPoint(e.clientX, e.clientY)?.closest?.("[data-area]");
  drag.overDot = dotEl ? Number(dotEl.getAttribute("data-area")) : -1;
}

function onDragEnd() {
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
  window.removeEventListener("pointercancel", onDragEnd);
  document.body.classList.remove("dragging");
  const wasActive = drag.active;
  const draggedItem = drag.item;
  const overFolder = drag.overFolder;
  drag.active = false;
  if (wasActive) {
    dragJustEnded = true;
    setTimeout(() => { dragJustEnded = false; }, 0);
    isDragging.value = false;
    const store = areaStore.areas[currentArea.value]?.apps ?? [];
    // 1) drop on a page dot → move the item to that page (if it has room)
    const dotEl = document.elementFromPoint(drag.x, drag.y)?.closest?.("[data-area]");
    const dotArea = dotEl ? Number(dotEl.getAttribute("data-area")) : -1;
    if (dotArea >= 0 && dotArea !== currentArea.value && !isAreaFull(dotArea)) {
      const fromStore = store.indexOf(draggedItem);
      if (fromStore >= 0) areaStore.moveItemToArea(currentArea.value, fromStore, dotArea);
      else commitDisplayOrder();
    } else if (overFolder >= 0) {
      // 2) dropped onto another tile → make/extend a folder
      const targetItem = displayItems.value[overFolder];
      const fromStore = store.indexOf(draggedItem);
      const toStore = store.indexOf(targetItem);
      if (fromStore >= 0 && toStore >= 0 && fromStore !== toStore) {
        areaStore.dropOnItem(currentArea.value, fromStore, toStore);
      }
    } else {
      // 3) dropped in a gap → persist the reordered display order
      commitDisplayOrder();
    }
  }
  drag.item = null;
  drag.overDot = -1;
  drag.overFolder = -1;
  drag.insertIdx = -1;
  dragOthers = null;
}

// Apply displayItems order onto the store by computing the single net move is
// unreliable after multiple swaps, so persist the full order directly.
function commitDisplayOrder() {
  const target = displayItems.value;
  areaStore.areas[currentArea.value].apps = target.slice();
  areaStore.saveToLocalStorage();
}

// --- Page-dot drag to reorder areas ---
const dotDrag = reactive({ active: false, fromIdx: -1 });
function onDotPointerDown(i, e) {
  if (e.button !== 0) return;
  dotDrag.fromIdx = i; dotDrag.active = false;
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
    // defer so the synthetic click after pointerup still sees active and is suppressed
    setTimeout(() => { dotDrag.active = false; }, 0);
  }
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up, { once: true });
}

const ctx = reactive({ open: false, x: 0, y: 0, idx: -1, items: [] });
const showEditModal = ref(false);
const editApp = reactive({ idx: -1, title: "", url: "" });

function onTileContextMenu(item, i, e) {
  ctx.x = e.clientX; ctx.y = e.clientY; ctx.idx = i;
  const moveTargets = areas.value
    .map((a, ai) => ({ a, ai }))
    .filter(({ ai }) => ai !== currentArea.value && !isAreaFull(ai))   // skip full areas
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
  else if (action.type === "renameFolder") openFolder(i);
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

// --- Drop an external link / bookmark / address-bar URL → add a shortcut ---
// (A browser tab dragged from the tab strip is a native OS drag and never reaches
//  the page, so we accept dragged URLs instead — links, bookmarks, the omnibox icon.)
const urlDropActive = ref(false);

function dragHasUrl(e) {
  if (isDragging.value) return false; // internal app reorder in progress
  const types = e.dataTransfer?.types;
  if (!types) return false;
  return types.includes("text/uri-list") || types.includes("text/html");
}

function onPageDragOver(e) {
  if (!dragHasUrl(e)) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  urlDropActive.value = true;
}
function onPageDragLeave(e) {
  // only clear when the cursor actually leaves the window
  if (!e.relatedTarget) urlDropActive.value = false;
}

function extractDrop(dt) {
  let url = "";
  let title = "";
  const uriList = dt.getData("text/uri-list");
  if (uriList) {
    url =
      uriList
        .split(/\r?\n/)
        .map((s) => s.trim())
        .find((s) => s && !s.startsWith("#")) || "";
  }
  const html = dt.getData("text/html");
  if (html) {
    if (!url) {
      const hrefM = html.match(/href\s*=\s*["']([^"']+)["']/i);
      if (hrefM) url = hrefM[1];
    }
    const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text) title = text;
  }
  if (!url) url = (dt.getData("text/plain") || "").trim();
  return { url, title };
}

function titleFromUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const base = host.split(".")[0] || host;
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return "Yeni";
  }
}

async function onPageDrop(e) {
  if (!dragHasUrl(e)) {
    urlDropActive.value = false;
    return;
  }
  e.preventDefault();
  urlDropActive.value = false;
  const { url, title } = extractDrop(e.dataTransfer);
  if (!url) return;
  // Prefer a real title carried by the drag (links from a page carry their text).
  // Chrome's bookmark/tab drags hand us only the URL, so when that happens we look
  // the URL up in the user's bookmarks (needs the "bookmarks" permission) to get
  // its saved title, and only fall back to the hostname if nothing matches.
  const dragged = (title || "").trim();
  const looksLikeUrl = !dragged || dragged === url || /^https?:\/\//i.test(dragged);
  let name = looksLikeUrl ? "" : dragged;
  if (!name) name = (await bookmarkTitle(url)) || titleFromUrl(url);
  if (name.length > 48) name = name.slice(0, 48).trim();
  await areaStore.addAppToArea(currentArea.value, name, url);
}

// Look up a dragged URL in the user's bookmarks to recover its saved title.
async function bookmarkTitle(url) {
  try {
    if (typeof chrome === "undefined" || !chrome.bookmarks?.search) return "";
    const variants = [
      url,
      url.replace(/\/+$/, ""),
      url.endsWith("/") ? url : url + "/",
    ];
    for (const u of [...new Set(variants)]) {
      const hits = await chrome.bookmarks.search({ url: u });
      const hit = hits.find((h) => h.url && h.title && h.title.trim());
      if (hit) return hit.title.trim();
    }
    return "";
  } catch {
    return "";
  }
}

// --- Folder-internal drag: reorder inside, or drag OUT to extract ---
const fdrag = reactive({ active: false, fromIdx: -1, item: null, x: 0, y: 0, out: false });
let folderDragJustEnded = false;
function isInsideFolderPanel(x, y) {
  const p = folderPanelEl.value;
  if (!p) return false;
  const el = document.elementFromPoint(x, y);
  return !!(el && p.contains(el));
}
function onFolderPointerDown(k, e) {
  if (e.button !== 0) return;
  e.preventDefault();          // don't let the browser start a native drag
  fdrag.fromIdx = k;
  fdrag.item = openFolderObj.value?.apps[k] ?? null;
  fdrag.active = false;
  fdrag.out = false;
  const sx = e.clientX, sy = e.clientY;
  function move(ev) {
    if (!fdrag.active && Math.hypot(ev.clientX - sx, ev.clientY - sy) < THRESHOLD) return;
    fdrag.active = true; fdrag.x = ev.clientX; fdrag.y = ev.clientY;
    const inside = isInsideFolderPanel(ev.clientX, ev.clientY);
    fdrag.out = !inside;       // outside the panel → will extract on drop
    if (inside) {
      const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.("[data-fidx]");
      const over = el ? Number(el.getAttribute("data-fidx")) : -1;
      if (over >= 0 && over !== fdrag.fromIdx && folderOpenIndex.value !== null) {
        areaStore.reorderInFolder(currentArea.value, folderOpenIndex.value, fdrag.fromIdx, over);
        fdrag.fromIdx = over;
      }
    }
  }
  function up(ev) {
    window.removeEventListener("pointermove", move);
    const wasActive = fdrag.active;
    const fi = folderOpenIndex.value;
    if (wasActive && fi !== null && !isInsideFolderPanel(ev.clientX, ev.clientY)) {
      // dropped outside the folder → take the app out, back onto the grid
      folderDragJustEnded = true;
      setTimeout(() => { folderDragJustEnded = false; }, 0);
      areaStore.removeFromFolder(currentArea.value, fi, fdrag.fromIdx);
      if (!isFolder(currentItems.value[fi])) closeFolder();   // dissolved
    }
    fdrag.out = false;
    setTimeout(() => { fdrag.active = false; }, 0);
  }
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up, { once: true });
}
// Backdrop click closes the folder — but not when a drag-out just finished on it
function onFolderBackdropClick() {
  if (folderDragJustEnded || fdrag.active) return;
  closeFolder();
}

// --- Folder overlay ---
const folderOpenIndex = ref(null);
const openFolderObj = computed(() => {
  if (folderOpenIndex.value === null) return null;
  const item = currentItems.value[folderOpenIndex.value];
  return isFolder(item) ? item : null;
});
function openFolder(i) {
  folderOpenIndex.value = i;
}
function closeFolder() {
  folderOpenIndex.value = null;
}
function onRenameFolder(e) {
  if (folderOpenIndex.value === null) return;
  areaStore.renameFolder(currentArea.value, folderOpenIndex.value, e.target.value);
}
function removeFromFolderInner(k) {
  if (folderOpenIndex.value === null) return;
  areaStore.removeFromFolder(currentArea.value, folderOpenIndex.value, k);
  // Folder may have dissolved
  if (!isFolder(currentItems.value[folderOpenIndex.value])) closeFolder();
}

// --- Page (area) navigation — clamped at first/last (no wrap) ---
function nextArea() {
  if (currentArea.value >= areas.value.length - 1) return;
  direction.value = "next";
  currentArea.value += 1;
}
function prevArea() {
  if (currentArea.value <= 0) return;
  direction.value = "prev";
  currentArea.value -= 1;
}
function goTo(i) {
  if (i === currentArea.value) return;
  direction.value = i > currentArea.value ? "next" : "prev";
  currentArea.value = i;
}

let wheelLock = false;
function onWheel(e) {
  if (query.value || showAppModal.value || showAreaModal.value ||
      showEditAreaModal.value || openFolderObj.value || showSettings.value ||
      ctx.open || showEditModal.value) return;
  if (areas.value.length < 2) return;
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  if (Math.abs(delta) < 6) return;
  e.preventDefault();
  if (wheelLock) return;
  wheelLock = true;
  delta > 0 ? nextArea() : prevArea();
  window.setTimeout(() => {
    wheelLock = false;
  }, 340);
}
function onKey(e) {
  // Escape: close whatever overlay is open, otherwise clear/exit the search
  if (e.key === "Escape") {
    if (ctx.open) ctx.open = false;
    else if (showEditModal.value) showEditModal.value = false;
    else if (showAppModal.value) showAppModal.value = false;
    else if (showAreaModal.value) showAreaModal.value = false;
    else if (showEditAreaModal.value) showEditAreaModal.value = false;
    else if (showSettings.value) showSettings.value = false;
    else if (openFolderObj.value) closeFolder();
    else if (query.value) {
      query.value = "";
      e.target?.blur?.();
    }
    return;
  }
  if (showAppModal.value || showAreaModal.value || showEditAreaModal.value ||
      openFolderObj.value || showSettings.value || ctx.open || showEditModal.value) return;
  const tag = e.target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  // ← / → switch between areas (pages)
  if (e.key === "ArrowRight") nextArea();
  else if (e.key === "ArrowLeft") prevArea();
}

// Reset transient UI when the page or search changes
watch([currentArea, query], () => {
  closeFolder();
  isDragging.value = false;
});

function onResize() { winW.value = window.innerWidth; }
onMounted(() => {
  rootEl.value?.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);
  window.addEventListener("dragover", onPageDragOver);
  window.addEventListener("dragleave", onPageDragLeave);
  window.addEventListener("drop", onPageDrop);
  window.addEventListener("resize", onResize);
});
onBeforeUnmount(() => {
  rootEl.value?.removeEventListener("wheel", onWheel);
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("dragover", onPageDragOver);
  window.removeEventListener("dragleave", onPageDragLeave);
  window.removeEventListener("drop", onPageDrop);
  window.removeEventListener("resize", onResize);
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
  window.removeEventListener("pointercancel", onDragEnd);
  document.body.classList.remove("dragging");
});

// --- Modals: add area / edit area / add shortcut ---
const showSettings = ref(false);
const showAreaModal = ref(false);
const showEditAreaModal = ref(false);
const showAppModal = ref(false);
const newArea = reactive({ label: "" });
const editArea = reactive({ label: "" });
const newApp = reactive({ title: "", url: "" });
const areaError = ref("");
const editAreaError = ref("");
const appError = ref("");
const savingApp = ref(false);

function openAreaModal() {
  newArea.label = "";
  areaError.value = "";
  showAreaModal.value = true;
}
function saveArea() {
  if (!newArea.label.trim()) {
    areaError.value = t("errors.areaName");
    return;
  }
  areaStore.addArea({ label: newArea.label.trim(), apps: [] });
  currentArea.value = areas.value.length - 1;
  showAreaModal.value = false;
}

function openEditArea() {
  editArea.label = currentAreaLabel.value;
  editAreaError.value = "";
  showEditAreaModal.value = true;
}
function saveEditArea() {
  if (!editArea.label.trim()) {
    editAreaError.value = t("errors.areaName");
    return;
  }
  areaStore.updateArea(currentArea.value, editArea.label.trim());
  showEditAreaModal.value = false;
}
function deleteCurrentArea() {
  areaStore.deleteArea(currentArea.value);
  if (currentArea.value > areas.value.length - 1) {
    currentArea.value = areas.value.length - 1;
  }
  showEditAreaModal.value = false;
}

function openAppModal() {
  newApp.title = "";
  newApp.url = "";
  appError.value = "";
  showAppModal.value = true;
}
async function saveApp() {
  if (!newApp.title.trim() || !newApp.url.trim()) {
    appError.value = t("errors.appFields");
    return;
  }
  savingApp.value = true;
  await areaStore.addAppToArea(currentArea.value, newApp.title.trim(), newApp.url.trim());
  savingApp.value = false;
  showAppModal.value = false;
}
</script>
