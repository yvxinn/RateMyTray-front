<template>
  <view class="detail-container">
    <!-- Skeleton Loading -->
    <view v-if="isLoading" class="skeleton-wrapper">
      <view class="skeleton-header-image"></view>
      <view class="skeleton-content">
        <view class="skeleton-title"></view>
        <view class="skeleton-line" v-for="n in 3" :key="n"></view>
      </view>
    </view>

    <!-- Real Content -->
    <scroll-view v-else-if="window" scroll-y class="scroll-view">
      <!-- Header with Parallax Image -->
      <view class="header-image-container">
        <image
          class="header-image"
          :src="resolveImagePath(window.coverImageUrl)"
          mode="aspectFill"
        />
      </view>

      <view class="content-wrapper">
        <!-- Desktop Layout Wrapper -->
        <view class="desktop-layout-wrapper">
          <!-- Left Column (Info + Dishes) -->
          <view class="left-column">
            <!-- Updated Info Section -->
            <view class="info-section">
              <text class="window-name">{{ window.windowName }}</text>
              <view class="info-row">
                <uni-icons type="star-filled" color="#f59e0b" size="18" />
                <text class="rating-text">{{
                  window.averageRating
                    ? window.averageRating.toFixed(1)
                    : "暂无评分"
                }}</text>
                <text class="rating-count"
                  >({{ window.ratingCount || 0 }}评)</text
                >
              </view>
              <view class="info-row">
                <uni-icons type="location" color="#6b7280" size="18" />
                <text>{{ window.canteenName }}{{ window.floor }}楼</text>
              </view>
              <view class="info-row">
                <uni-icons type="notification" color="#6b7280" size="18" />
                <text
                  :class="[
                    'status',
                    window.status === 'open' ? 'status-open' : 'status-closed',
                  ]"
                >
                  {{
                    window.status === "open"
                      ? `营业中 ${formatBusinessHours(window.businessHours)}`
                      : "休息中"
                  }}
                </text>
              </view>

              <!-- Merchant Info (暂时注释，因为API没有返回merchant对象) -->
              <!-- <view v-if="window.merchant" class="merchant-info-box">
                <image
                  class="merchant-avatar"
                  :src="resolveImagePath(window.merchant.avatarUrl, true)"
                  mode="aspectFill"
                />
                <view class="merchant-details">
                  <text class="merchant-name">{{ window.merchant.username }}</text>
                  <text class="merchant-contact">{{ window.merchant.contactInfo }}</text>
                </view>
              </view> -->

              <!-- Merchant Contact Info -->
              <view class="merchant-info-box">
                <uni-icons type="phone" color="#6b7280" size="18" />
                <text class="merchant-phone">{{ window.phoneNumber }}</text>
              </view>

              <!-- Announcement -->
              <view v-if="window.announcement" class="announcement-box">
                <uni-icons type="sound" color="#2563eb" size="18" />
                <text class="announcement-text">{{ window.announcement }}</text>
              </view>
            </view>

            <!-- Tabs for Mobile -->
            <view class="tabs-container">
              <view
                :class="['tab-item', currentTab === 0 ? 'active' : '']"
                @click="currentTab = 0"
              >
                菜品列表 ({{ window.dishes.length }})
              </view>
              <view
                :class="['tab-item', currentTab === 1 ? 'active' : '']"
                @click="currentTab = 1"
              >
                用户评价 ({{ window.comments.length }})
              </view>
            </view>

            <!-- Dishes (始终在左栏显示或作为移动端Tab内容) -->
            <view class="tab-content" v-show="currentTab === 0">
              <view v-if="window.dishes && window.dishes.length > 0">
                <DishCard
                  v-for="dish in window.dishes"
                  :key="dish.dishId"
                  :dish="dish"
                />
              </view>
              <view v-else class="empty-state">暂无菜品信息</view>
            </view>
          </view>

          <!-- Right Column (Comments) -->
          <view class="right-column">
            <view class="comments-section-title"
              >用户评价 ({{ window.comments.length }})</view
            >
            <view v-if="window.comments && window.comments.length > 0">
              <CommentCard
                v-for="comment in window.comments"
                :key="comment.commentId"
                :comment="comment"
              />
            </view>
            <view v-else class="empty-state">暂无用户评价</view>
          </view>
        </view>

        <!-- Comments as Tab Content for Mobile -->
        <view class="tab-content" v-show="currentTab === 1">
          <view v-if="window.comments && window.comments.length > 0">
            <CommentCard
              v-for="comment in window.comments"
              :key="comment.commentId"
              :comment="comment"
            />
          </view>
          <view v-else class="empty-state">暂无用户评价</view>
        </view>
      </view>
    </scroll-view>

    <!-- Error/Not Found State -->
    <view v-else class="empty-state">
      <text>未找到窗口信息或加载失败</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getWindowDetail } from "@/services/api.js";
import DishCard from "@/components/DishCard.vue";
import CommentCard from "@/components/CommentCard.vue";
import { useResolveImagePath } from "@/utils/useResolveImagePath.js";

const windowId = ref(null);
const window = ref(null);
const isLoading = ref(true);
const currentTab = ref(0); // 0 for dishes, 1 for comments

const resolveImagePath = (path, isAvatar = false) => {
  const defaultImage = isAvatar
    ? "/static/images/default-avatar.png"
    : "/static/images/default-cover.png";
  return useResolveImagePath(path, defaultImage).value;
};

// 格式化营业时间
const formatBusinessHours = (businessHours) => {
  if (!businessHours) return "";
  try {
    const hours = JSON.parse(businessHours);
    const today = new Date().getDay();
    const isWeekend = today === 0 || today === 6;
    return isWeekend ? hours["sat-sun"] || "" : hours["mon-fri"] || "";
  } catch {
    return businessHours; // 如果解析失败，直接返回原字符串
  }
};

onLoad((options) => {
  if (options.id) {
    windowId.value = options.id;
    fetchWindowDetails();
  } else {
    isLoading.value = false;
    uni.showToast({
      title: "无效的窗口ID",
      icon: "none",
    });
  }
});

const fetchWindowDetails = async () => {
  isLoading.value = true;
  try {
    const data = await getWindowDetail(windowId.value);

    // The API is expected to return the full data structure including
    // merchant, announcement, and tags within dishes.
    // No more mocking is needed.

    // Separate official replies from user comments for proper display
    if (data.comments && Array.isArray(data.comments)) {
      const userComments = data.comments.filter((c) => !c.isOfficialReply);
      const replies = data.comments.filter((c) => c.isOfficialReply);

      userComments.forEach((comment) => {
        comment.reply = replies.find((r) => r.parentId === comment.commentId);
      });

      data.comments = userComments;
    }

    window.value = data;
  } catch (error) {
    console.error("Failed to fetch window details:", error);
    uni.showToast({
      title: "加载失败，请稍后重试",
      icon: "none",
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.detail-container {
  background-color: #f7f8fa;
  min-height: 100vh;
}
.scroll-view {
  height: 100vh;
}
.header-image-container {
  height: 400rpx;
  overflow: hidden;
  position: relative;
}
.header-image {
  width: 100%;
  height: 100%;
}
.content-wrapper {
  background-color: #f7f8fa;
  border-radius: 32rpx 32rpx 0 0;
  margin-top: -32rpx;
  position: relative;
  padding: 30rpx;
}
.info-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 30rpx;
  padding-bottom: 10rpx;
}
.window-name {
  font-size: 44rpx;
  font-weight: 700;
  margin-bottom: 24rpx;
}
.info-row {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #4b5563;
  margin-bottom: 12rpx;
}
.info-row .uni-icons {
  margin-right: 12rpx;
}
.rating-text {
  font-weight: 600;
  color: #f59e0b;
}
.rating-count {
  margin-left: 8rpx;
  color: #6b7280;
  font-size: 26rpx;
}
.status-open {
  color: #059669;
}
.status-closed {
  color: #dc2626;
}

.tabs-container {
  display: flex;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  overflow: hidden;
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 24rpx;
  font-size: 30rpx;
  color: #6b7280;
  transition: all 0.3s;
  position: relative;
}
.tab-item.active {
  color: #1d4ed8;
  font-weight: 600;
}
.tab-item.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40%;
  height: 6rpx;
  background-color: #1d4ed8;
  border-radius: 3rpx;
}
.tab-content {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 0 30rpx;
}
.empty-state {
  text-align: center;
  color: #9ca3af;
  padding: 80rpx 0;
}
/* Skeleton Styles */
.skeleton-wrapper {
  padding: 30rpx;
}
.skeleton-header-image {
  height: 400rpx;
  background-color: #e5e7eb;
  border-radius: 16rpx;
}
.skeleton-content {
  margin-top: 30rpx;
}
.skeleton-title {
  width: 60%;
  height: 40rpx;
  background-color: #e5e7eb;
  border-radius: 8rpx;
  margin-bottom: 30rpx;
}
.skeleton-line {
  width: 100%;
  height: 24rpx;
  background-color: #e5e7eb;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}
.skeleton-line:last-child {
  width: 80%;
}

/* Desktop Layout Styles */
@media (min-width: 768px) {
  .desktop-layout-wrapper {
    display: flex;
    gap: 30rpx;
    align-items: flex-start;
  }

  .left-column {
    flex: 3;
    min-width: 0;
  }

  .right-column {
    flex: 2;
    min-width: 0;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.05);
  }

  .comments-section-title {
    font-size: 34rpx;
    font-weight: 600;
    margin-bottom: 20rpx;
    padding-bottom: 20rpx;
    border-bottom: 1px solid #f0f0f0;
  }

  /* Hide mobile-only elements on desktop */
  .tabs-container,
  .content-wrapper .tab-content[v-show="currentTab === 1"] {
    display: none;
  }

  /* Ensure dish list is always visible on desktop */
  .left-column .tab-content {
    display: block !important; /* Overrides v-show */
    padding: 0;
  }

  .left-column .tab-content .empty-state {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 80rpx 0;
  }
}

.merchant-info-box {
  display: flex;
  align-items: center;
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1px solid #f3f4f6;
}
.merchant-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}
.merchant-details {
  display: flex;
  flex-direction: column;
}
.merchant-name {
  font-size: 30rpx;
  font-weight: 600;
}
.merchant-contact {
  font-size: 26rpx;
  color: #6b7280;
}
.merchant-phone {
  margin-left: 12rpx;
  font-size: 28rpx;
  color: #4b5563;
}

.announcement-box {
  display: flex;
  align-items: center;
  background-color: #eff6ff;
  color: #1e40af;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-top: 24rpx;
}
.announcement-text {
  font-size: 26rpx;
  margin-left: 12rpx;
}
</style>
