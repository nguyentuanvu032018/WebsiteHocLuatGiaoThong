<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import AppNavbar from '../components/common/AppNavbar.vue';
import AppFooter from '../components/common/AppFooter.vue';

const showBackToTop = ref(false);

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 300;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="student-shell min-vh-100 d-flex flex-column">
    <!-- Navbar Header -->
    <AppNavbar />

    <!-- Main Dynamic Content (Native Bootstrap 5 flex-grow-1) -->
    <main class="flex-grow-1">
      <slot />
    </main>

    <!-- Footer -->
    <AppFooter />

    <!-- Back to top button (class defined in central style.css) -->
    <button 
      v-show="showBackToTop" 
      @click="scrollToTop" 
      class="btn-back-to-top shadow-lg"
      aria-label="Về đầu trang"
    >
      <i class="bi bi-arrow-up-short fs-4"></i>
    </button>
  </div>
</template>
