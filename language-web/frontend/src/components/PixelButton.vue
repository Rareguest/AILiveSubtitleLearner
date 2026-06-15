<template>
  <button
    class="pixel-btn"
    :class="[`pixel-btn--${type}`, { 'pixel-btn--disabled': disabled, 'pixel-btn--loading': loading }]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="pixel-btn-spinner">⏳</span>
    <slot v-else />
  </button>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'primary',
    validator: v => ['primary', 'danger', 'success', 'warning'].includes(v)
  },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})

defineEmits(['click'])
</script>

<style scoped>
.pixel-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  padding: 10px 20px;
  border: 3px solid #4a4a4a;
  border-radius: 0;
  cursor: pointer;
  box-shadow: 2px 2px 0 #4a4a4a;
  transition: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
}

.pixel-btn:active:not(:disabled) {
  box-shadow: none;
  transform: translate(2px, 2px);
}

.pixel-btn--primary {
  background: #2980b9;
  color: #fff;
}

.pixel-btn--danger {
  background: #c0392b;
  color: #fff;
}

.pixel-btn--success {
  background: #27ae60;
  color: #fff;
}

.pixel-btn--warning {
  background: #f39c12;
  color: #fff;
}

.pixel-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.pixel-btn--loading {
  cursor: wait;
}

.pixel-btn-spinner {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
