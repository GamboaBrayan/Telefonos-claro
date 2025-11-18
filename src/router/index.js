// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";

import Login from "../views/Login.vue";
import BuscadorView from "../views/BuscadorView.vue";
import { supabase } from "../lib/supabase";
import Register from "../views/Register.vue";

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login },
   { path: "/register", component: Register },
  {
    path: "/buscador",
    component: BuscadorView,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// protector de rutas
router.beforeEach(async (to) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (to.meta.requiresAuth && !session) {
    return "/login";
  }
});

export default router;
