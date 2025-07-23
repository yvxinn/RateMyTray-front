<template>
  <view class="edit-profile-container">
    <!-- Loading State -->
    <view v-if="isLoading" class="loading-container">
      <uni-icons type="spinner-cycle" size="40" color="#2563eb" />
      <text class="loading-text">加载中...</text>
    </view>

    <!-- Edit Form -->
    <view v-else class="edit-form">
      <!-- Avatar Section -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">头像</text>
        </view>
        <view class="avatar-section">
          <view class="avatar-container" @click="selectAvatar">
            <image :src="avatarSrc" class="avatar-image" mode="aspectFill" />
            <view class="avatar-overlay">
              <uni-icons type="camera" size="24" color="#fff" />
              <text class="avatar-overlay-text">更换头像</text>
            </view>
            <view v-if="isUploadingAvatar" class="upload-progress">
              <text class="upload-text">上传中...</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Basic Info Section -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">基本信息</text>
        </view>

        <view class="form-item">
          <text class="form-label">用户名</text>
          <view class="form-value readonly">
            <text class="readonly-text">{{ userInfo.username }}</text>
            <text class="readonly-hint">用户名不可修改</text>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">昵称</text>
          <input
            class="form-input"
            v-model="formData.nickname"
            placeholder="请输入昵称"
            maxlength="20"
          />
        </view>

        <view class="form-item">
          <text class="form-label">联系方式</text>
          <input
            class="form-input"
            v-model="formData.contactInfo"
            placeholder="请输入邮箱或手机号"
            maxlength="50"
          />
        </view>
      </view>

      <!-- Password Section -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">修改密码</text>
          <text class="section-subtitle">为了账户安全，建议定期修改密码</text>
        </view>

        <view class="form-item">
          <text class="form-label">当前密码</text>
          <input
            class="form-input"
            v-model="formData.oldPassword"
            placeholder="请输入当前密码"
            password
            maxlength="50"
          />
        </view>

        <view class="form-item">
          <text class="form-label">新密码</text>
          <input
            class="form-input"
            v-model="formData.newPassword"
            placeholder="请输入新密码（6-20位）"
            password
            maxlength="20"
          />
        </view>

        <view class="form-item">
          <text class="form-label">确认新密码</text>
          <input
            class="form-input"
            v-model="confirmPassword"
            placeholder="请再次输入新密码"
            password
            maxlength="20"
          />
        </view>
      </view>

      <!-- Action Buttons -->
      <view class="action-section">
        <button class="save-btn" @click="saveProfile" :disabled="isSaving">
          {{ isSaving ? "保存中..." : "保存修改" }}
        </button>

        <button class="cancel-btn" @click="goBack">取消</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { updateUserProfile, uploadFile } from "@/services/api.js";
import { useResolveImagePath } from "@/utils/useResolveImagePath.js";
import { useStore } from "vuex";

const store = useStore();

// Reactive state
const isLoading = ref(true);
const isSaving = ref(false);
const isUploadingAvatar = ref(false);
const confirmPassword = ref("");

// Get user info from store
const userInfo = computed(() => store.state.userInfo || {});

// Form data
const formData = ref({
  nickname: "",
  contactInfo: "",
  avatarUrl: "",
  oldPassword: "",
  newPassword: "",
});

// Avatar source with fallback
const avatarSrc = useResolveImagePath(
  computed(() => formData.value.avatarUrl || userInfo.value.avatarUrl),
  "/static/images/default-avatar.png"
);

onLoad(() => {
  initializeForm();
});

const initializeForm = () => {
  if (!userInfo.value.userId) {
    uni.showToast({
      title: "请先登录",
      icon: "none",
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
    return;
  }

  // Initialize form with current user data
  formData.value = {
    nickname: userInfo.value.nickname || "",
    contactInfo: userInfo.value.contactInfo || "",
    avatarUrl: userInfo.value.avatarUrl || "",
    oldPassword: "",
    newPassword: "",
  };

  isLoading.value = false;
};

const selectAvatar = async () => {
  if (isUploadingAvatar.value) return;

  try {
    const res = await uni.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
    });

    isUploadingAvatar.value = true;
    uni.showLoading({
      title: "头像上传中...",
    });

    const uploadResult = await uploadFile("avatars", res.tempFilePaths[0]);
    formData.value.avatarUrl = uploadResult.fileUrl;

    uni.showToast({
      title: "头像上传成功",
      icon: "success",
    });
  } catch (error) {
    console.error("头像上传失败:", error);
    uni.showToast({
      title: "头像上传失败",
      icon: "none",
    });
  } finally {
    uni.hideLoading();
    isUploadingAvatar.value = false;
  }
};

const validateForm = () => {
  if (!formData.value.nickname.trim()) {
    uni.showToast({
      title: "请输入昵称",
      icon: "none",
    });
    return false;
  }

  // If changing password, validate password fields
  if (formData.value.oldPassword || formData.value.newPassword) {
    if (!formData.value.oldPassword) {
      uni.showToast({
        title: "请输入当前密码",
        icon: "none",
      });
      return false;
    }

    if (!formData.value.newPassword) {
      uni.showToast({
        title: "请输入新密码",
        icon: "none",
      });
      return false;
    }

    if (formData.value.newPassword.length < 6) {
      uni.showToast({
        title: "新密码至少6位",
        icon: "none",
      });
      return false;
    }

    if (formData.value.newPassword !== confirmPassword.value) {
      uni.showToast({
        title: "两次密码输入不一致",
        icon: "none",
      });
      return false;
    }
  }

  return true;
};

const saveProfile = async () => {
  if (isSaving.value) return;

  if (!validateForm()) return;

  isSaving.value = true;
  uni.showLoading({
    title: "保存中...",
  });

  try {
    const updateData = {
      nickname: formData.value.nickname.trim(),
    };

    // Add optional fields if they have values
    if (formData.value.contactInfo.trim()) {
      updateData.contactInfo = formData.value.contactInfo.trim();
    }

    if (
      formData.value.avatarUrl &&
      formData.value.avatarUrl !== userInfo.value.avatarUrl
    ) {
      updateData.avatarUrl = formData.value.avatarUrl;
    }

    // Add password fields if changing password
    if (formData.value.oldPassword && formData.value.newPassword) {
      updateData.oldPassword = formData.value.oldPassword;
      updateData.newPassword = formData.value.newPassword;
    }

    await updateUserProfile(userInfo.value.userId, updateData);

    // Update store with new user info
    const updatedUser = {
      ...userInfo.value,
      nickname: updateData.nickname,
      contactInfo: updateData.contactInfo || userInfo.value.contactInfo,
      avatarUrl: updateData.avatarUrl || userInfo.value.avatarUrl,
    };

    store.commit("setUser", updatedUser);

    uni.showToast({
      title: "保存成功",
      icon: "success",
    });

    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error) {
    console.error("保存个人信息失败:", error);
    uni.showToast({
      title: error.message || "保存失败，请重试",
      icon: "none",
    });
  } finally {
    uni.hideLoading();
    isSaving.value = false;
  }
};

const goBack = () => {
  uni.navigateBack();
};
</script>

<style scoped>
.edit-profile-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding: 20rpx;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: 20rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

.edit-form {
  padding-bottom: 120rpx;
}

.section {
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-header {
  padding: 30rpx;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  display: block;
}

.section-subtitle {
  font-size: 24rpx;
  color: #666;
  margin-top: 8rpx;
  display: block;
}

/* Avatar Section */
.avatar-section {
  padding: 40rpx;
  display: flex;
  justify-content: center;
}

.avatar-container {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.avatar-container:active {
  transform: scale(0.95);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-container:hover .avatar-overlay,
.avatar-container:active .avatar-overlay {
  opacity: 1;
}

.avatar-overlay-text {
  color: #fff;
  font-size: 22rpx;
  margin-top: 8rpx;
}

.upload-progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.upload-text {
  color: #fff;
  font-size: 24rpx;
  font-weight: 600;
}

/* Form Items */
.form-item {
  padding: 30rpx;
  border-bottom: 1px solid #f8f9fa;
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #374151;
  display: block;
  margin-bottom: 16rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  background-color: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  border-color: #2563eb;
  background-color: #fff;
}

.form-value.readonly {
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  min-height: 80rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.readonly-text {
  font-size: 28rpx;
  color: #333;
  display: block;
}

.readonly-hint {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}

/* Action Section */
.action-section {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #fff;
  padding: 30rpx;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 20rpx;
  box-sizing: border-box;
  z-index: 999;
}

.save-btn {
  flex: 2;
  height: 80rpx;
  background-color: #2563eb;
  color: #fff;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  transition: background-color 0.3s ease;
}

.save-btn:active {
  background-color: #1d4ed8;
}

.save-btn:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.cancel-btn {
  flex: 1;
  height: 80rpx;
  background-color: #f8f9fa;
  color: #666;
  border: 1px solid #e5e7eb;
  border-radius: 12rpx;
  font-size: 30rpx;
  transition: all 0.3s ease;
}

.cancel-btn:active {
  background-color: #e5e7eb;
  color: #374151;
}

.save-btn::after,
.cancel-btn::after {
  border: none;
}
</style>
