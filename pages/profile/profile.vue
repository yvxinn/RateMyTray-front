<template>
  <view class="profile-container">
    <!-- User Info Header -->
    <view class="profile-header">
      <view class="avatar-wrapper">
        <image class="avatar" :src="avatarSrc" mode="aspectFill" />
      </view>
      <text class="username">{{ userInfo.nickname || userInfo.username }}</text>
      <text class="role-badge">{{ roleMap[userInfo.role] || "用户" }}</text>
      <text v-if="userInfo.contactInfo" class="contact-info">{{
        userInfo.contactInfo
      }}</text>
    </view>

    <!-- Action List -->
    <view class="action-list">
      <uni-list :border="false">
        <uni-list-item
          title="修改个人信息"
          showArrow
          clickable
          @click="navigateToEditInfo"
        />
        <uni-list-item
          title="我的收藏"
          showArrow
          clickable
          @click="navigateToFavorites"
        />
        <uni-list-item
          v-if="userInfo.role === 'merchant'"
          title="我的窗口管理"
          showArrow
          clickable
          @click="goToMerchantWindowManage"
        />
      </uni-list>
    </view>

    <view class="action-list">
      <uni-list :border="false">
        <uni-list-item
          title="退出登录"
          clickable
          @click="confirmLogout"
          :showArrow="false"
        >
          <template v-slot:footer>
            <text class="logout-text">退出</text>
          </template>
        </uni-list-item>
      </uni-list>
    </view>
  </view>
</template>

<script setup>
import { computed } from "vue";
import store from "@/store";
import { useResolveImagePath } from "@/utils/useResolveImagePath.js";
import { navigateTo, RoutePath } from "@/utils/router.js";

const userInfo = computed(() => store.state.userInfo || {});

const avatarSrc = useResolveImagePath(
  computed(() => userInfo.value.avatarUrl),
  "/static/images/default-avatar.png"
);

const roleMap = {
  student: "学生",
  merchant: "商家",
  admin: "管理员",
};

const confirmLogout = () => {
  uni.showModal({
    title: "提示",
    content: "确定要退出登录吗？",
    success: (res) => {
      if (res.confirm) {
        store.dispatch("logout");
      }
    },
  });
};

const navigateToEditInfo = () => {
  navigateTo(RoutePath.PROFILE_EDIT);
};

const navigateToFavorites = () => {
  navigateTo(RoutePath.FAVORITES);
};

const goToMerchantWindowManage = () => {
  navigateTo(RoutePath.MERCHANT_WINDOW_MANAGE);
};
</script>

<style scoped>
.profile-container {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 30rpx;
  background: linear-gradient(180deg, #ff8c00 0%, #ff7a45 100%);
  color: white;
}

.avatar-wrapper {
  position: relative;
  width: 180rpx;
  height: 180rpx;
  margin-bottom: 24rpx;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.5);
}

.username {
  font-size: 42rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.role-badge {
  font-size: 26rpx;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 6rpx 20rpx;
  border-radius: 30rpx;
}

.contact-info {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 10rpx;
}

.action-list {
  margin: 30rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.logout-text {
  color: #ef4444;
}
</style>
