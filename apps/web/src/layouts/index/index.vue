<template>
  <DefaultLayout>
    <div class="index-layout">
      <div class="layout-content">
        <slot />
      </div>
      <div class="layout-footer">
        <span>©{{ year }} 橙续缘</span>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="tsx">
import { computed } from 'vue';
import DefaultLayout from '../default/index.vue';

const year = computed(() => {
  const current = new Date().getFullYear();
  return [...new Set([2025, current])].join('-');
});
</script>

<style lang="scss" scoped>
.index-layout {
  flex: 1;
  display: flex;
  flex-direction: column;

  .layout-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .layout-footer {
    padding: $spacing-base 0;
    background: rgba($color-primary, 0.02);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    color: $text-color-light;
    font-size: $font-size-small;
  }
}
</style>
