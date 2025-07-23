<template>
  <view class="notifications-container">
    <scroll-view
      scroll-y
      class="notification-list-scroll"
      @scrolltolower="loadMore"
    >
      <view v-if="loading && notifications.length === 0" class="loading-state"
        >加载中...</view
      >
      <view v-else-if="notifications.length === 0 && !loading" class="no-data"
        >暂无消息通知</view
      >
      <view
        class="notification-card"
        v-for="notification in notifications"
        :key="notification.notificationId"
        :class="{ 'is-read': notification.read }"
        @click="handleMarkAsRead(notification)"
      >
        <view class="card-header">
          <text class="notification-type">{{
            notificationTypeMap[notification.type] || "系统通知"
          }}</text>
          <text class="notification-time">{{
            formatTime(notification.timestamp)
          }}</text>
        </view>
        <text class="notification-content">{{ notification.content }}</text>
        <view v-if="!notification.read" class="unread-dot"></view>
      </view>
      <view v-if="loading && notifications.length > 0" class="loading-more"
        >加载中...</view
      >
      <view v-if="!hasMore && notifications.length > 0" class="no-more"
        >没有更多了</view
      >
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getNotifications, markNotificationAsRead } from "@/services/api.js";

const notifications = ref([]);
const page = ref(1);
const size = ref(15);
const loading = ref(false);
const hasMore = ref(true);

const notificationTypeMap = {
  commentLiked: "评论点赞",
  merchantReply: "商家回复",
  systemNotice: "系统公告",
  rectifyNotice: "整改通知",
};

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

onShow(() => {
  resetAndGetNotifications();
});

const resetAndGetNotifications = () => {
  page.value = 1;
  notifications.value = [];
  hasMore.value = true;
  getNotificationsList();
};

const getNotificationsList = async () => {
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const res = await getNotifications({
      page: page.value,
      size: size.value,
    });
    // Assuming API returns { notifications: [], pages: number }
    if (res.notifications && res.notifications.length > 0) {
      notifications.value.push(...res.notifications);
      page.value++;
      hasMore.value = page.value <= res.pages;
    } else {
      hasMore.value = false;
    }
  } catch (error) {
    console.error("获取通知列表失败:", error);
    uni.showToast({
      title: "获取通知失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  getNotificationsList();
};

const handleMarkAsRead = async (notification) => {
  if (notification.read) return;
  try {
    await markNotificationAsRead(notification.notificationId);
    notification.read = true; // Optimistic update
  } catch (error) {
    console.error("标记已读失败:", error);
  }
};
</script>

<style>
.notifications-container {
  padding: 20rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.notification-list-scroll {
  height: calc(100vh - 40rpx);
}

.notification-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 25rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  border-left: 10rpx solid #007aff;
  transition: all 0.2s ease-in-out;
  position: relative; /* For unread dot */
}

.notification-card.is-read {
  border-left-color: #e0e0e0;
  opacity: 0.8;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.notification-type {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.notification-time {
  font-size: 26rpx;
  color: #999;
}

.notification-content {
  font-size: 30rpx;
  color: #555;
  line-height: 1.5;
}

.unread-dot {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  width: 20rpx;
  height: 20rpx;
  background-color: #dc3545; /* Red dot for unread */
  border-radius: 50%;
}

.no-data,
.loading-more,
.no-more,
.loading-state {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 30rpx;
}
</style>
