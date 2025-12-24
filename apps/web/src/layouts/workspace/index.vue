<template>
  <DefaultLayout>
    <div class="workspace">
      <div class="workspace-left"></div>
      <div class="workspace-main">
        <slot />
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from '../default/index.vue';
</script>

<style lang="scss" scoped>
.workspace {
  flex: 1;
  display: flex;

  &-left {
    width: 240px;
    border-right: 1px solid $border-color-base;
  }

  &-main {
    flex: 1;
    width: 0;
    background: rgba($color-primary, 0.01);
  }
}
</style>
