<template>
  <view class="dish-card-container">
    <view class="card-badge">精选菜品</view>
    <image class="cover-image" :src="imageSrc" mode="aspectFill" />
    <view class="card-content">
      <text class="dish-name">{{ dish.name }}</text>
      <view class="window-info">
        <uni-icons type="shop" color="#666" size="14"></uni-icons>
        <text class="window-name">{{ dish.windowName }}</text>
      </view>
      <view class="card-footer">
        <text class="dish-price">¥{{ dish.price.toFixed(2) }}</text>
        <uni-icons type="right" color="#999" size="16"></uni-icons>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, toRefs } from "vue";
import { useResolveImagePath } from "@/utils/useResolveImagePath.js";

const props = defineProps({
  dish: {
    type: Object,
    required: true,
  },
});

const { dish } = toRefs(props);
const imageSrc = useResolveImagePath(
  computed(() => dish.value.imageUrl),
  "/static/images/default-dish.png"
);
</script>

<style scoped>
.dish-card-container {
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
}
.card-badge {
  position: absolute;
  top: 20rpx;
  left: 20rpx;
  background-color: rgba(255, 122, 69, 0.9);
  color: white;
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: bold;
  z-index: 2;
}
.cover-image {
  width: 100%;
  height: 250rpx;
  background-color: #e9ecef;
}
.card-content {
  padding: 24rpx;
}
.dish-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #1f2937;
  display: block;
  margin-bottom: 12rpx;
}
.window-info {
  display: flex;
  align-items: center;
  color: #666;
  font-size: 26rpx;
  margin-bottom: 20rpx;
}
.window-name {
  margin-left: 8rpx;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dish-price {
  font-size: 36rpx;
  font-weight: bold;
  color: #fa5151;
}
</style>
