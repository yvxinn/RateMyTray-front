<template>
  <view class="register-container">
    <!-- 背景装饰 -->
    <view class="background-decoration">
      <view class="bg-circle circle-1"></view>
      <view class="bg-circle circle-2"></view>
      <view class="bg-circle circle-3"></view>
    </view>

    <!-- 注册卡片 -->
    <view class="register-card">
      <view class="card-header">
        <view class="logo-container">
          <uni-icons type="person-add" size="35" color="#ff7a45"></uni-icons>
        </view>
        <text class="welcome-title">加入小众点评</text>
        <text class="welcome-subtitle">仅需一步，开启美食之旅</text>
      </view>

      <uni-forms
        ref="formRef"
        :modelValue="formData"
        :rules="rules"
        class="form-section"
      >
        <uni-forms-item name="username" class="form-item">
          <view class="input-container">
            <uni-icons
              type="person-add"
              size="18"
              color="#9CA3AF"
              class="input-icon"
            ></uni-icons>
            <uni-easyinput
              v-model="formData.username"
              placeholder="设置用户名"
              :styles="inputStyles"
              trim="all"
              class="custom-input"
            />
          </view>
        </uni-forms-item>

        <uni-forms-item name="password" class="form-item">
          <view class="input-container">
            <uni-icons
              type="locked"
              size="18"
              color="#9CA3AF"
              class="input-icon"
            ></uni-icons>
            <uni-easyinput
              type="password"
              v-model="formData.password"
              placeholder="设置密码 (至少6位)"
              :styles="inputStyles"
              trim="all"
              class="custom-input"
            />
          </view>
        </uni-forms-item>

        <uni-forms-item name="confirmPassword" class="form-item">
          <view class="input-container">
            <uni-icons
              type="checkmarkempty"
              size="18"
              color="#9CA3AF"
              class="input-icon"
            ></uni-icons>
            <uni-easyinput
              type="password"
              v-model="formData.confirmPassword"
              placeholder="确认密码"
              :styles="inputStyles"
              trim="all"
              class="custom-input"
            />
          </view>
        </uni-forms-item>

        <uni-forms-item name="contactInfo" class="form-item">
          <view class="input-container">
            <uni-icons
              type="email"
              size="18"
              color="#9CA3AF"
              class="input-icon"
            ></uni-icons>
            <uni-easyinput
              v-model="formData.contactInfo"
              placeholder="手机号或邮箱"
              :styles="inputStyles"
              trim="all"
              class="custom-input"
            />
          </view>
        </uni-forms-item>
      </uni-forms>

      <!-- 注册按钮 -->
      <button
        class="register-button"
        :class="{ 'button-loading': isLoading }"
        @click="handleRegister"
        :loading="isLoading"
      >
        <text v-if="!isLoading">注册并登录</text>
        <text v-else>注册中...</text>
      </button>

      <!-- 分割线 -->
      <view class="divider">
        <view class="divider-line"></view>
        <text class="divider-text">或</text>
        <view class="divider-line"></view>
      </view>

      <!-- 登录链接 -->
      <view class="login-section">
        <text class="login-text">已有账号？</text>
        <text class="login-link" @click="goToLogin">立即登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from "vue";
import { register, login, getUserInfo } from "@/services/api.js";
import store from "@/store";
import { RoutePath, reLaunch, navigateTo } from "@/utils/router.js";

const formRef = ref(null);
const isLoading = ref(false);

const formData = reactive({
  username: "",
  password: "",
  confirmPassword: "",
  contactInfo: "",
});

const inputStyles = {
  borderColor: "transparent",
  color: "#1f2937",
  backgroundColor: "transparent",
  borderRadius: "0",
  height: "40px",
};

// 自定义验证函数，用于检查两次密码是否一致
const validatePasswordMatch = (rule, value, data, callback) => {
  if (value !== formData.password) {
    callback("两次输入的密码不一致");
  } else {
    callback();
  }
};

const rules = {
  username: {
    rules: [{ required: true, errorMessage: "请输入用户名" }],
  },
  password: {
    rules: [
      { required: true, errorMessage: "请输入密码" },
      { minLength: 6, errorMessage: "密码长度至少为6位" },
    ],
  },
  confirmPassword: {
    rules: [
      { required: true, errorMessage: "请再次输入密码" },
      { validateFunction: validatePasswordMatch },
    ],
  },
  contactInfo: {
    rules: [
      { required: true, errorMessage: "请输入联系方式" },
      {
        pattern:
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$|^1[3-9]\d{9}$/,
        errorMessage: "请输入正确的手机号或邮箱格式",
      },
    ],
  },
};

const handleRegister = async () => {
  try {
    const values = await formRef.value.validate();
    isLoading.value = true;

    // 1. 注册
    await register({
      username: values.username,
      password: values.password,
      contactInfo: values.contactInfo,
    });

    uni.showToast({ title: "注册成功！正在为您自动登录...", icon: "none" });

    // 2. 自动登录
    const loginRes = await login({
      username: values.username,
      password: values.password,
    });

    if (loginRes.token) {
      store.commit("setToken", loginRes.token);
      const userInfo = await getUserInfo(loginRes.userId);
      store.commit("setUser", { ...userInfo, userId: loginRes.userId });

      uni.showToast({ title: "登录成功", icon: "success" });
      reLaunch(RoutePath.HOME);
    }
  } catch (err) {
    console.error("Registration or auto-login failed:", err);
  } finally {
    isLoading.value = false;
  }
};

const goToLogin = () => {
  navigateTo(RoutePath.LOGIN);
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff9a8b 0%, #a8edea 50%, #fed6e3 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60rpx 30rpx;
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
}

.circle-1 {
  width: 200rpx;
  height: 200rpx;
  top: 15%;
  right: -50rpx;
  animation: float 6s ease-in-out infinite;
}

.circle-2 {
  width: 150rpx;
  height: 150rpx;
  top: 65%;
  left: -30rpx;
  animation: float 4s ease-in-out infinite reverse;
}

.circle-3 {
  width: 120rpx;
  height: 120rpx;
  top: 35%;
  left: 25%;
  animation: float 5s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
}

/* 注册卡片 */
.register-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 50rpx 60rpx 40rpx;
  width: 100%;
  max-width: 680rpx;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
  margin-bottom: 40rpx;
}

.logo-container {
  width: 90rpx;
  height: 90rpx;
  background: rgba(255, 122, 69, 0.1);
  border-radius: 50%;
  margin: 0 auto 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 122, 69, 0.2);
}

.welcome-title {
  font-size: 42rpx;
  font-weight: 700;
  color: #1f2937;
  display: block;
  margin-bottom: 8rpx;
}

.welcome-subtitle {
  font-size: 26rpx;
  color: #6b7280;
  display: block;
}

/* 表单样式 */
.form-section {
  margin-bottom: 20rpx;
}

.form-item {
  margin-bottom: 24rpx;
}

.input-container {
  position: relative;
  background: #f8fafc;
  border-radius: 12rpx;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  min-height: 76rpx;
}

.input-container:focus-within {
  border-color: #ff7a45;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(255, 122, 69, 0.1);
}

.input-icon {
  margin-right: 20rpx;
  flex-shrink: 0;
}

.custom-input {
  flex: 1;
}

/* 注册按钮 */
.register-button {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #ff8c00 0%, #ff7a45 100%);
  color: white;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  box-shadow: 0 6px 16px rgba(255, 140, 0, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.register-button::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.5s ease;
}

.register-button:active {
  transform: translateY(2px);
  box-shadow: 0 3px 8px rgba(255, 140, 0, 0.3);
}

.register-button:active::before {
  left: 100%;
}

.button-loading {
  opacity: 0.8;
  pointer-events: none;
}

/* 分割线 */
.divider {
  display: flex;
  align-items: center;
  margin: 32rpx 0 28rpx;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.divider-text {
  margin: 0 20rpx;
  font-size: 24rpx;
  color: #9ca3af;
}

/* 登录区域 */
.login-section {
  text-align: center;
}

.login-text {
  font-size: 28rpx;
  color: #6b7280;
  margin-right: 8rpx;
}

.login-link {
  font-size: 28rpx;
  color: #ff7a45;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.3s ease;
}

.login-link:active {
  color: #ff5a1f;
}

/* 响应式调整 */
@media screen and (max-width: 750rpx) {
  .register-card {
    margin: 0;
    padding: 45rpx 50rpx 35rpx;
    max-width: 100%;
  }
}
</style>
