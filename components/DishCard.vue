<template>
  <view class="dish-card">
    <image class="dish-image" :src="imageSrc" mode="aspectFill" />
    <view class="dish-info">
      <text class="dish-name">{{ dish.name }}</text>
      <text class="dish-description">{{ dish.description }}</text>
      <view class="tags-container" v-if="dish.tags && dish.tags.length">
        <uni-tag
          v-for="(tag, index) in dish.tags"
          :key="index"
          :text="tag"
          type="primary"
          :inverted="true"
          size="mini"
          class="dish-tag"
        />
      </view>
      <text class="dish-price">¥{{ dish.price.toFixed(2) }}</text>
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
.dish-card {
  display: flex;
  padding: 24rpx 0;
  border-bottom: 1px solid #f0f0f0;
}
.dish-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}
.dish-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.dish-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 4rpx;
}
.dish-description {
  font-size: 26rpx;
  color: #888;
  margin-bottom: 8rpx;
  line-height: 1.4;
}
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 12rpx;
}
.dish-tag {
  margin-right: 10rpx;
}
.dish-price {
  font-size: 32rpx;
  font-weight: bold;
  color: #fa5151;
  margin-top: auto; /* Pushes price to the bottom */
}
</style>
