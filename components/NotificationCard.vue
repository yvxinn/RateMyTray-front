<template>
  <view
    class="notification-card"
    :class="{ unread: !notification.read }"
    @click="handleClick"
  >
    <!-- 通知图标 -->
    <view class="notification-icon">
      <uni-icons
        :type="notificationIcon"
        :color="notificationColor"
        size="24"
      />
    </view>

    <!-- 通知内容 -->
    <view class="notification-content">
      <view class="notification-header">
        <text class="notification-type">{{ notificationTypeText }}</text>
        <text class="notification-time">{{ formattedTime }}</text>
      </view>
      <text class="notification-message">{{ notification.content }}</text>

      <!-- 未读指示器 -->
      <view v-if="!notification.read" class="unread-indicator"></view>
    </view>

    <!-- 操作按钮 -->
    <view class="notification-actions" v-if="showActions">
      <button
        v-if="!notification.read"
        class="mark-read-btn"
        size="mini"
        @click.stop="handleMarkAsRead"
        :loading="isMarking"
      >
        标记已读
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, toRefs } from "vue";

const emit = defineEmits(["click", "markAsRead"]);

const props = defineProps({
  notification: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.notificationId && value.type && value.content !== undefined;
    },
  },
  showActions: {
    type: Boolean,
    default: true,
  },
});

const { notification } = toRefs(props);
const isMarking = ref(false);

// 通知类型映射
const notificationTypeMap = {
  commentLiked: "评论点赞",
  merchantReply: "商家回复",
  systemNotice: "系统公告",
  rectifyNotice: "整改通知",
  newDish: "新菜品上架",
  dishStatusChange: "菜品状态变更",
  windowStatusChange: "窗口状态变更",
};

// 通知图标映射
const iconMap = {
  commentLiked: "heart-filled",
  merchantReply: "chatboxes-filled",
  systemNotice: "sound",
  rectifyNotice: "notification",
  newDish: "star",
  dishStatusChange: "gear",
  windowStatusChange: "home",
};

// 通知颜色映射
const colorMap = {
  commentLiked: "#ff4757",
  merchantReply: "#007AFF",
  systemNotice: "#f39c12",
  rectifyNotice: "#e74c3c",
  newDish: "#2ecc71",
  dishStatusChange: "#9b59b6",
  windowStatusChange: "#34495e",
};

// 计算属性
const notificationTypeText = computed(() => {
  return notificationTypeMap[notification.value.type] || "系统通知";
});

const notificationIcon = computed(() => {
  return iconMap[notification.value.type] || "notification";
});

const notificationColor = computed(() => {
  return colorMap[notification.value.type] || "#007AFF";
});

const formattedTime = computed(() => {
  if (!notification.value.timestamp) return "";

  const date = new Date(notification.value.timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  // 超过7天显示具体日期
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
});

// 事件处理
const handleClick = () => {
  emit("click", notification.value);
};

const handleMarkAsRead = async () => {
  if (isMarking.value || notification.value.read) return;

  isMarking.value = true;
  try {
    await emit("markAsRead", notification.value);
  } finally {
    isMarking.value = false;
  }
};
</script>

<style scoped>
.notification-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  position: relative;
  transition: all 0.3s ease;
}

.notification-card.unread {
  border-left: 6rpx solid #007aff;
  background: #f8f9ff;
}

.notification-card:active {
  transform: scale(0.98);
}

.notification-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 24rpx;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.notification-type {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.notification-time {
  font-size: 24rpx;
  color: #999;
}

.notification-message {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
  word-break: break-all;
}

.unread-indicator {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 12rpx;
  height: 12rpx;
  background: #ff4757;
  border-radius: 50%;
}

.notification-actions {
  display: flex;
  align-items: center;
}

.mark-read-btn {
  background: #f0f0f0;
  color: #007aff;
  border: none;
  border-radius: 16rpx;
  font-size: 22rpx;
  padding: 6rpx 12rpx;
}

.mark-read-btn:active {
  background: #e0e0e0;
}
</style>
