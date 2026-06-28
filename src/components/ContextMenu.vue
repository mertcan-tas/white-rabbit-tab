<template>
  <Teleport to="body">
    <Transition name="pop">
      <div v-if="open" class="fixed inset-0 z-[60]" @click="$emit('close')" @contextmenu.prevent="$emit('close')">
        <ul
          class="absolute min-w-56 max-w-72 overflow-hidden rounded-2xl border border-white/10
                 bg-[#1b1e27]/95 p-1.5 text-sm text-white shadow-2xl shadow-black/60 backdrop-blur-2xl"
          :style="{ left: clampX(x), top: clampY(y) }"
          @click.stop
        >
          <li v-for="(it, k) in items" :key="k">
            <div v-if="it.danger" class="mx-2 my-1 h-px bg-white/10" />
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left
                     transition hover:bg-white/10"
              :class="it.danger ? 'text-red-400 hover:bg-red-500/15' : ''"
              @click="pick(it)"
            >
              <Icon v-if="it.icon" :name="it.icon" :size="16" class="shrink-0 opacity-70" />
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
// keep the menu on-screen on both axes
function clampX(n) {
  return Math.max(8, Math.min(n ?? 0, window.innerWidth - 300)) + "px";
}
function clampY(n) {
  const estHeight = (props.items.length || 1) * 42 + 24;
  return Math.max(8, Math.min(n ?? 0, window.innerHeight - estHeight)) + "px";
}
function pick(it) {
  emit("select", it.action);
  emit("close");
}
</script>
