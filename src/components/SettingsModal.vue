<template>
  <Teleport to="body">
    <Transition name="pop">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-6
               bg-black/50 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="flex h-[560px] max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-3xl
                 border shadow-2xl border-black/10 bg-white text-zinc-900
                 dark:border-white/10 dark:bg-[#15171f] dark:text-white"
          role="dialog"
          aria-modal="true"
        >
          <!-- Sidebar -->
          <aside
            class="w-52 shrink-0 border-r p-3 border-black/5 bg-black/[0.03]
                   dark:border-white/10 dark:bg-white/[0.03]"
          >
            <h2 class="px-3 pb-3 pt-2 text-lg font-semibold tracking-tight">
              {{ t("settings.title") }}
            </h2>
            <nav class="space-y-1">
              <button
                v-for="s in sections"
                :key="s.id"
                type="button"
                class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm
                       font-medium transition"
                :class="
                  active === s.id
                    ? 'bg-black/[0.07] dark:bg-white/10'
                    : 'text-zinc-500 hover:bg-black/[0.04] dark:text-white/60 dark:hover:bg-white/5'
                "
                @click="active = s.id"
              >
                <Icon :name="s.icon" :size="18" />
                {{ t(s.label) }}
              </button>
            </nav>
          </aside>

          <!-- Content -->
          <section class="flex flex-1 flex-col overflow-hidden">
            <header class="flex items-center justify-between px-7 pt-6 pb-2">
              <h3 class="text-xl font-semibold tracking-tight">{{ t(activeLabel) }}</h3>
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-full text-zinc-400
                       transition hover:bg-black/5 hover:text-zinc-700
                       dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                :aria-label="t('actions.cancel')"
                @click="close"
              >
                <Icon name="close" :size="18" />
              </button>
            </header>

            <div class="flex-1 overflow-y-auto px-7 pb-7">
              <!-- Appearance -->
              <template v-if="active === 'appearance'">
                <div class="flex items-center justify-between py-3">
                  <div>
                    <p class="text-sm font-medium">{{ t("settings.theme") }}</p>
                    <p class="text-xs text-zinc-500 dark:text-white/50">
                      {{ t("settings.themeHint") }}
                    </p>
                  </div>
                  <div class="segment">
                    <button class="seg-btn" :class="!isDark ? 'seg-on' : 'seg-off'" @click="selectTheme(false)">
                      <Icon name="sun" :size="16" />{{ t("settings.light") }}
                    </button>
                    <button class="seg-btn" :class="isDark ? 'seg-on' : 'seg-off'" @click="selectTheme(true)">
                      <Icon name="moon" :size="16" />{{ t("settings.dark") }}
                    </button>
                  </div>
                </div>

                <div class="my-1 h-px bg-black/5 dark:bg-white/10" />

                <div class="py-3">
                  <p class="text-sm font-medium">{{ t("settings.background") }}</p>
                  <p class="text-xs text-zinc-500 dark:text-white/50">
                    {{ t("settings.backgroundHint") }}
                  </p>
                  <div class="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
                    <!-- Random -->
                    <button
                      type="button"
                      class="relative grid h-14 place-items-center rounded-xl ring-1 transition
                             hover:scale-105 ring-black/10 dark:ring-white/15"
                      :style="randomSwatch"
                      :title="t('settings.random')"
                      :aria-label="t('settings.random')"
                      @click="themeStore.setBackground('random')"
                    >
                      <span
                        v-if="background === 'random'"
                        class="grid h-5 w-5 place-items-center rounded-full bg-white text-black shadow"
                      >
                        <Icon name="check" :size="13" />
                      </span>
                      <span
                        v-else
                        class="grid h-6 w-6 place-items-center rounded-full bg-black/40 text-white backdrop-blur"
                      >
                        <Icon name="shuffle" :size="13" />
                      </span>
                    </button>
                    <button
                      v-for="g in gradients"
                      :key="g.id"
                      type="button"
                      class="relative h-14 rounded-xl ring-1 transition hover:scale-105
                             ring-black/10 dark:ring-white/15"
                      :style="{ background: g.css }"
                      :title="g.name"
                      :aria-label="g.name"
                      @click="themeStore.setBackground(g.id)"
                    >
                      <span v-if="background === g.id" class="absolute inset-0 grid place-items-center">
                        <span class="grid h-5 w-5 place-items-center rounded-full bg-white text-black shadow">
                          <Icon name="check" :size="13" />
                        </span>
                      </span>
                    </button>
                  </div>
                </div>

                <div class="my-1 h-px bg-black/5 dark:bg-white/10" />

                <div class="flex items-center justify-between py-3">
                  <div>
                    <p class="text-sm font-medium">{{ t("settings.transition") }}</p>
                    <p class="text-xs text-zinc-500 dark:text-white/50">
                      {{ t("settings.transitionHint") }}
                    </p>
                  </div>
                  <div class="segment">
                    <button
                      v-for="opt in animations"
                      :key="opt.id"
                      type="button"
                      class="seg-btn"
                      :class="pageAnimation === opt.id ? 'seg-on' : 'seg-off'"
                      @click="themeStore.setPageAnimation(opt.id)"
                    >
                      {{ t(opt.label) }}
                    </button>
                  </div>
                </div>
              </template>

              <!-- General -->
              <template v-else-if="active === 'general'">
                <div class="flex items-center justify-between py-3">
                  <div>
                    <p class="text-sm font-medium">{{ t("settings.language") }}</p>
                    <p class="text-xs text-zinc-500 dark:text-white/50">Türkçe / English</p>
                  </div>
                  <div class="segment">
                    <button class="seg-btn" :class="currentLanguage === 'tr' ? 'seg-on' : 'seg-off'" @click="themeStore.setLanguage('tr')">
                      TR
                    </button>
                    <button class="seg-btn" :class="currentLanguage === 'en' ? 'seg-on' : 'seg-off'" @click="themeStore.setLanguage('en')">
                      EN
                    </button>
                  </div>
                </div>

                <div class="my-1 h-px bg-black/5 dark:bg-white/10" />

                <div class="py-3">
                  <p class="text-sm font-medium">{{ t("settings.about") }}</p>
                  <p class="text-xs text-zinc-500 dark:text-white/50">Hexpane · v2.0.1</p>
                </div>
              </template>

              <!-- Data / backup -->
              <template v-else-if="active === 'data'">
                <div class="py-3">
                  <p class="text-sm font-medium">{{ t("settings.backup") }}</p>
                  <p class="text-xs text-zinc-500 dark:text-white/50">
                    {{ t("settings.backupHint") }}
                  </p>

                  <div v-if="!pendingImport" class="mt-4 flex flex-wrap gap-3">
                    <button class="btn-solid flex items-center gap-2" @click="doExport">
                      <Icon name="download" :size="16" />{{ t("settings.export") }}
                    </button>
                    <button
                      class="btn-ghost flex items-center gap-2 ring-1 ring-black/10 dark:ring-white/15"
                      @click="triggerImport"
                    >
                      <Icon name="upload" :size="16" />{{ t("settings.import") }}
                    </button>
                  </div>

                  <!-- Replace-all confirmation (no native dialog) -->
                  <div
                    v-else
                    class="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4"
                  >
                    <p class="text-sm">{{ t("settings.importConfirm") }}</p>
                    <p class="mt-1 truncate text-xs text-zinc-500 dark:text-white/50">
                      {{ pendingImport.name }}
                    </p>
                    <div class="mt-3 flex gap-3">
                      <button class="btn-solid" @click="confirmImport">{{ t("settings.import") }}</button>
                      <button class="btn-ghost" @click="cancelImport">{{ t("actions.cancel") }}</button>
                    </div>
                  </div>

                  <input
                    ref="fileInput"
                    type="file"
                    accept="application/json,.json"
                    class="hidden"
                    @change="onImportFile"
                  />
                  <p v-if="dataMsg" class="mt-3 text-xs text-zinc-500 dark:text-white/60">{{ dataMsg }}</p>
                </div>
              </template>
            </div>
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useThemeStore } from "@/plugins/stores/theme-store.js";
import { useAreaStore } from "@/plugins/stores/area-store.js";
import { GRADIENTS } from "@/utils/gradients.js";
import Icon from "@/components/Icon.vue";

const props = defineProps({ modelValue: { type: Boolean, default: false } });
const emit = defineEmits(["update:modelValue"]);

const { t } = useI18n();
const themeStore = useThemeStore();
const areaStore = useAreaStore();
const { isDark, currentLanguage, background, pageAnimation } = storeToRefs(themeStore);
const gradients = GRADIENTS;
const animations = [
  { id: "slide", label: "settings.animSlide" },
  { id: "fade", label: "settings.animFade" },
  { id: "zoom", label: "settings.animZoom" },
  { id: "none", label: "settings.animNone" },
];
const randomSwatch = {
  background:
    "conic-gradient(from 0deg, #f43f5e, #f59e0b, #22c55e, #06b6d4, #6366f1, #d946ef, #f43f5e)",
};

const sections = [
  { id: "appearance", label: "settings.appearance", icon: "display" },
  { id: "general", label: "settings.general", icon: "globe" },
  { id: "data", label: "settings.data", icon: "database" },
];

// --- Backup: export / import all areas + shortcuts ---
const fileInput = ref(null);
const dataMsg = ref("");
const pendingImport = ref(null);   // { data, name } awaiting confirmation
function doExport() {
  const data = areaStore.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hexpane-backup.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function triggerImport() {
  dataMsg.value = "";
  fileInput.value?.click();
}
async function onImportFile(e) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  dataMsg.value = "";
  try {
    const data = JSON.parse(await file.text());
    if (!data || !Array.isArray(data.areas)) {
      dataMsg.value = t("settings.importError");
      return;
    }
    pendingImport.value = { data, name: file.name };   // ask before replacing
  } catch {
    dataMsg.value = t("settings.importError");
  }
}
function confirmImport() {
  const ok = pendingImport.value && areaStore.importData(pendingImport.value.data);
  dataMsg.value = ok ? t("settings.importDone") : t("settings.importError");
  pendingImport.value = null;
}
function cancelImport() {
  pendingImport.value = null;
}
const active = ref("appearance");
const activeLabel = computed(
  () => sections.find((s) => s.id === active.value)?.label ?? "settings.title"
);

function selectTheme(dark) {
  if (themeStore.isDark !== dark) themeStore.toggleDarkMode();
}
function close() {
  emit("update:modelValue", false);
}
function onKey(e) {
  if (e.key === "Escape") close();
}
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      active.value = "appearance";
      window.addEventListener("keydown", onKey);
    } else {
      window.removeEventListener("keydown", onKey);
    }
  }
);
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>
