<template>
  <view class="notifications-page">
    <!-- 导航栏 -->
    <uni-nav-bar
      title="消息通知"
      :border="false"
      background-color="#fff"
      color="#333"
      :fixed="true"
      :status-bar="true"
    />

    <!-- 统计信息 -->
    <view class="stats-section">
      <view class="stats-card">
        <text class="stats-title">消息数量</text>
        <text class="stats-count">{{ notifications.length }}</text>
      </view>
      <view class="stats-card">
        <text class="stats-title">最新更新</text>
        <text class="stats-time">{{ lastUpdateTime }}</text>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <view class="content-wrapper">
      <!-- 加载状态 -->
      <view v-if="isLoading" class="loading-container">
        <uni-load-more status="loading" />
      </view>

      <!-- 空状态 -->
      <view v-else-if="notifications.length === 0" class="empty-state">
        <image
          src="/static/images/empty-notifications.png"
          class="empty-image"
          mode="aspectFit"
        />
        <text class="empty-title">暂无消息</text>
        <text class="empty-desc">您目前没有任何通知消息</text>
      </view>

      <!-- 通知列表 -->
      <view v-else class="notifications-list">
        <NotificationCard
          v-for="notification in notifications"
          :key="notification.notificationId"
          :notification="notification"
          :show-actions="false"
          @click="handleNotificationClick"
        />
      </view>

      <!-- 下拉刷新提示 -->
      <view class="refresh-tip"> 下拉可以刷新消息 </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { onShow, onPullDownRefresh, onReachBottom } from "@dcloudio/uni-app";
import { getNotifications } from "@/services/api.js";
import NotificationCard from "@/components/NotificationCard.vue";

// 响应式数据
const notifications = ref([]);
const isLoading = ref(false);

// 计算属性
const lastUpdateTime = computed(() => {
  if (notifications.value.length === 0) return "暂无";

  const latestNotification = notifications.value.reduce((latest, current) => {
    const latestTime = new Date(latest.timestamp);
    const currentTime = new Date(current.timestamp);
    return currentTime > latestTime ? current : latest;
  });

  const date = new Date(latestNotification.timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;

  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}-${day}`;
});

// 获取通知列表
const fetchNotifications = async () => {
  try {
    isLoading.value = true;
    const response = await getNotifications();

    // 后端返回消息列表
    const notificationList = response || [];

    // 统计未读消息数量（在标记为已读之前）
    const unreadCount = notificationList.filter(
      (notification) => !notification.read
    ).length;

    // 确保所有通知都标记为已读（因为后端会自动标记）
    notifications.value = notificationList.map((notification) => ({
      ...notification,
      read: true,
    }));

    // 只有在有未读消息时才显示提示
    if (unreadCount > 0) {
      uni.showToast({
        title: `获取到 ${unreadCount} 条新消息`,
        icon: "success",
        duration: 1500,
      });
    }
  } catch (error) {
    console.error("获取通知列表失败:", error);
    uni.showToast({
      title: error.message || "获取通知失败",
      icon: "none",
    });
    notifications.value = [];
  } finally {
    isLoading.value = false;
    // 停止下拉刷新动画
    uni.stopPullDownRefresh();
  }
};

// 处理通知点击
const handleNotificationClick = (notification) => {
  // 根据通知类型执行不同的跳转逻辑
  // 这里可以根据实际需求添加页面跳转
  console.log("点击通知:", notification);

  // 可以根据通知类型进行不同的处理
  switch (notification.type) {
    case "merchantReply":
      // 跳转到相关评论页面
      break;
    case "commentLiked":
      // 跳转到评论详情
      break;
    case "systemNotice":
      // 显示系统公告详情
      break;
    default:
      console.log("未处理的通知类型:", notification.type);
  }
};

// 页面生命周期
onMounted(() => {
  fetchNotifications();
});

onShow(() => {
  // 每次页面显示时刷新数据
  fetchNotifications();
});

// 下拉刷新
onPullDownRefresh(() => {
  fetchNotifications();
});

// 触底加载更多（如果后续需要分页）
onReachBottom(() => {
  // 当前API不支持分页，暂时不处理
});
</script>

<style scoped>
.notifications-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.stats-section {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 32rpx;
  margin-top: 88rpx; /* 为导航栏留出空间 */
}

.stats-card {
  flex: 1;
  background: #fff;
  padding: 24rpx;
  border-radius: 16rpx;
  text-align: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.stats-title {
  display: block;
  font-size: 26rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.stats-count {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.stats-time {
  display: block;
  font-size: 24rpx;
  color: #007aff;
  font-weight: 500;
}

.content-wrapper {
  padding: 0 32rpx 32rpx;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 120rpx 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
  text-align: center;
}

.empty-image {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 32rpx;
  opacity: 0.6;
}

.empty-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #999;
  line-height: 1.5;
}

.notifications-list {
  display: flex;
  flex-direction: column;
}

.refresh-tip {
  text-align: center;
  padding: 32rpx 0;
  color: #999;
  font-size: 24rpx;
}
</style>
