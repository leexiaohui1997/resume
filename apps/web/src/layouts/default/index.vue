<template>
  <div class="layout">
    <div class="layout-header">
      <a href="/" class="layout-logo">
        <h1 class="layout-title">RESUME - 简历制作</h1>
      </a>
    </div>
    <div class="layout-main">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.layout {
  height: 100%;
  display: flex;
  flex-direction: column;

  &-header {
    height: 64px;
    padding: 0 $spacing-base;
    border-bottom: 1px solid $border-color-base;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &-main {
    flex: 1;
    height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }

  &-logo {
    font-size: $font-size-large;
  }
}
</style>
