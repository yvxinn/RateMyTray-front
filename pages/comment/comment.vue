<template>
  <view class="comment-container">
    <text class="page-title">发布评价</text>

    <view class="rating-section">
      <text class="label">评分:</text>
      <view class="stars">
        <uni-icons
          v-for="n in 5"
          :key="n"
          :type="n <= rating ? 'star-filled' : 'star'"
          :color="n <= rating ? '#FFD700' : '#e0e0e0'"
          size="35"
          @click="setRating(n)"
        ></uni-icons>
      </view>
    </view>

    <textarea
      class="comment-textarea"
      v-model="content"
      placeholder="请输入您的评价内容..."
      maxlength="200"
    ></textarea>
    <text class="word-count">{{ content.length }}/200</text>

    <view class="image-upload-section">
      <text class="label">上传图片 (可选):</text>
      <view class="image-preview" v-if="imageUrl">
        <image :src="imageUrl" mode="aspectFit" class="uploaded-image"></image>
        <uni-icons
          type="clear"
          size="24"
          color="#dc3545"
          class="clear-icon"
          @click="clearImage"
        ></uni-icons>
      </view>
      <button
        v-else
        class="upload-button"
        @click="chooseImage"
        :disabled="isUploadingImage"
      >
        {{ isUploadingImage ? "上传中..." : "选择图片" }}
      </button>
    </view>

    <view class="anonymous-section">
      <switch :checked="isAnonymous" @change="toggleAnonymous" />
      <text class="anonymous-label">匿名评价</text>
    </view>

    <button
      class="submit-button"
      @click="submitComment"
      :disabled="isSubmitting"
    >
      {{ isSubmitting ? "提交中..." : "提交评价" }}
    </button>
  </view>
</template>

<script setup>
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  uploadFile,
  submitComment as apiSubmitComment,
} from "@/services/api.js";

// Reactive state
const targetType = ref(""); // "dish" or "window"
const targetId = ref(null);
const rating = ref(0);
const content = ref("");
const imageUrl = ref("");
const isAnonymous = ref(false);
const isSubmitting = ref(false);
const isUploadingImage = ref(false);

onLoad((options) => {
  if (options.targetType && options.targetId) {
    targetType.value = options.targetType;
    targetId.value = options.targetId;
    uni.setNavigationBarTitle({
      title: `发布对${options.targetType === "dish" ? "菜品" : "窗口"}的评价`,
    });
  } else {
    uni.showToast({
      title: "评价对象信息缺失",
      icon: "none",
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  }
});

const setRating = (score) => {
  rating.value = score;
};

const chooseImage = async () => {
  if (isUploadingImage.value) return;

  try {
    const res = await uni.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
    });

    isUploadingImage.value = true;
    uni.showLoading({
      title: "图片上传中...",
    });

    const uploadedImageUrl = await uploadFile("comments", res.tempFilePaths[0]);
    imageUrl.value = uploadedImageUrl;

    uni.showToast({
      title: "图片上传成功",
      icon: "success",
    });
  } catch (error) {
    console.error("图片上传或选择失败:", error);
    uni.showToast({
      title: "图片上传失败",
      icon: "none",
    });
  } finally {
    uni.hideLoading();
    isUploadingImage.value = false;
  }
};

const clearImage = () => {
  imageUrl.value = "";
};

const toggleAnonymous = (e) => {
  isAnonymous.value = e.detail.value;
};

const submitComment = async () => {
  if (isSubmitting.value) return;

  if (rating.value === 0) {
    uni.showToast({
      title: "请选择评分",
      icon: "none",
    });
    return;
  }
  if (!content.value.trim() && !imageUrl.value) {
    uni.showToast({
      title: "评价内容或图片至少填一项",
      icon: "none",
    });
    return;
  }

  isSubmitting.value = true;
  uni.showLoading({
    title: "提交中...",
  });

  try {
    const res = await apiSubmitComment({
      targetType: targetType.value,
      targetId: targetId.value,
      rating: rating.value,
      content: content.value.trim(),
      imageUrl: imageUrl.value,
      isAnonymous: isAnonymous.value,
    });
    uni.showToast({
      title: res.message || "评价提交成功",
      icon: "success",
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (e) {
    console.error("提交评价失败:", e);
    uni.showToast({
      title: e.message || "提交失败，请稍后再试",
      icon: "none",
    });
  } finally {
    uni.hideLoading();
    isSubmitting.value = false;
  }
};
</script>

<style>
.comment-container {
  padding: 30rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.page-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 40rpx;
  display: block;
}

.rating-section,
.image-upload-section,
.anonymous-section {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.label {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.stars {
  display: flex;
  justify-content: center;
  padding: 20rpx 0;
}

.stars .uni-icons {
  margin: 0 10rpx;
}

.comment-textarea {
  width: calc(100% - 60rpx); /* 减去padding */
  height: 240rpx;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  font-size: 32rpx;
  color: #333;
  line-height: 1.5;
  margin-bottom: 10rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.word-count {
  font-size: 26rpx;
  color: #999;
  text-align: right;
  display: block;
  margin-bottom: 30rpx;
  padding-right: 30rpx; /* 与textarea对齐 */
}

.upload-button {
  width: 100%;
  height: 90rpx;
  background-color: #007aff;
  color: #fff;
  border-radius: 20rpx;
  font-size: 32rpx;
  line-height: 90rpx;
  text-align: center;
}

.upload-button[disabled] {
  background-color: #90caf9;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 300rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  border-radius: 20rpx;
  overflow: hidden;
}

.uploaded-image {
  width: 100%;
  height: 100%;
}

.clear-icon {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  padding: 5rpx;
}

.anonymous-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
}

.anonymous-label {
  font-size: 32rpx;
  color: #333;
  margin-left: 20rpx;
}

.submit-button {
  width: 100%;
  height: 90rpx;
  background-color: #4caf50;
  color: #fff;
  border-radius: 20rpx;
  font-size: 36rpx;
  line-height: 90rpx;
  text-align: center;
  margin-top: 40rpx;
}

.submit-button[disabled] {
  background-color: #a5d6a7;
}
</style>
