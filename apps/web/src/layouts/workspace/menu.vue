<template>
  <div class="menu">
    <MenuItem v-for="item in MENU" :key="item.id" :item="item" />
  </div>
</template>

<script setup lang="ts">
import { MENU } from '@/config/menu';
import MenuItem from './menu-item.vue';
</script>
