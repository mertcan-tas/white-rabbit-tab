<template>
  <div class="h-full w-full">
    <slot />
  </div>
</template>

<script setup>
import { watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useThemeStore } from "@/plugins/stores/theme-store.js";

const themeStore = useThemeStore();
const { currentLanguage } = storeToRefs(themeStore);
const { locale } = useI18n();

watch(
  currentLanguage,
  (lang) => {
    locale.value = lang;
    document.documentElement.setAttribute("lang", lang);
  },
  { immediate: true }
);

onMounted(() => {
  themeStore.initSettings();
  locale.value = themeStore.currentLanguage;
});
</script>
