<template>
  <DefaultLayout>
    <el-splitter class="workspace" layout="horizontal">
      <el-splitter-panel :size="240" :resizable="false" :collapsible="true">
        <Menu />
      </el-splitter-panel>
      <el-splitter-panel class="workspace-main">
        <div class="workspace-content">
          <slot />
        </div>
      </el-splitter-panel>
    </el-splitter>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from '../default/index.vue';
import Menu from './menu.vue';
</script>

<style lang="scss" scoped>
.workspace {
  flex: 1;
  display: flex;

  :deep(.el-splitter-bar__dragger-horizontal::before) {
    width: 1px;
    background-color: $border-color-base;
  }

  :deep(.workspace-main) {
    background: rgba($color-primary, 0.01);
  }

  &-content {
    padding: $spacing-base;
  }
}
</style>
