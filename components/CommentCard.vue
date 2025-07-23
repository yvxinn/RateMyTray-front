<template>
  <view class="comment-card">
    <view class="comment-header">
      <view class="user-info">
        <image class="avatar" :src="avatarSrc" mode="aspectFill" />
        <view class="user-details">
          <text class="user-name">{{ comment.reviewerName }}</text>
          <text class="comment-time">{{ formattedTime }}</text>
        </view>
      </view>
      <view class="rating-container">
        <uni-rate :value="comment.rating" size="16" readonly />
        <text class="rating-score">{{ comment.rating }}.0</text>
      </view>
    </view>

    <!-- Target Type Indicator -->
    <view v-if="showTargetType" class="target-type-indicator">
      <uni-icons
        :type="comment.targetType === 'dish' ? 'plate' : 'home'"
        :color="comment.targetType === 'dish' ? '#f59e0b' : '#2563eb'"
        size="14"
      />
      <text class="target-type-text">
        {{ comment.targetType === "dish" ? "菜品评价" : "窗口评价" }}
      </text>
      <text
        v-if="comment.targetType === 'dish' && comment.dishName"
        class="target-name"
      >
        - {{ comment.dishName }}
      </text>
    </view>

    <view class="comment-content">
      <text class="comment-text">{{ comment.content }}</text>

      <!-- Display comment images if they exist -->
      <view
        v-if="comment.imageUrls && comment.imageUrls.length > 0"
        class="image-gallery"
      >
        <image
          v-for="(url, index) in comment.imageUrls"
          :key="index"
          :src="resolveImagePath(url)"
          class="gallery-image"
          mode="aspectFill"
          @click="previewImage(index)"
        />
      </view>
    </view>

    <!-- Interaction Bar -->
    <view class="interaction-bar">
      <view class="interaction-left">
        <view
          class="like-section"
          :class="{ liked: isLiked }"
          @click="handleLike"
        >
          <uni-icons
            :type="isLiked ? 'heart-filled' : 'heart'"
            size="18"
            :color="isLiked ? '#ff6b6b' : '#999'"
          />
          <text class="like-count">{{ currentLikeCount }}</text>
        </view>
        <view
          class="reply-btn"
          v-if="!comment.reply && canReply"
          @click="toggleReply"
        >
          <uni-icons type="chatbubble" size="16" color="#666" />
          <text class="reply-text">回复</text>
        </view>
      </view>

      <view class="interaction-right">
        <view class="report-btn" @click="openReportModal">
          <uni-icons type="flag" size="16" color="#999" />
          <text class="report-text">举报</text>
        </view>
      </view>
    </view>

    <!-- Reply Input Section -->
    <view v-if="showReplyInput" class="reply-input-section">
      <textarea
        class="reply-textarea"
        v-model="replyContent"
        placeholder="输入您的回复..."
        maxlength="200"
        :auto-height="true"
      />
      <view class="reply-actions">
        <text class="char-count">{{ replyContent.length }}/200</text>
        <view class="reply-buttons">
          <button class="cancel-btn" @click="cancelReply">取消</button>
          <button
            class="submit-btn"
            @click="submitReply"
            :disabled="!replyContent.trim() || isSubmittingReply"
          >
            {{ isSubmittingReply ? "回复中..." : "回复" }}
          </button>
        </view>
      </view>
    </view>

    <!-- Replies Section -->
    <view
      v-if="comment.replies && comment.replies.length > 0"
      class="replies-section"
    >
      <view
        v-for="reply in comment.replies"
        :key="reply.commentId || reply.replyId"
        class="reply-item"
        :class="{ 'official-reply': reply.isOfficialReply }"
      >
        <view class="reply-header">
          <view class="reply-user-info">
            <image
              class="reply-avatar"
              :src="resolveReplyAvatar(reply)"
              mode="aspectFill"
            />
            <text class="reply-user-name">{{
              reply.reviewerName || reply.replyerName || "匿名用户"
            }}</text>
            <view v-if="reply.isOfficialReply" class="official-badge">
              <uni-icons type="service" size="12" color="#fff" />
              <text class="badge-text">商家</text>
            </view>
          </view>
          <text class="reply-time">{{
            formatReplyTime(reply.commentTime || reply.replyTime)
          }}</text>
        </view>
        <text class="reply-content">{{
          reply.content || reply.replyContent
        }}</text>
      </view>
    </view>

    <!-- Legacy Official Reply Block (for backward compatibility) -->
    <view v-else-if="comment.reply" class="official-reply">
      <view class="reply-header">
        <uni-icons type="service" size="16" color="#3b82f6" />
        <text class="reply-badge">商家回复</text>
        <text class="reply-time">{{
          formatReplyTime(comment.reply.commentTime)
        }}</text>
      </view>
      <text class="reply-text">{{ comment.reply.content }}</text>
    </view>

    <!-- 举报弹窗 -->
    <ReportModal
      ref="reportModal"
      content-type="comment"
      :content-id="comment.commentId"
      :target-name="getCommentPreview()"
      @success="handleReportSuccess"
    />
  </view>
</template>

<script setup>
import { computed, toRefs, ref } from "vue";
import { BACKEND_URL } from "@/utils/config.js";
import { useResolveImagePath } from "@/utils/useResolveImagePath.js";
import { likeComment, replyComment } from "@/services/api.js";
import ReportModal from "@/components/ReportModal.vue";

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  showTargetType: {
    type: Boolean,
    default: false,
  },
  canReply: {
    type: Boolean,
    default: true, // 所有用户都可以回复
  },
});

const emit = defineEmits(["refreshComments"]);

const { comment } = toRefs(props);

// Reactive state
const isLiked = ref(false); // 可以从评论数据中获取用户是否已点赞
const currentLikeCount = ref(computed(() => comment.value.helpful_count || 0));
const showReplyInput = ref(false);
const replyContent = ref("");
const isSubmittingReply = ref(false);
const reportModal = ref();

const avatarSrc = useResolveImagePath(
  computed(() => comment.value.avatar_url),
  "/static/images/default-avatar.png"
);

const formattedTime = computed(() => {
  // A simple time formatter, can be replaced with a more robust library like day.js
  if (!props.comment.commentTime) return "";
  const date = new Date(props.comment.commentTime);
  const now = new Date();
  const diff = now - date;

  // 计算时间差
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString();
});

const formatReplyTime = (replyTime) => {
  if (!replyTime) return "";
  const date = new Date(replyTime);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString();
};

// Like functionality
const handleLike = async () => {
  if (isLiked.value) {
    uni.showToast({
      title: "您已点赞过此评论",
      icon: "none",
    });
    return;
  }

  try {
    const result = await likeComment(comment.value.commentId);

    // Update UI state
    isLiked.value = true;
    currentLikeCount.value = result.likesCount;

    uni.showToast({
      title: "点赞成功",
      icon: "success",
      duration: 1500,
    });
  } catch (error) {
    console.error("Like comment failed:", error);
    if (error.message && error.message.includes("已点赞")) {
      isLiked.value = true; // Mark as liked if already liked
      uni.showToast({
        title: "您已点赞过此评论",
        icon: "none",
      });
    } else {
      uni.showToast({
        title: "点赞失败，请重试",
        icon: "none",
      });
    }
  }
};

// Reply functionality
const toggleReply = () => {
  showReplyInput.value = !showReplyInput.value;
  if (!showReplyInput.value) {
    replyContent.value = "";
  }
};

const cancelReply = () => {
  showReplyInput.value = false;
  replyContent.value = "";
};

const submitReply = async () => {
  if (isSubmittingReply.value) return;

  if (!replyContent.value.trim()) {
    uni.showToast({
      title: "请输入回复内容",
      icon: "none",
    });
    return;
  }

  isSubmittingReply.value = true;

  try {
    // 使用统一的回复评论API，所有用户都可以回复
    await replyComment(comment.value.commentId, {
      replyContent: replyContent.value.trim(),
    });

    uni.showToast({
      title: "回复成功",
      icon: "success",
    });

    // Hide reply input and clear content
    showReplyInput.value = false;
    replyContent.value = "";

    // Emit event to refresh comments
    emit("refreshComments");
  } catch (error) {
    console.error("Reply comment failed:", error);
    // 更通用的错误处理，不只针对商家权限
    if (
      error.message &&
      (error.message.includes("无权限") || error.message.includes("权限"))
    ) {
      uni.showToast({
        title: "您没有权限回复此评论",
        icon: "none",
      });
    } else if (error.message && error.message.includes("登录")) {
      uni.showToast({
        title: "请先登录后再回复",
        icon: "none",
      });
    } else {
      uni.showToast({
        title: "回复失败，请重试",
        icon: "none",
      });
    }
  } finally {
    isSubmittingReply.value = false;
  }
};

const previewImage = (currentIndex) => {
  const urls = props.comment.imageUrls.map(
    (url) => useResolveImagePath(url).value
  );
  uni.previewImage({
    urls: urls,
    current: currentIndex,
  });
};

// 举报相关方法
const openReportModal = () => {
  reportModal.value?.openModal();
};

const handleReportSuccess = () => {
  uni.showToast({
    title: "举报提交成功，我们会尽快处理",
    icon: "success",
    duration: 2000,
  });
};

const getCommentPreview = () => {
  const content = comment.value.content || "";
  return content.length > 20 ? content.substring(0, 20) + "..." : content;
};

const resolveReplyAvatar = (reply) => {
  return useResolveImagePath(
    reply.avatar_url || reply.avatarUrl,
    "/static/images/default-avatar.png"
  ).value;
};

const resolveImagePath = (url) => {
  return useResolveImagePath(url).value;
};
</script>

<style scoped>
.comment-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  border: 1px solid #f5f5f5;
  transition: box-shadow 0.3s ease;
}

.comment-card:hover {
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.user-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  background-color: #f0f0f0;
  flex-shrink: 0;
  border: 2rpx solid #fff;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
}

.comment-time {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

.rating-container {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.rating-score {
  font-size: 24rpx;
  font-weight: 600;
  color: #f59e0b;
}

.target-type-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
  padding: 8rpx 12rpx;
  background-color: #f8f9fa;
  border-radius: 20rpx;
  align-self: flex-start;
}

.target-type-text {
  font-size: 22rpx;
  color: #6b7280;
  margin-left: 6rpx;
}

.target-name {
  font-size: 22rpx;
  color: #374151;
  font-weight: 500;
}

.comment-content {
  margin-bottom: 16rpx;
}

.comment-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  display: block;
  margin-bottom: 12rpx;
}

.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 12rpx;
}

.gallery-image {
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
  background-color: #f0f0f0;
}

.interaction-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1px solid #f5f5f5;
}

.interaction-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.interaction-right {
  display: flex;
  align-items: center;
}

.like-section {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
}

.like-section:hover {
  background-color: #fff5f5;
}

.like-section.liked {
  background-color: #fff5f5;
}

.like-count {
  font-size: 24rpx;
  color: #666;
  font-weight: 500;
}

.like-section.liked .like-count {
  color: #ff6b6b;
}

.reply-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.reply-btn:hover {
  background-color: #e9ecef;
}

.reply-text {
  font-size: 24rpx;
  color: #666;
}

.report-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
}

.report-btn:active {
  background-color: #fef2f2;
  transform: scale(0.98);
}

.report-text {
  font-size: 24rpx;
  color: #666;
}

.reply-input-section {
  margin-top: 16rpx;
  padding: 16rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  border: 1px solid #e9ecef;
}

.reply-textarea {
  width: 100%;
  min-height: 80rpx;
  border: 1px solid #ddd;
  border-radius: 8rpx;
  padding: 12rpx;
  font-size: 26rpx;
  color: #333;
  box-sizing: border-box;
  margin-bottom: 12rpx;
  line-height: 1.5;
  resize: none;
  background-color: #fff;
}

.reply-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count {
  font-size: 22rpx;
  color: #999;
}

.reply-buttons {
  display: flex;
  gap: 12rpx;
}

.cancel-btn,
.submit-btn {
  padding: 8rpx 16rpx;
  border-radius: 6rpx;
  font-size: 24rpx;
  border: none;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.submit-btn {
  background-color: #2563eb;
  color: #fff;
}

.submit-btn:disabled {
  background-color: #ccc;
  color: #888;
  cursor: not-allowed;
}

/* Replies Section Styles */
.replies-section {
  margin-top: 16rpx;
  padding: 16rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border-left: 3rpx solid #e2e8f0;
}

.reply-item {
  padding: 16rpx;
  margin-bottom: 12rpx;
  background: #fff;
  border-radius: 8rpx;
  border: 1rpx solid #f0f0f0;
  transition: all 0.3s ease;
}

.reply-item:last-child {
  margin-bottom: 0;
}

.reply-item.official-reply {
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
  border-color: #3b82f6;
  border-left: 3rpx solid #3b82f6;
}

.reply-user-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.reply-avatar {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #f0f0f0;
}

.reply-user-name {
  font-size: 24rpx;
  font-weight: 500;
  color: #333;
}

.official-badge {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 2rpx 8rpx;
  background: #3b82f6;
  border-radius: 12rpx;
}

.badge-text {
  font-size: 20rpx;
  color: #fff;
  font-weight: 500;
}

.reply-content {
  font-size: 26rpx;
  color: #555;
  line-height: 1.4;
}

/* Legacy Official Reply Styles (for backward compatibility) */
.official-reply {
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
  padding: 20rpx;
  border-radius: 12rpx;
  margin-top: 16rpx;
  border-left: 4rpx solid #3b82f6;
}

.reply-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
  gap: 8rpx;
  justify-content: space-between;
}

.reply-badge {
  font-size: 24rpx;
  font-weight: 600;
  color: #3b82f6;
}

.reply-time {
  font-size: 20rpx;
  color: #6b7280;
}

.official-reply .reply-text {
  font-size: 26rpx;
  color: #1e40af;
  line-height: 1.5;
  display: block;
}
</style>
