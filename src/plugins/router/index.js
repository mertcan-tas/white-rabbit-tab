import { createRouter, createWebHistory } from "vue-router";

import HomeView from "@/views/home/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  linkActiveClass: "active",
  linkExactActiveClass: "",
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/:catchAll(.*)",
      name: "notfound",
      component: HomeView,
    },
  ],
});

export default router;
