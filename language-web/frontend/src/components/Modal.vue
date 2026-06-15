<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="visible" @click.self="handleClose">
      <div class="modal-box">
        <div class="modal-header">
          <span class="modal-title">{{ title }}</span>
          <button class="modal-close" @click="handleClose">✕</button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
        <div class="modal-footer" v-if="$slots.footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' }
})

const emit = defineEmits(['close'])

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-box {
  background: #fff;
  border: 3px solid #4a4a4a;
  border-radius: 0;
  min-width: 360px;
  max-width: 600px;
  width: 100%;
  box-shadow: 4px 4px 0 #4a4a4a;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #e0d8c0;
  border-bottom: 3px solid #4a4a4a;
}

.modal-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
  color: #2d2d2d;
}

.modal-close {
  background: #c0392b;
  color: #fff;
  border: 2px solid #4a4a4a;
  border-radius: 0;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 14px;
  font-family: 'Consolas', monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 1px 1px 0 #4a4a4a;
}

.modal-close:active {
  box-shadow: none;
  transform: translate(1px, 1px);
}

.modal-body {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  padding: 12px 16px;
  border-top: 3px solid #4a4a4a;
  background: #f5f0e3;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
