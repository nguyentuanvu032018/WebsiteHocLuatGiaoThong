<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import DefaultLayout from './layouts/DefaultLayout.vue';
import ExamLayout from './layouts/ExamLayout.vue';
import AdminLayout from './layouts/AdminLayout.vue';
import AdminAuthLayout from './layouts/AdminAuthLayout.vue';
import { useAuthStore } from './stores/auth';
import { isAdminPortal } from './utils/portals';

const route = useRoute();
const authStore = useAuthStore();

const isAdminRoute = computed(() => {
  return route.meta?.layout === 'admin';
});

// Lựa chọn Layout động dựa trên meta.layout của route hiện tại (student / admin / exam)
const currentLayout = computed(() => {
  if (route.meta?.layout === 'exam') return ExamLayout;
  if (route.meta?.layout === 'admin' || isAdminRoute.value) return AdminLayout;
  if (isAdminPortal()) return AdminAuthLayout;
  return DefaultLayout;
});

onMounted(() => {
  // Đồng bộ thông tin người dùng nếu đã có token
  if (authStore.token) {
    authStore.fetchMe().catch(() => {});
  }
});
</script>

<template>
  <component :is="currentLayout">
    <router-view v-slot="{ Component, route }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </router-view>
  </component>
</template>
