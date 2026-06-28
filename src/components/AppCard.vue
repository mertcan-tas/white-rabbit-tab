<template>
  <a
    :href="url"
    :title="name"
    class="group flex w-[104px] flex-col items-center gap-2 rounded-2xl px-1 py-2
           select-none transition hover:bg-white/10"
  >
    <span
      class="flex h-[68px] w-[68px] items-center justify-center overflow-hidden
             rounded-[20px] bg-white shadow-lg ring-1 ring-black/5
             transition duration-150 group-hover:scale-110 group-active:scale-95"
    >
      <img
        v-if="icon"
        :src="icon"
        :alt="name"
        class="h-11 w-11 object-contain"
        loading="lazy"
        draggable="false"
      />
      <slot v-else />
    </span>
    <span class="ink w-full truncate text-center text-xs font-medium leading-tight">
      {{ name }}
    </span>
  </a>
</template>

<script setup>
defineProps({
  name: { type: String, default: "" },
  url: { type: String, default: "#" },
  icon: { type: String, default: "" },
});
</script>
