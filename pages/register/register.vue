<template>
  <view class="register-container">
    <view class="hero-section">
      <text class="title">创建您的 小众点评 账户</text>
      <text class="subtitle">仅需一步，开启美食之旅</text>
    </view>

    <uni-forms
      ref="formRef"
      :modelValue="formData"
      :rules="rules"
      class="form-section"
    >
      <uni-forms-item name="username">
        <uni-easyinput
          prefixIcon="person-add"
          v-model="formData.username"
          placeholder="设置一个独特的用户名"
          :styles="inputStyles"
          trim="all"
        />
      </uni-forms-item>
      <uni-forms-item name="password">
        <uni-easyinput
          prefixIcon="locked"
          type="password"
          v-model="formData.password"
          placeholder="设置您的密码 (至少6位)"
          :styles="inputStyles"
          trim="all"
        />
      </uni-forms-item>
      <uni-forms-item name="confirmPassword">
        <uni-easyinput
          prefixIcon="locked"
          type="password"
          v-model="formData.confirmPassword"
          placeholder="请再次确认密码"
          :styles="inputStyles"
          trim="all"
        />
      </uni-forms-item>
      <uni-forms-item name="contactInfo">
        <uni-easyinput
          prefixIcon="email"
          v-model="formData.contactInfo"
          placeholder="请输入手机号或邮箱"
          :styles="inputStyles"
          trim="all"
        />
      </uni-forms-item>
    </uni-forms>

    <button
      class="register-button"
      @click="handleRegister"
      :loading="isLoading"
    >
      注册并登录
    </button>

    <view class="footer-links">
      <text class="link" @click="goToLogin">已有账号？直接登录</text>
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
  borderColor: "#e5e7eb",
  color: "#1f2937",
  backgroundColor: "#f9fafb",
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
      password: values.password, // 直接使用原始密码
      contactInfo: values.contactInfo,
    });

    uni.showToast({ title: "注册成功！正在为您自动登录...", icon: "none" });

    // 2. 自动登录
    const loginRes = await login({
      username: values.username,
      password: values.password, // 直接使用原始密码
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
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0 60rpx;
  background: linear-gradient(180deg, #f3f4f6 0%, #ffffff 100%);
}

.hero-section {
  text-align: center;
  padding-top: 100rpx;
  padding-bottom: 70rpx;
}

.title {
  font-size: 48rpx;
  font-weight: 700;
  color: #111827;
}

.subtitle {
  font-size: 30rpx;
  color: #6b7280;
  margin-top: 16rpx;
}

.form-section {
  margin-bottom: 30rpx;
}

.register-button {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 24rpx;
  background-color: #ff8c00; /* 注册使用稍亮的橙色 */
  color: white;
  font-size: 34rpx;
  font-weight: 500;
  border: none;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transition: background-color 0.3s;
}

.register-button:active {
  background-color: #ff7a45;
}

.footer-links {
  text-align: center;
  margin-top: 40rpx;
}

.link {
  font-size: 28rpx;
  color: #ff7a45; /* 主题橙色 */
  cursor: pointer;
}
</style>
