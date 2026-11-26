<template>
  <main class="admin-auth-layout">
    <slot />
  </main>
</template>

<style scoped>
.admin-auth-layout {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, #e8eef8, #f8fafc);
}
</style>
