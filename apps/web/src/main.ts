import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import './assets/scss/index.scss';
import router from './router';
import { useUserStore } from './stores/user';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

async function init() {
  // 初始化用户状态
  const userStore = useUserStore();
  await userStore.initUserState();

  app.mount('#app');
}

init();
