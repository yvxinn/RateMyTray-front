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
      <text class="label">上传图片 (可选, 最多3张):</text>

      <!-- Image Gallery -->
      <view class="image-gallery" v-if="selectedImages.length > 0">
        <view
          v-for="(image, index) in selectedImages"
          :key="index"
          class="image-item"
        >
          <image
            :src="image.url || image.tempPath"
            class="preview-image"
            mode="aspectFill"
          />
          <view class="image-overlay" @click="removeImage(index)">
            <uni-icons type="close" size="16" color="#fff" />
          </view>
          <view v-if="image.uploading" class="upload-progress">
            <text class="upload-text">上传中...</text>
          </view>
        </view>
      </view>

      <!-- Add Image Button -->
      <button
        v-if="selectedImages.length < 3"
        class="upload-button"
        @click="chooseImages"
        :disabled="isUploadingImage"
      >
        <uni-icons type="camera" size="20" color="#666" />
        <text>{{
          isUploadingImage
            ? "上传中..."
            : `选择图片 (${selectedImages.length}/3)`
        }}</text>
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
const selectedImages = ref([]); // 改为数组支持多张图片
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

const chooseImages = async () => {
  if (isUploadingImage.value) return;

  const maxCount = 3 - selectedImages.value.length;
  if (maxCount <= 0) {
    uni.showToast({
      title: "最多只能选择3张图片",
      icon: "none",
    });
    return;
  }

  try {
    const res = await uni.chooseImage({
      count: maxCount,
      sizeType: ["original", "compressed"],
      sourceType: ["album", "camera"],
    });

    isUploadingImage.value = true;
    uni.showLoading({
      title: "图片上传中...",
    });

    // 添加临时图片到数组中
    const tempImages = res.tempFilePaths.map((path) => ({
      tempPath: path,
      uploading: true,
      url: null,
    }));
    selectedImages.value.push(...tempImages);

    // 逐个上传图片
    for (let i = 0; i < tempImages.length; i++) {
      const image = tempImages[i];
      try {
        const uploadResult = await uploadFile("comments", image.tempPath);
        image.url = uploadResult.fileUrl;
        image.uploading = false;
      } catch (error) {
        console.error("图片上传失败:", error);
        // 上传失败的图片从数组中移除
        const index = selectedImages.value.findIndex(
          (img) => img.tempPath === image.tempPath
        );
        if (index > -1) {
          selectedImages.value.splice(index, 1);
        }
        uni.showToast({
          title: `第${i + 1}张图片上传失败`,
          icon: "none",
        });
      }
    }

    uni.showToast({
      title: "图片上传完成",
      icon: "success",
    });
  } catch (error) {
    console.error("图片选择失败:", error);
    uni.showToast({
      title: "图片选择失败",
      icon: "none",
    });
  } finally {
    uni.hideLoading();
    isUploadingImage.value = false;
  }
};

const removeImage = (index) => {
  selectedImages.value.splice(index, 1);
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
  if (!content.value.trim() && !selectedImages.value.length) {
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
      imageUrls: selectedImages.value
        .map((img) => img.url)
        .filter((url) => url), // 只包含已上传成功的图片
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

.image-upload-section {
  margin: 40rpx 0;
}

.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
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
  top: 8rpx;
  right: 8rpx;
  width: 48rpx;
  height: 48rpx;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
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
  border-radius: 12rpx;
}

.upload-text {
  color: #fff;
  font-size: 24rpx;
  font-weight: 600;
}

.upload-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: 30rpx;
  border: 2rpx dashed #ccc;
  border-radius: 12rpx;
  background-color: #fafafa;
  color: #666;
  font-size: 28rpx;
  transition: all 0.3s ease;
}

.upload-button:hover {
  border-color: #2563eb;
  background-color: #f0f8ff;
  color: #2563eb;
}

.upload-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-button::after {
  border: none;
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
