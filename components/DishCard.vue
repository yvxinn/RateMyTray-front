<template>
  <view class="dish-card" @click="goToDishDetail">
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
      <view class="price-rating-row">
        <text class="dish-price"
          >¥{{ dish.price ? dish.price.toFixed(2) : "0.00" }}</text
        >
        <view v-if="dish.averageRating" class="rating-info">
          <uni-icons type="star-filled" color="#f59e0b" size="14" />
          <text class="rating-text">{{ dish.averageRating.toFixed(1) }}</text>
        </view>
      </view>
    </view>
    <view class="arrow-icon">
      <uni-icons type="right" color="#c0c4cc" size="16" />
    </view>
  </view>
</template>

<script setup>
import { computed, toRefs } from "vue";
import { useResolveImagePath } from "@/utils/useResolveImagePath.js";
import { navigateTo, RoutePath } from "@/utils/router.js";

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

const goToDishDetail = () => {
  navigateTo(RoutePath.DISH_DETAIL, {
    id: dish.value.dishId,
  });
};
</script>

<style scoped>
.dish-card {
  display: flex;
  padding: 24rpx 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.dish-card:hover {
  background-color: #f8f9fa;
}

.dish-card:active {
  background-color: #f1f3f5;
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

.price-rating-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.dish-price {
  font-size: 32rpx;
  font-weight: bold;
  color: #fa5151;
}

.rating-info {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.rating-text {
  font-size: 24rpx;
  color: #f59e0b;
  font-weight: 600;
}

.arrow-icon {
  margin-left: 16rpx;
  flex-shrink: 0;
}
</style>
