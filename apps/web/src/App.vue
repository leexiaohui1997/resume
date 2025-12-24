<template>
  <component :is="layoutComponent" v-if="layoutComponent">
    <router-view />
  </component>
  <template v-else>
    <router-view />
  </template>
</template>

<script setup lang="tsx">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { layoutComponents, LayoutType } from './layouts';

const route = useRoute();
const routeLayout = computed(() => route.meta.layout ?? LayoutType.Index);
const layoutComponent = computed(() => layoutComponents[routeLayout.value]);
</script>
