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
    <scroll-view v-else-if="dish" scroll-y class="scroll-view">
      <!-- Header with Dish Image -->
      <view class="header-image-container">
        <image
          class="header-image"
          :src="resolveImagePath(dish.imageUrl)"
          mode="aspectFill"
        />
      </view>

      <view class="content-wrapper">
        <!-- Desktop Layout Wrapper -->
        <view class="desktop-layout-wrapper">
          <!-- Left Column (Dish Info) -->
          <view class="left-column">
            <!-- Dish Info Section -->
            <view class="info-section">
              <text class="dish-name">{{ dish.name }}</text>
              <view class="price-rating-row">
                <text class="dish-price"
                  >¥{{ dish.price ? dish.price.toFixed(2) : "0.00" }}</text
                >
                <view class="rating-info">
                  <uni-icons type="star-filled" color="#f59e0b" size="18" />
                  <text class="rating-text">{{
                    dish.averageRating
                      ? dish.averageRating.toFixed(1)
                      : "暂无评分"
                  }}</text>
                </view>
              </view>

              <view class="info-row">
                <uni-icons type="home" color="#6b7280" size="18" />
                <text>{{ dish.windowName }} - {{ dish.canteenName }}</text>
              </view>

              <view class="info-row">
                <uni-icons type="notification" color="#6b7280" size="18" />
                <text
                  :class="[
                    'status',
                    dish.status === 'available'
                      ? 'status-available'
                      : 'status-unavailable',
                  ]"
                >
                  {{ dish.status === "available" ? "有售" : "暂时下架" }}
                </text>
              </view>

              <!-- Description -->
              <view v-if="dish.description" class="description-section">
                <text class="description-title">菜品介绍</text>
                <text class="description-text">{{ dish.description }}</text>
              </view>

              <!-- Tags -->
              <view
                v-if="dish.tags && dish.tags.length > 0"
                class="tags-section"
              >
                <text class="tags-title">菜品标签</text>
                <view class="tags-container">
                  <text v-for="tag in dish.tags" :key="tag" class="tag-item">{{
                    tag
                  }}</text>
                </view>
              </view>
            </view>

            <!-- Tabs for Mobile -->
            <view class="tabs-container">
              <view
                :class="['tab-item', currentTab === 0 ? 'active' : '']"
                @click="currentTab = 0"
              >
                用户评价 ({{ dish.comments ? dish.comments.length : 0 }})
              </view>
            </view>

            <!-- Comments for Mobile Tab -->
            <view class="tab-content" v-show="currentTab === 0">
              <view v-if="dish.comments && dish.comments.length > 0">
                <CommentCard
                  v-for="comment in dish.comments"
                  :key="comment.commentId"
                  :comment="comment"
                  @refreshComments="fetchDishDetails"
                />
              </view>
              <view v-else class="empty-state">暂无用户评价</view>
            </view>
          </view>

          <!-- Right Column (Comments for Desktop) -->
          <view class="right-column">
            <view class="comments-section-title"
              >用户评价 ({{ dish.comments ? dish.comments.length : 0 }})</view
            >
            <view v-if="dish.comments && dish.comments.length > 0">
              <CommentCard
                v-for="comment in dish.comments"
                :key="comment.commentId"
                :comment="comment"
                @refreshComments="fetchDishDetails"
              />
            </view>
            <view v-else class="empty-state">暂无用户评价</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- Error/Not Found State -->
    <view v-else class="empty-state">
      <text>未找到菜品信息或加载失败</text>
    </view>

    <!-- Floating Action Button -->
    <view v-if="dish" class="fab-container">
      <button class="fab-button" @click="goToComment">
        <uni-icons type="chatboxes" color="#fff" size="24" />
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getDishDetail } from "@/services/api.js";
import CommentCard from "@/components/CommentCard.vue";
import { useResolveImagePath } from "@/utils/useResolveImagePath.js";
import { navigateTo, RoutePath } from "@/utils/router.js";

const dishId = ref(null);
const dish = ref(null);
const isLoading = ref(true);
const currentTab = ref(0); // 0 for comments

// 不再需要商家权限检查，所有用户都可以回复评论
// const isCurrentUserMerchant = computed(() => {
//   const userInfo = uni.getStorageSync('user');
//   if (!userInfo || !dish.value) return false;
//
//   try {
//     const user = typeof userInfo === 'string' ? JSON.parse(userInfo) : userInfo;
//     return user.role === 'merchant' && user.userId === dish.value.merchantId;
//   } catch {
//     return false;
//   }
// });

const resolveImagePath = (path, isAvatar = false) => {
  const defaultImage = isAvatar
    ? "/static/images/default-avatar.png"
    : "/static/images/default-dish.png";
  return useResolveImagePath(path, defaultImage).value;
};

onLoad((options) => {
  if (options.id) {
    dishId.value = options.id;
    fetchDishDetails();
  } else {
    isLoading.value = false;
    uni.showToast({
      title: "无效的菜品ID",
      icon: "none",
    });
  }
});

const fetchDishDetails = async () => {
  isLoading.value = true;
  try {
    const data = await getDishDetail(dishId.value);

    // Debug: 打印返回的数据结构
    console.log("Dish Detail API Response:", data);
    console.log("Comments in response:", data.comments);

    // Process comments if they exist
    if (data.comments && Array.isArray(data.comments)) {
      // 由于菜品详情API返回的评论都是针对该菜品的，所以不需要过滤 targetType
      const userComments = data.comments.filter((c) => !c.isOfficialReply);
      const replies = data.comments.filter((c) => c.isOfficialReply);

      userComments.forEach((comment) => {
        comment.reply = replies.find((r) => r.parentId === comment.commentId);
      });

      data.comments = userComments;
    }

    dish.value = data;
  } catch (error) {
    console.error("Failed to fetch dish details:", error);
    uni.showToast({
      title: "加载失败，请稍后重试",
      icon: "none",
    });
  } finally {
    isLoading.value = false;
  }
};

const goToComment = () => {
  navigateTo(RoutePath.COMMENT, {
    targetType: "dish",
    targetId: dishId.value,
  });
};
</script>

<style scoped>
.detail-container {
  background-color: #f7f8fa;
  min-height: 100vh;
  position: relative;
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
  padding-bottom: 120rpx; /* Space for FAB */
}

.info-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 30rpx;
}

.dish-name {
  font-size: 44rpx;
  font-weight: 700;
  margin-bottom: 24rpx;
  display: block;
}

.price-rating-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.dish-price {
  font-size: 36rpx;
  font-weight: 700;
  color: #dc2626;
}

.rating-info {
  display: flex;
  align-items: center;
}

.rating-text {
  font-weight: 600;
  color: #f59e0b;
  margin-left: 8rpx;
}

.rating-count {
  margin-left: 8rpx;
  color: #6b7280;
  font-size: 26rpx;
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

.status-available {
  color: #059669;
  font-weight: 600;
}

.status-unavailable {
  color: #dc2626;
  font-weight: 600;
}

.description-section,
.tags-section {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1px solid #f3f4f6;
}

.description-title,
.tags-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12rpx;
  display: block;
}

.description-text {
  font-size: 28rpx;
  color: #6b7280;
  line-height: 1.6;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-item {
  background-color: #eff6ff;
  color: #2563eb;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.tabs-container {
  display: flex;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 28rpx 0;
  font-size: 30rpx;
  background-color: #fff;
  color: #6b7280;
  border-bottom: 4rpx solid transparent;
  transition: all 0.3s ease;
}

.tab-item.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  font-weight: 600;
}

.tab-content {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.05);
}

.empty-state {
  text-align: center;
  padding: 80rpx 0;
  color: #9ca3af;
  font-size: 28rpx;
}

.fab-container {
  position: fixed;
  bottom: 60rpx;
  right: 30rpx;
  z-index: 999;
}

.fab-button {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background-color: #2563eb;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 16rpx rgba(37, 99, 235, 0.3);
}

.fab-button::after {
  border: none;
}

/* Desktop responsive styles */
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
  .content-wrapper .tab-content {
    display: none;
  }

  /* Ensure content is always visible on desktop */
  .left-column .tab-content {
    display: none !important;
  }
}

/* Skeleton Loading Styles */
.skeleton-wrapper {
  background-color: #f7f8fa;
}

.skeleton-header-image {
  height: 400rpx;
  background-color: #e5e7eb;
  animation: pulse 1.5s ease-in-out infinite alternate;
}

.skeleton-content {
  padding: 30rpx;
  background-color: #f7f8fa;
  border-radius: 32rpx 32rpx 0 0;
  margin-top: -32rpx;
}

.skeleton-title {
  height: 44rpx;
  background-color: #e5e7eb;
  border-radius: 8rpx;
  margin-bottom: 24rpx;
  animation: pulse 1.5s ease-in-out infinite alternate;
}

.skeleton-line {
  height: 28rpx;
  background-color: #e5e7eb;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
  animation: pulse 1.5s ease-in-out infinite alternate;
}

.skeleton-line:nth-child(2) {
  width: 80%;
}

.skeleton-line:nth-child(3) {
  width: 60%;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}
</style>
