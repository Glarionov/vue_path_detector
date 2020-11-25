import Vue from 'vue'
import VueRouter from 'vue-router'
import FileLoad from '../views/FileLoad.vue'
import Testing from "@/views/Testing.vue";

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'FileLoad',
    component: FileLoad,
    meta: {title: 'Проверка с помощью файла'}
  },
  {
    path: '/testing',
    name: 'Testing',
    component: Testing,
    meta: {title: 'Генератор случайной карты'}
  },
  {
    path: '/about',
    name: 'About',
    meta: {title: 'Что это вообще такое'},
    component: function () {
      return import(/* webpackChunkName: "about" */ '../views/About.vue')
    }
  }
]



const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title;
  }
  next();
});

export default router
