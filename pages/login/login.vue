<template>
  <view class="login-container">
    <view class="hero-section">
      <text class="title">欢迎回到 小众点评</text>
      <text class="subtitle">发现与分享校园美味</text>
    </view>

    <uni-forms
      ref="formRef"
      :modelValue="formData"
      :rules="rules"
      class="form-section"
    >
      <uni-forms-item name="username">
        <uni-easyinput
          prefixIcon="person"
          v-model="formData.username"
          placeholder="请输入用户名"
          :styles="inputStyles"
          trim="all"
        />
      </uni-forms-item>
      <uni-forms-item name="password">
        <uni-easyinput
          prefixIcon="locked"
          type="password"
          v-model="formData.password"
          placeholder="请输入密码"
          :styles="inputStyles"
          trim="all"
        />
      </uni-forms-item>
    </uni-forms>

    <button class="login-button" @click="handleLogin" :loading="isLoading">
      登录
    </button>

    <view class="footer-links">
      <text class="link" @click="goToRegister">注册新账号</text>
      <text class="link" @click="handleForgotPassword">忘记密码?</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from "vue";
import { login, getUserInfo } from "@/services/api.js";
import store from "@/store";
import {
  RoutePath,
  reLaunch,
  navigateTo as routerNavigateTo,
} from "@/utils/router.js";

const formRef = ref(null);
const isLoading = ref(false);

const formData = reactive({
  username: "",
  password: "",
});

const inputStyles = {
  borderColor: "#e5e7eb",
  color: "#1f2937",
  backgroundColor: "#f9fafb",
};

const rules = {
  username: {
    rules: [{ required: true, errorMessage: "请输入用户名" }],
  },
  password: {
    rules: [{ required: true, errorMessage: "请输入密码" }],
  },
};

const handleLogin = async () => {
  try {
    const values = await formRef.value.validate();
    isLoading.value = true;

    const loginData = {
      username: values.username,
      password: values.password, // 直接使用原始密码
    };

    const loginRes = await login(loginData);

    if (loginRes.token) {
      // 保存 token
      store.commit("setToken", loginRes.token);

      // 获取用户信息
      const userInfo = await getUserInfo(loginRes.userId);

      // 保存用户信息
      store.commit("setUser", { ...userInfo, userId: loginRes.userId });

      uni.showToast({
        title: "登录成功",
        icon: "success",
      });

      // 根据角色跳转
      if (userInfo.role === "merchant") {
        reLaunch(RoutePath.MERCHANT_WINDOW_MANAGE);
      } else {
        reLaunch(RoutePath.HOME);
      }
    }
  } catch (err) {
    // uni-forms 验证失败或 API 请求错误时，err 会被捕获
    // request.js 中已经处理了错误 toast，这里可以不重复处理
    console.error("Login failed:", err);
  } finally {
    isLoading.value = false;
  }
};

const goToRegister = () => {
  routerNavigateTo(RoutePath.REGISTER);
};

const handleForgotPassword = () => {
  uni.showToast({
    title: "该功能尚未开放",
    icon: "none",
  });
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0 60rpx;
  background: linear-gradient(180deg, #f3f4f6 0%, #ffffff 100%);
}

.hero-section {
  text-align: center;
  padding-top: 120rpx;
  padding-bottom: 80rpx;
}

.title {
  font-size: 52rpx;
  font-weight: 700;
  color: #111827;
}

.subtitle {
  font-size: 32rpx;
  color: #6b7280;
  margin-top: 16rpx;
}

.form-section {
  margin-bottom: 40rpx;
}

.login-button {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 24rpx;
  background-color: #ff7a45; /* 主题橙色 */
  color: white;
  font-size: 34rpx;
  font-weight: 500;
  border: none;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transition: background-color 0.3s;
}

.login-button:active {
  background-color: #ff5a1f; /* 更深的橙色 */
}

.footer-links {
  display: flex;
  justify-content: space-between;
  margin-top: 40rpx;
}

.link {
  font-size: 28rpx;
  color: #ff7a45; /* 主题橙色 */
  cursor: pointer;
}
</style>
