import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { getLicenseGroup } from '../utils/licenseGroups';
import { ADMIN_PORT, isAdminPortal } from '../utils/portals';

// Lazy loading views
const HomeView = () => import('../views/HomeView.vue');
const StudyView = () => import('../views/study/StudyView.vue');
const ParalysisView = () => import('../views/study/ParalysisView.vue');
const SignsView = () => import('../views/lookup/SignsView.vue');
const FinesView = () => import('../views/lookup/FinesView.vue');
const SignRecognitionView = () => import('../views/lookup/SignRecognitionView.vue');
const ChatbotView = () => import('../views/lookup/ChatbotView.vue');
const ExamSelectView = () => import('../views/exam/ExamSelectView.vue');
const ExamRoomView = () => import('../views/exam/ExamRoomView.vue');
const ExamResultView = () => import('../views/exam/ExamResultView.vue');
const ExamReviewView = () => import('../views/exam/ExamReviewView.vue');
const ExamHistoryView = () => import('../views/exam/ExamHistoryView.vue');
const AdminQuestionsView = () => import('../views/admin/AdminQuestionsView.vue');
const AdminUsersView = () => import('../views/admin/AdminUsersView.vue');
const AdminSignsView = () => import('../views/admin/AdminSignsView.vue');
const AdminDashboardView = () => import('../views/admin/AdminDashboardView.vue');
const AdminChaptersView = () => import('../views/admin/AdminChaptersView.vue');
const AdminExamRoomsView = () => import('../views/admin/AdminExamRoomsView.vue');
const AdminFinesView = () => import('../views/admin/AdminFinesView.vue');
const LoginView = () => import('../views/auth/LoginView.vue');
const RegisterView = () => import('../views/auth/RegisterView.vue');
const ForgotPasswordView = () => import('../views/auth/ForgotPasswordView.vue');
const NotFoundView = () => import('../views/NotFoundView.vue');
const AdminNotFoundView = () => import('../views/admin/AdminNotFoundView.vue');

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { layout: 'default', title: 'Trang chủ - Học & Thi Thử Luật Giao Thông' }
  },
  {
    path: '/study',
    name: 'study',
    component: StudyView,
    meta: { layout: 'default', title: 'Ôn thi lý thuyết theo hạng' }
  },
  {
    path: '/study/paralysis',
    name: 'paralysis',
    component: ParalysisView,
    meta: { layout: 'default', title: '60 Câu hỏi điểm liệt - Thi sát hạch' }
  },
  {
    path: '/lookup/signs',
    name: 'signs',
    component: SignsView,
    meta: { layout: 'default', title: 'Tra cứu hệ thống biển báo đường bộ' }
  },
  {
    path: '/lookup/fines',
    name: 'fines',
    component: FinesView,
    meta: { layout: 'default', title: 'Tra cứu mức phạt Nghị định 100/123' }
  },
  {
    path: '/lookup/recognize',
    name: 'sign-recognition',
    component: SignRecognitionView,
    meta: { layout: 'default', title: 'Nhận diện biển báo giao thông bằng AI (ResNet-50)' }
  },
  {
    path: '/lookup/chatbot',
    name: 'chatbot',
    component: ChatbotView,
    meta: { layout: 'default', title: 'Hỏi đáp AI - Trợ lý Luật Giao Thông' }
  },
  {
    path: '/exam',
    name: 'exam-select',
    component: ExamSelectView,
    meta: { layout: 'default', title: 'Lựa chọn hạng bằng thi thử sát hạch' }
  },
  {
    path: '/exam/room/:id',
    name: 'exam-room',
    component: ExamRoomView,
    meta: { layout: 'exam', title: 'Phòng thi sát hạch lý thuyết trực tuyến', requiresAuth: true }
  },
  {
    path: '/exam/result/:id',
    name: 'exam-result',
    component: ExamResultView,
    meta: { layout: 'default', title: 'Kết quả bài thi sát hạch' }
  },
  {
    path: '/exam/review/:id',
    name: 'exam-review',
    component: ExamReviewView,
    meta: { layout: 'default', title: 'Xem lại bài thi sát hạch', requiresAuth: true }
  },
  {
    path: '/exam/history',
    name: 'exam-history',
    component: ExamHistoryView,
    meta: { layout: 'default', title: 'Lịch sử các lần thi thử', requiresAuth: true }
  },
  {
    path: '/admin/questions',
    name: 'admin-questions',
    component: AdminQuestionsView,
    meta: { layout: 'admin', title: 'Quản lý ngân hàng 600 câu hỏi', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: AdminUsersView,
    meta: { layout: 'admin', title: 'Quản lý tài khoản người dùng', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/signs',
    name: 'admin-signs',
    component: AdminSignsView,
    meta: { layout: 'admin', title: 'Quản lý biển báo giao thông', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/chapters',
    name: 'admin-chapters',
    component: AdminChaptersView,
    meta: { layout: 'admin', title: 'Quản lý chương lý thuyết', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/exam-rooms',
    alias: '/admin/license-types',
    name: 'admin-exam-rooms',
    component: AdminExamRoomsView,
    meta: { layout: 'admin', title: 'Quản lý phòng thi sát hạch', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/fines',
    name: 'admin-fines',
    component: AdminFinesView,
    meta: { layout: 'admin', title: 'Quản lý mức xử phạt giao thông', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin',
    redirect: '/admin/dashboard'
  },
  {
    path: '/admin/dashboard',
    name: 'admin-dashboard',
    component: AdminDashboardView,
    meta: { layout: 'admin', title: 'Admin Dashboard - Thống kê hệ thống', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { layout: 'default', title: 'Đăng nhập hệ thống', guestOnly: true }
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPasswordView,
    meta: { layout: 'default', title: 'Quên mật khẩu - Đặt lại mật khẩu', guestOnly: true }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { layout: 'default', title: 'Đăng ký tài khoản học viên mới', guestOnly: true }
  },
  {
    path: '/admin/:pathMatch(.*)*',
    name: 'admin-not-found',
    component: AdminNotFoundView,
    meta: { layout: 'admin', title: '404 - Không tìm thấy trang quản trị', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { layout: 'default', title: '404 - Không tìm thấy trang' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

// Navigation Guard: Cập nhật Tiêu đề trang & Bảo vệ đường dẫn xác thực
router.beforeEach((to) => {
  const baseTitle = 'Học & Thi Thử Luật Giao Thông';
  document.title = to.meta?.title ? `${to.meta.title} | ${baseTitle}` : baseTitle;

  if (to.path === '/study' && !getLicenseGroup(to.query.group)) {
    return '/exam';
  }

  const authStore = useAuthStore();
  const adminPortal = isAdminPortal();

  if (adminPortal) {
    if (to.path === '/' || to.path === '/register') return '/login';
    if (!['/login', '/forgot-password'].includes(to.path) && to.meta?.layout !== 'admin') {
      if (authStore.isAuthenticated && authStore.isAdmin) {
        return `/admin${to.fullPath.startsWith('/') ? '' : '/'}${to.fullPath}`;
      }
      return '/login';
    }
  } else if (to.meta?.layout === 'admin') {
    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      window.location.assign(`http://${window.location.hostname}:${ADMIN_PORT}${to.fullPath}`);
      return false;
    }
    return '/';
  }

  // 1. Tuyến đường chỉ dành cho khách (guestOnly: /login, /register)
  if (to.meta?.guestOnly && authStore.isAuthenticated) {
    if (adminPortal && authStore.isAdmin) return '/admin/dashboard';
    if (!adminPortal && !authStore.isAdmin) return '/';
    authStore.logout();
  }

  // 2. Tuyến đường yêu cầu đăng nhập (requiresAuth)
  if (to.meta?.requiresAuth && !authStore.isAuthenticated) {
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    };
  }

  // 3. Tuyến đường yêu cầu quyền Quản trị viên (requiresAdmin: /admin/*)
  if (to.meta?.requiresAdmin && !authStore.isAdmin) {
    return '/login';
  }

});

export default router;
