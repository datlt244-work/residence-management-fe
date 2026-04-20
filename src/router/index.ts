import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'root',
      redirect: () => {
        const hasToken =
          !!sessionStorage.getItem('access_token') || !!localStorage.getItem('access_token')
        return hasToken ? { name: 'admin-dashboard' } : { name: 'login' }
      },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/AdminLoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/admin',
      component: () => import('../layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('../views/AdminDashboardView.vue'),
          meta: { title: 'Bảng điều khiển' },
        },
        {
          path: 'ton-kho',
          name: 'admin-inventory',
          component: () => import('../views/AdminPlaceholderView.vue'),
          meta: { title: 'Tồn kho căn hộ' },
        },
        {
          path: 'cai-dat',
          name: 'admin-settings',
          component: () => import('../views/AccountSettingsView.vue'),
          meta: { title: 'Cài đặt' },
        },
        {
          path: 'hr/phong-ban',
          name: 'admin-hr-departments',
          component: () => import('../views/DepartmentManagementView.vue'),
          meta: { title: 'Phòng ban' },
        },
        {
          path: 'hr/nhan-vien',
          name: 'admin-hr-employees',
          component: () => import('../views/EmployeeManagementView.vue'),
          meta: { title: 'Nhân viên' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'admin-dashboard' }
  }
})

export default router
