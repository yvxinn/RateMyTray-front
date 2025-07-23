import { createApp } from "vue";
import App from "./App";
import store from "./store"; // 1. 导入 store

// --- 导航守卫 ---
const whiteList = ["/pages/login/login", "/pages/register/register"];

function hasPermission(url) {
  const token = store.state.token;
  if (token) {
    return true; // 已登录，允许访问所有页面
  } else {
    // 未登录，检查是否在白名单内
    // 注意：url 可能是 /pages/index/index?id=123，需要去掉参数
    const path = url.split("?")[0];
    return whiteList.includes(path);
  }
}

uni.addInterceptor("navigateTo", {
  invoke(args) {
    if (!hasPermission(args.url)) {
      uni.reLaunch({ url: "/pages/login/login" });
      return false; // 阻止本次跳转
    }
    return true;
  },
});

uni.addInterceptor("reLaunch", {
  invoke(args) {
    if (!hasPermission(args.url)) {
      uni.reLaunch({ url: "/pages/login/login" });
      return false;
    }
    return true;
  },
});

uni.addInterceptor("switchTab", {
  invoke(args) {
    if (!hasPermission(args.url)) {
      uni.reLaunch({ url: "/pages/login/login" });
      return false;
    }
    return true;
  },
});
// --- 导航守卫 END ---

const app = createApp(App);

// 2. 将 store 挂载到全局
app.config.globalProperties.$store = store;
app.provide("store", store);

app.mount("#app");
