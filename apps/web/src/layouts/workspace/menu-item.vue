<template>
  <div class="menu-item" :class="{ active: isActive, open: childOpen }" :data-level="level">
    <div class="menu-item-top" @click="handleClick">
      <div class="menu-item-info">
        <div v-if="isTop" class="menu-item-icon">
          <Menu />
        </div>

        <div class="menu-item-title">
          <span>{{ item.title }}</span>
        </div>
      </div>

      <div v-if="hasChild" class="menu-item-right">
        <CaretRight />
      </div>
    </div>

    <template v-if="hasChild">
      <div v-show="childOpen" class="menu-item-children">
        <MenuItem v-for="child in item.children" :key="child.id" :item="child" :level="level + 1" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { CaretRight, Menu } from '@element-plus/icons-vue';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { MenuItemRaw } from '../../config/menu';

const props = withDefaults(
  defineProps<{
    item: MenuItemRaw;
    level?: number;
  }>(),
  {
    level: 1,
  }
);

const isTop = computed(() => props.level === 1);
const hasChild = computed(() => !!props.item.children?.length);

const route = useRoute();
const router = useRouter();
const isActive = computed(() => route.meta.belongMenu === props.item.id);

const childOpen = ref(true);
const handleClick = () => {
  if (hasChild.value) {
    childOpen.value = !childOpen.value;
    return;
  }

  if (props.item.path) {
    router.push(props.item.path);
  }
};
</script>

<style lang="scss" scoped>
$item-height: 46px;
$item-height-2: 32px;

.menu-item {
  &-top {
    height: $item-height;
    gap: $spacing-xs;
    display: flex;
    align-items: center;
    padding: 0 $spacing-small;
    font-size: $font-size-small;
    cursor: pointer;
    transition: all 0.2s linear;

    svg {
      width: 1em;
      height: 1em;
      transition: transform 0.2s linear;
    }

    &:hover {
      background: rgba($color-primary, 0.1);
      .menu-item-right {
        color: $text-color-light;
      }
    }
  }

  &-info {
    flex: 1;
    gap: $spacing-xs;
    display: flex;
    align-items: center;
    color: $text-color-light;
  }

  &-icon,
  &-right {
    display: flex;
    align-items: center;
  }

  &-right {
    color: $text-color-gray;
    transition: color 0.3s linear;
  }

  &[data-level='2'] {
    .menu-item-top {
      height: $item-height-2;
    }
    .menu-item-info {
      padding-left: $spacing-base;
    }
  }

  &.open > .menu-item-top .menu-item-right > svg {
    transform: rotate(90deg);
  }

  &.active > .menu-item-top {
    background: rgba($color-primary, 0.1);
    position: relative;

    &::before {
      content: '';
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      position: absolute;
      background: $color-primary;
    }

    .menu-item-info {
      color: $color-primary;
    }
  }
}
</style>
