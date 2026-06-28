<template>
  <Teleport to="body">
    <Transition name="pop">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4
               bg-black/45 backdrop-blur-sm"
        @click.self="close"
        @keydown.esc="close"
      >
        <div
          class="glass-strong w-full max-w-md rounded-3xl p-6 text-white"
          role="dialog"
          aria-modal="true"
        >
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-lg font-semibold tracking-tight">{{ title }}</h2>
            <button
              type="button"
              class="grid h-8 w-8 place-items-center rounded-full text-white/70
                     transition hover:bg-white/10 hover:text-white"
              aria-label="Kapat"
              @click="close"
            >
              <Icon name="close" :size="18" />
            </button>
          </div>

          <div class="space-y-4">
            <slot />
          </div>

          <div class="mt-6 flex justify-end gap-2">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, onBeforeUnmount } from "vue";
import Icon from "@/components/Icon.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);

function close() {
  emit("update:modelValue", false);
}

function onKey(e) {
  if (e.key === "Escape") close();
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) window.addEventListener("keydown", onKey);
    else window.removeEventListener("keydown", onKey);
  }
);

onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>
