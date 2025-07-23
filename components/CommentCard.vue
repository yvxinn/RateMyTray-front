<template>
  <view class="comment-card">
    <image class="avatar" :src="avatarSrc" mode="aspectFill" />
    <view class="comment-content">
      <view class="comment-header">
        <text class="user-name">{{ comment.reviewerName }}</text>
        <view class="rating-wrapper">
          <uni-rate :value="comment.rating" size="14" readonly />
        </view>
      </view>
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
      <text class="comment-time">{{ formattedTime }}</text>
      <!-- Official Reply Block -->
      <view v-if="comment.isOfficialReply" class="official-reply">
        <text class="reply-badge">商家回复</text>
        <text class="reply-text">{{ comment.content }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, toRefs } from "vue";
import { BACKEND_URL } from "@/utils/config.js";
import { useResolveImagePath } from "@/utils/useResolveImagePath.js";

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
});

const { comment } = toRefs(props);

const avatarSrc = useResolveImagePath(
  computed(() => comment.value.avatar_url),
  "/static/images/default-avatar.png"
);

const formattedTime = computed(() => {
  // A simple time formatter, can be replaced with a more robust library like day.js
  if (!props.comment.commentTime) return "";
  const date = new Date(props.comment.commentTime);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
});

const previewImage = (currentIndex) => {
  const urls = props.comment.imageUrls.map(
    (url) => useResolveImagePath(url).value
  );
  uni.previewImage({
    urls: urls,
    current: currentIndex,
  });
};
</script>

<style scoped>
.comment-card {
  display: flex;
  padding: 24rpx 0;
  border-bottom: 1px solid #f0f0f0;
}
.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  background-color: #eee;
  flex-shrink: 0;
}
.comment-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}
.user-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}
.rating-wrapper {
  transform: scale(0.9); /* Adjust size of uni-rate */
}
.comment-text {
  font-size: 28rpx;
  color: #555;
  line-height: 1.5;
  margin-bottom: 12rpx;
}
.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 12rpx;
}
.gallery-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
}
.comment-time {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 12rpx;
}
.official-reply {
  background-color: #f7f8fa;
  padding: 16rpx;
  border-radius: 8rpx;
  margin-top: 10rpx;
}
.reply-badge {
  font-size: 24rpx;
  font-weight: bold;
  color: #3b82f6;
  margin-right: 10rpx;
}
.reply-text {
  font-size: 26rpx;
  color: #4b5563;
}
</style>
