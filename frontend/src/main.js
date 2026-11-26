import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';

// Bootstrap 5 & Bootstrap Icons
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Custom Design System Core
import './style.css';
import './assets/css/student.css';
import './assets/css/admin.css';

import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.mount('#app');
