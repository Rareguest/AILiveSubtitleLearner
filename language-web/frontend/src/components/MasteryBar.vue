<template>
  <div class="mastery-bar">
    <span
      v-for="i in 5"
      :key="i"
      class="mastery-block"
      :class="{ 'mastery-block--filled': i <= level }"
    >■</span>
    <span class="mastery-label">{{ level }}/5</span>
  </div>
</template>

<script setup>
defineProps({
  level: { type: Number, default: 0, validator: v => v >= 0 && v <= 5 }
})
</script>

<style scoped>
.mastery-bar {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 14px;
}

.mastery-block {
  color: #ccc;
  font-size: 12px;
}

.mastery-block--filled {
  color: #f39c12;
}

.mastery-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  margin-left: 6px;
  color: #888;
}
</style>
