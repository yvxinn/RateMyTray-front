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
                用户评价 ({{ windowComments.length }})
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
              >用户评价 ({{ windowComments.length }})</view
            >

            <CommentCard
              v-for="comment in windowComments"
              :key="comment.commentId"
              :comment="comment"
              @refreshComments="fetchWindowDetails"
              v-if="windowComments.length > 0"
            />
            <view v-if="windowComments.length === 0" class="empty-state"
              >暂无用户评价</view
            >
          </view>
        </view>

        <!-- Comments as Tab Content for Mobile -->
        <view class="tab-content" v-show="currentTab === 1">
          <CommentCard
            v-for="comment in windowComments"
            :key="comment.commentId"
            :comment="comment"
            @refreshComments="fetchWindowDetails"
            v-if="windowComments.length > 0"
          />
          <view v-if="windowComments.length === 0" class="empty-state"
            >暂无用户评价</view
          >
        </view>
      </view>
    </scroll-view>

    <!-- Error/Not Found State -->
    <view v-else class="empty-state">
      <text>未找到窗口信息或加载失败</text>
    </view>

    <!-- Floating Action Buttons -->
    <view v-if="windowId" class="fab-container">
      <!-- Favorite Button -->
      <button
        class="fab-button fab-favorite"
        :class="{ favorited: isFavorited }"
        @click="toggleFavorite"
        :loading="isFavoriteLoading"
      >
        <uni-icons
          :type="isFavorited ? 'heart-filled' : 'heart'"
          :color="isFavorited ? '#ff4757' : '#fff'"
          size="24"
        />
      </button>

      <!-- Comment Button -->
      <button class="fab-button fab-comment" @click="toggleQuickComment">
        <uni-icons type="chatboxes" color="#fff" size="24" />
      </button>

      <!-- Report Button -->
      <button class="fab-button fab-report" @click="openWindowReportModal">
        <uni-icons type="flag" color="#fff" size="24" />
      </button>
    </view>

    <!-- 举报弹窗 -->
    <ReportModal
      ref="windowReportModal"
      content-type="window"
      :content-id="windowId"
      :target-name="window?.windowName"
      @success="handleReportSuccess"
    />

    <!-- Quick Comment Panel -->
    <view
      v-if="showQuickComment"
      class="quick-comment-overlay"
      @click="cancelQuickComment"
    >
      <view class="quick-comment-panel" @click.stop>
        <view class="quick-comment-header">
          <text class="quick-comment-title">快速评价</text>
          <uni-icons
            type="closeempty"
            size="20"
            color="#999"
            @click="cancelQuickComment"
          />
        </view>

        <view class="rating-section">
          <text class="rating-label">评分：</text>
          <uni-rate
            v-model="quickRating"
            :value="quickRating"
            size="20"
            :max="5"
            :disabled="false"
            @change="onRatingChange"
          />
          <text class="rating-score">{{ quickRating }}.0</text>
        </view>

        <textarea
          class="quick-comment-textarea"
          v-model="quickCommentText"
          placeholder="分享您的用餐体验..."
          maxlength="500"
          :auto-height="true"
        />

        <!-- Image Upload Section -->
        <view class="image-upload-section">
          <view class="image-gallery" v-if="selectedImages.length > 0">
            <view
              v-for="(image, index) in selectedImages"
              :key="index"
              class="image-item"
            >
              <image
                :src="image.tempPath"
                class="preview-image"
                mode="aspectFill"
              />
              <view class="image-overlay">
                <uni-icons
                  type="close"
                  size="16"
                  color="#fff"
                  @click="removeImage(index)"
                />
              </view>
              <view v-if="image.uploading" class="upload-progress">
                <text class="upload-text">上传中...</text>
              </view>
            </view>
          </view>

          <view
            class="add-image-btn"
            @click="selectImages"
            v-if="selectedImages.length < 3"
          >
            <uni-icons type="camera" size="20" color="#999" />
            <text class="add-image-text"
              >添加图片 ({{ selectedImages.length }}/3)</text
            >
          </view>
        </view>

        <view class="quick-comment-actions">
          <view class="char-count">{{ quickCommentText.length }}/500</view>
          <view class="action-buttons">
            <button class="cancel-btn" @click="cancelQuickComment">取消</button>
            <button
              class="submit-btn"
              @click="submitQuickComment"
              :disabled="!quickRating || isSubmittingQuick"
            >
              {{ isSubmittingQuick ? "提交中..." : "发布评价" }}
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import {
  getWindowDetail,
  submitComment,
  uploadFile,
  checkFavoriteStatus,
  addFavorite,
  removeFavorite,
} from "@/services/api.js";
import DishCard from "@/components/DishCard.vue";
import CommentCard from "@/components/CommentCard.vue";
import ReportModal from "@/components/ReportModal.vue";
import { useResolveImagePath } from "@/utils/useResolveImagePath.js";
import { navigateTo, RoutePath } from "@/utils/router.js";

const windowId = ref(null);
const window = ref(null);
const isLoading = ref(true);
const currentTab = ref(0); // 0 for dishes, 1 for comments

// Quick comment functionality
const showQuickComment = ref(false);
const quickRating = ref(0);
const quickCommentText = ref("");
const isSubmittingQuick = ref(false);

// 收藏相关状态
const isFavorited = ref(false);
const favoriteId = ref(null);
const isFavoriteLoading = ref(false);

// 举报相关状态
const windowReportModal = ref();

// 不再需要商家权限检查，所有用户都可以回复评论
// const isCurrentUserMerchant = computed(() => {
//   const userInfo = uni.getStorageSync('user');
//   if (!userInfo || !window.value) return false;
//
//   try {
//     const user = typeof userInfo === 'string' ? JSON.parse(userInfo) : userInfo;
//     return user.role === 'merchant' && user.userId === window.value.merchantId;
//   } catch {
//     return false;
//   }
// });

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

    // Debug: 打印返回的数据结构
    console.log("Window Detail API Response:", data);
    console.log("Comments in response:", data.comments);

    // The API is expected to return the full data structure including
    // merchant, announcement, and tags within dishes.
    // No more mocking is needed.

    // Process comments and replies for proper hierarchical display
    if (data.comments && Array.isArray(data.comments)) {
      const userComments = data.comments.filter((c) => !c.parentId); // Top-level comments
      const allReplies = data.comments.filter((c) => c.parentId); // All replies

      userComments.forEach((comment) => {
        // Find all replies to this comment
        comment.replies = allReplies.filter(
          (r) => r.parentId === comment.commentId
        );

        // Legacy support: keep the old 'reply' property for official replies
        comment.reply = comment.replies.find((r) => r.isOfficialReply);
      });

      data.comments = userComments;
    }

    window.value = data;

    // 获取收藏状态
    await checkFavoriteStatusForWindow();
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

// Computed properties for comments
const windowComments = computed(() => {
  if (!window.value?.comments || !Array.isArray(window.value.comments)) {
    return [];
  }

  // 只显示非官方回复的评论（窗口评价）
  // 如果有 targetType 字段，优先显示窗口评论；否则显示所有评论（向后兼容）
  return window.value.comments.filter((c) => {
    if (!c.isOfficialReply) {
      // 如果有 targetType 字段，只显示窗口评论
      if (c.targetType) {
        return c.targetType === "window";
      }
      // 如果没有 targetType 字段，默认显示所有非官方回复的评论
      return true;
    }
    return false;
  });
});

// 收藏相关函数
const checkFavoriteStatusForWindow = async () => {
  try {
    const result = await checkFavoriteStatus("window", windowId.value);
    isFavorited.value = result.isFavorited;
    favoriteId.value = result.favoriteId;
  } catch (error) {
    console.error("Failed to check favorite status:", error);
  }
};

const toggleFavorite = async () => {
  if (isFavoriteLoading.value) return;

  try {
    isFavoriteLoading.value = true;

    if (isFavorited.value) {
      // 取消收藏
      await removeFavorite(favoriteId.value);
      isFavorited.value = false;
      favoriteId.value = null;
      uni.showToast({
        title: "已取消收藏",
        icon: "success",
      });
    } else {
      // 添加收藏
      const result = await addFavorite({
        targetType: "window",
        targetId: windowId.value,
      });
      isFavorited.value = true;
      favoriteId.value = result.favoriteId;
      uni.showToast({
        title: "收藏成功",
        icon: "success",
      });
    }
  } catch (error) {
    uni.showToast({
      title: error.message || "操作失败",
      icon: "none",
    });
  } finally {
    isFavoriteLoading.value = false;
  }
};

// Quick comment functions
const toggleQuickComment = () => {
  showQuickComment.value = !showQuickComment.value;
  if (showQuickComment.value) {
    // Reset form
    quickRating.value = 0;
    quickCommentText.value = "";
  }
};

const cancelQuickComment = () => {
  showQuickComment.value = false;
  quickRating.value = 0;
  quickCommentText.value = "";
  selectedImages.value = [];
};

const onRatingChange = (e) => {
  quickRating.value = e.detail.value;
};

const selectedImages = ref([]);

const selectImages = () => {
  uni.chooseImage({
    count: 3 - selectedImages.value.length, // 最多选择3张
    sizeType: ["original", "compressed"], // 可以指定是原图还是压缩图
    sourceType: ["album", "camera"], // 可以指定来源是相册还是相机
    success: (res) => {
      const tempFilePaths = res.tempFilePaths;
      tempFilePaths.forEach((path) => {
        selectedImages.value.push({ tempPath: path, uploading: false });
      });
    },
  });
};

const removeImage = (index) => {
  selectedImages.value.splice(index, 1);
};

const submitQuickComment = async () => {
  if (isSubmittingQuick.value) return;

  if (!quickRating.value) {
    uni.showToast({
      title: "请选择评分",
      icon: "none",
    });
    return;
  }

  if (!quickCommentText.value.trim() && selectedImages.value.length === 0) {
    uni.showToast({
      title: "请输入评价内容或添加图片",
      icon: "none",
    });
    return;
  }

  isSubmittingQuick.value = true;

  try {
    // 先上传图片获取URL
    const imageUrls = [];

    if (selectedImages.value.length > 0) {
      uni.showToast({
        title: "正在上传图片...",
        icon: "loading",
        duration: 2000,
      });

      for (let i = 0; i < selectedImages.value.length; i++) {
        const image = selectedImages.value[i];
        image.uploading = true;

        try {
          const uploadResult = await uploadFile("comments", image.tempPath);
          imageUrls.push(uploadResult.fileUrl);
        } catch (uploadError) {
          console.error("图片上传失败:", uploadError);
          uni.showToast({
            title: `第${i + 1}张图片上传失败`,
            icon: "none",
          });
          return;
        } finally {
          image.uploading = false;
        }
      }
    }

    // 提交评论
    const commentData = {
      targetType: "window",
      targetId: window.value.windowId,
      rating: quickRating.value,
      content: quickCommentText.value.trim(),
      imageUrls: imageUrls, // 使用上传后的图片URL
      isAnonymous: false,
    };

    await submitComment(commentData);

    uni.showToast({
      title: "评价发布成功",
      icon: "success",
    });

    // Hide comment panel and refresh data
    cancelQuickComment();
    fetchWindowDetails();
  } catch (error) {
    console.error("Quick comment submission failed:", error);
    uni.showToast({
      title: "评价发布失败，请重试",
      icon: "none",
    });
  } finally {
    isSubmittingQuick.value = false;
  }
};

const goToComment = () => {
  navigateTo(RoutePath.COMMENT, {
    targetType: "window",
    targetId: windowId.value,
  });
};

// 举报相关方法
const openWindowReportModal = () => {
  windowReportModal.value?.openModal();
};

const handleReportSuccess = () => {
  uni.showToast({
    title: "举报提交成功，我们会尽快处理",
    icon: "success",
    duration: 2000,
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

.comments-section-title {
  font-size: 34rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
  padding: 30rpx 30rpx 20rpx;
  background-color: #fff;
  border-radius: 16rpx 16rpx 0 0;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.05);
}

.fab-container {
  position: fixed;
  bottom: 60rpx;
  right: 30rpx;
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.fab-button {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.fab-button::after {
  border: none;
}

.fab-comment {
  background-color: #2563eb;
  box-shadow: 0 8rpx 16rpx rgba(37, 99, 235, 0.3);
}

.fab-favorite {
  background-color: #6b7280;
  box-shadow: 0 8rpx 16rpx rgba(107, 114, 128, 0.3);
}

.fab-favorite.favorited {
  background-color: #fff;
  box-shadow: 0 8rpx 16rpx rgba(255, 71, 87, 0.3);
  border: 2rpx solid #ff4757;
}

.fab-button:active {
  transform: scale(0.95);
}

.fab-report {
  background-color: #ff6b6b;
  box-shadow: 0 8rpx 16rpx rgba(255, 107, 107, 0.3);
}

/* Quick Comment Panel Styles */
.quick-comment-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 40rpx;
  box-sizing: border-box;
}

.quick-comment-panel {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  width: 100%;
  max-width: 600rpx;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.quick-comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1px solid #f0f0f0;
}

.quick-comment-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.rating-section {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1px solid #f0f0f0;
}

.rating-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #555;
  margin-right: 10rpx;
}

.rating-score {
  font-size: 28rpx;
  font-weight: 600;
  color: #f59e0b;
  margin-left: 10rpx;
}

.quick-comment-textarea {
  width: 100%;
  min-height: 120rpx;
  border: 1px solid #ddd;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
  margin-bottom: 20rpx;
  line-height: 1.5;
  resize: none;
  background-color: #fafafa;
}

.image-upload-section {
  margin-top: 20rpx;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1px solid #eee;
}

.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 10rpx;
}

.image-item {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  border-radius: 8rpx;
  overflow: hidden;
  background-color: #f0f0f0;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 32rpx;
  height: 32rpx;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.upload-progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;
}

.upload-text {
  color: #fff;
  font-size: 20rpx;
  font-weight: 600;
}

.add-image-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  border: 1px dashed #ccc;
  color: #999;
  font-size: 24rpx;
  cursor: pointer;
  transition: all 0.3s;
}

.add-image-btn:hover {
  background-color: #e9ecef;
  border-color: #999;
  color: #666;
}

.add-image-text {
  margin-top: 8rpx;
  font-size: 22rpx;
}

.quick-comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30rpx;
}

.char-count {
  font-size: 24rpx;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: none;
  transition: background-color 0.3s;
}

.cancel-btn:active {
  background-color: #e0e0e0;
}

.submit-btn {
  background-color: #2563eb;
  color: #fff;
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
  box-shadow: 0 4rpx 8rpx rgba(37, 99, 235, 0.3);
  transition: background-color 0.3s;
}

.submit-btn:active {
  background-color: #1d4ed8;
}

.submit-btn:disabled {
  background-color: #ccc;
  color: #888;
  cursor: not-allowed;
  box-shadow: none;
}

/* Empty State for Comments */
.right-column .empty-state {
  text-align: center;
  padding: 80rpx 30rpx;
  color: #9ca3af;
  font-size: 28rpx;
  background-color: #fff;
  border-radius: 0 0 16rpx 16rpx;
  margin-top: -1rpx;
  box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.05);
}

.tab-content .empty-state {
  text-align: center;
  padding: 60rpx 30rpx;
  color: #9ca3af;
  font-size: 28rpx;
  background-color: #fff;
  border-radius: 16rpx;
  margin-top: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}
</style>
