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

    <!-- Floating Action Buttons -->
    <view v-if="dish" class="fab-container">
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
      <button class="fab-button fab-report" @click="openDishReportModal">
        <uni-icons type="flag" color="#fff" size="24" />
      </button>
    </view>

    <!-- 举报弹窗 -->
    <ReportModal
      ref="dishReportModal"
      content-type="dish"
      :content-id="dishId"
      :target-name="dish?.name"
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
          placeholder="分享您对这道菜的评价..."
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
import { onLoad } from "@dcloudio/uni-app";
import {
  getDishDetail,
  checkFavoriteStatus,
  addFavorite,
  removeFavorite,
  submitComment,
  uploadFile,
} from "@/services/api.js";
import CommentCard from "@/components/CommentCard.vue";
import ReportModal from "@/components/ReportModal.vue";
import { useResolveImagePath } from "@/utils/useResolveImagePath.js";
import { navigateTo, RoutePath } from "@/utils/router.js";

const dishId = ref(null);
const dish = ref(null);
const isLoading = ref(true);
const currentTab = ref(0); // 0 for comments

// 收藏相关状态
const isFavorited = ref(false);
const favoriteId = ref(null);
const isFavoriteLoading = ref(false);

// 举报相关状态
const dishReportModal = ref();

// Quick comment functionality
const showQuickComment = ref(false);
const quickRating = ref(0);
const quickCommentText = ref("");
const isSubmittingQuick = ref(false);
const selectedImages = ref([]);

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

    dish.value = data;

    // 获取收藏状态
    await checkFavoriteStatusForDish();
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

// 检查收藏状态
const checkFavoriteStatusForDish = async () => {
  try {
    const result = await checkFavoriteStatus("dish", dishId.value);
    isFavorited.value = result.isFavorited;
    favoriteId.value = result.favoriteId;
  } catch (error) {
    console.error("Failed to check favorite status:", error);
  }
};

// 切换收藏状态
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
        targetType: "dish",
        targetId: dishId.value,
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
  if (!showQuickComment.value) {
    resetQuickCommentForm();
  }
};

const cancelQuickComment = () => {
  showQuickComment.value = false;
  resetQuickCommentForm();
};

const resetQuickCommentForm = () => {
  quickRating.value = 0;
  quickCommentText.value = "";
  selectedImages.value = [];
};

const onRatingChange = (event) => {
  quickRating.value = event.value;
};

const selectImages = () => {
  uni.chooseImage({
    count: 3 - selectedImages.value.length,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      const newImages = res.tempFilePaths.map((path) => ({
        tempPath: path,
        url: "",
        uploading: false,
      }));
      selectedImages.value = [...selectedImages.value, ...newImages];
      uploadImages(newImages);
    },
    fail: (error) => {
      console.error("选择图片失败:", error);
      uni.showToast({
        title: "选择图片失败",
        icon: "none",
      });
    },
  });
};

const uploadImages = async (images) => {
  for (const image of images) {
    try {
      image.uploading = true;
      const result = await uploadFile(image.tempPath);
      image.url = result.url;
      image.uploading = false;
    } catch (error) {
      console.error("图片上传失败:", error);
      image.uploading = false;
      uni.showToast({
        title: "图片上传失败",
        icon: "none",
      });
    }
  }
};

const removeImage = (index) => {
  selectedImages.value.splice(index, 1);
};

const submitQuickComment = async () => {
  if (isSubmittingQuick.value) return;

  if (quickRating.value === 0) {
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
    const uploadedImages = selectedImages.value.filter((img) => img.url);

    await submitComment({
      targetType: "dish",
      targetId: dishId.value,
      rating: quickRating.value,
      content: quickCommentText.value.trim(),
      imageUrls: uploadedImages.map((img) => img.url),
      isAnonymous: false,
    });

    uni.showToast({
      title: "评价提交成功",
      icon: "success",
    });

    // Hide quick comment panel and reset form
    showQuickComment.value = false;
    resetQuickCommentForm();

    // Refresh dish details to show new comment
    await fetchDishDetails();
  } catch (error) {
    console.error("提交评价失败:", error);
    uni.showToast({
      title: error.message || "提交失败，请重试",
      icon: "none",
    });
  } finally {
    isSubmittingQuick.value = false;
  }
};

// 举报相关方法
const openDishReportModal = () => {
  dishReportModal.value?.openModal();
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

/* Quick Comment Panel Styles */
.quick-comment-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40rpx;
  box-sizing: border-box;
}

.quick-comment-panel {
  background: #fff;
  border-radius: 24rpx;
  width: 100%;
  max-width: 600rpx;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.15);
}

.quick-comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1px solid #f0f0f0;
}

.quick-comment-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.rating-section {
  padding: 32rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  border-bottom: 1px solid #f8f9fa;
}

.rating-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.rating-score {
  font-size: 24rpx;
  color: #f59e0b;
  font-weight: 600;
  margin-left: 8rpx;
}

.quick-comment-textarea {
  margin: 32rpx;
  min-height: 120rpx;
  padding: 20rpx;
  border: 2rpx solid #f0f0f0;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
  background: #fafafa;
  width: calc(100% - 64rpx);
  box-sizing: border-box;
}

.quick-comment-textarea:focus {
  border-color: #ff9500;
  background: #fff;
}

.image-upload-section {
  padding: 0 32rpx 32rpx;
}

.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.image-item {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.image-overlay {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 32rpx;
  height: 32rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-text {
  color: #fff;
  font-size: 22rpx;
}

.add-image-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  border: 2rpx dashed #ddd;
  border-radius: 12rpx;
  gap: 8rpx;
  background: #fafafa;
}

.add-image-text {
  font-size: 22rpx;
  color: #999;
  text-align: center;
}

.quick-comment-actions {
  padding: 24rpx 32rpx;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count {
  font-size: 24rpx;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 16rpx;
}

.cancel-btn,
.submit-btn {
  padding: 16rpx 32rpx;
  border-radius: 24rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.submit-btn {
  background: #ff9500;
  color: #fff;
}

.submit-btn:disabled {
  background: #ccc;
  color: #999;
}
</style>
