<script setup>
import { onLaunch, onShow } from "@dcloudio/uni-app";
import store from "./store";

// 应用启动时检查
onLaunch(() => {
  checkAuth();
});

// 应用从后台进入前台时检查
onShow(() => {
  checkAuth();
});

const checkAuth = () => {
  const token = store.state.token;
  // 获取当前页面路由
  const pages = getCurrentPages();
  const currentPage = pages.length ? `/${pages[pages.length - 1].route}` : null;

  const whiteList = ["/pages/login/login", "/pages/register/register"];

  if (!token) {
    // 如果未登录，且当前页不在白名单内，则跳转到登录页
    if (currentPage && !whiteList.includes(currentPage)) {
      uni.reLaunch({
        url: "/pages/login/login",
      });
    }
  }
};
</script>

<style>
/*每个页面公共css */
</style>
