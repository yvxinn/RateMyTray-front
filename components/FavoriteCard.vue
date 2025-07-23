<template>
  <view class="favorite-card">
    <view class="card-content" @click="goToDetail">
      <image class="item-image" :src="imageSrc" mode="aspectFill" />
      <view class="item-info">
        <text class="item-name">{{ favorite.targetName }}</text>
        <view class="type-badge">
          <uni-tag
            :text="typeText"
            :type="favorite.targetType === 'dish' ? 'primary' : 'success'"
            size="mini"
            :inverted="true"
          />
        </view>
      </view>
    </view>
    <view class="action-buttons">
      <button
        class="unfavorite-btn"
        size="mini"
        type="default"
        @click="handleUnfavorite"
        :loading="isRemoving"
      >
        <uni-icons type="heart-filled" color="#ff4757" size="16" />
        取消收藏
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, toRefs } from "vue";
import { useResolveImagePath } from "@/utils/useResolveImagePath.js";
import { navigateTo, RoutePath } from "@/utils/router.js";
import { removeFavorite } from "@/services/api.js";

const emit = defineEmits(["unfavorite"]);

const props = defineProps({
  favorite: {
    type: Object,
    required: true,
    validator: (value) => {
      return (
        value.favoriteId &&
        value.targetType &&
        value.targetId &&
        value.targetName
      );
    },
  },
});

const { favorite } = toRefs(props);
const isRemoving = ref(false);

// 图片处理
const imageSrc = useResolveImagePath(
  computed(() => favorite.value.targetImageUrl),
  "/static/images/default-dish.png"
);

// 类型文本
const typeText = computed(() => {
  return favorite.value.targetType === "dish" ? "菜品" : "窗口";
});

// 跳转到详情页面
const goToDetail = () => {
  if (favorite.value.targetType === "dish") {
    navigateTo(RoutePath.DISH_DETAIL, { id: favorite.value.targetId });
  } else {
    navigateTo(RoutePath.WINDOW_DETAIL, { id: favorite.value.targetId });
  }
};

// 取消收藏
const handleUnfavorite = async () => {
  if (isRemoving.value) return;

  try {
    isRemoving.value = true;
    await removeFavorite(favorite.value.favoriteId);

    uni.showToast({
      title: "已取消收藏",
      icon: "success",
    });

    // 通知父组件移除此项
    emit("unfavorite", favorite.value.favoriteId);
  } catch (error) {
    uni.showToast({
      title: error.message || "操作失败",
      icon: "none",
    });
  } finally {
    isRemoving.value = false;
  }
};
</script>

<style scoped>
.favorite-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.card-content {
  display: flex;
  padding: 24rpx;
  align-items: center;
}

.item-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.item-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.type-badge {
  display: flex;
  align-items: center;
}

.action-buttons {
  padding: 16rpx 24rpx 24rpx;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

.unfavorite-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #ff4757;
  border: 1px solid #ff4757;
  background: #fff;
  border-radius: 20rpx;
  padding: 8rpx 16rpx;
}

.unfavorite-btn:active {
  background: #fff2f0;
}
</style>
