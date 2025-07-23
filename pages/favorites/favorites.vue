<template>
  <view class="favorites-page">
    <!-- 筛选栏 -->
    <view class="filter-section">
      <view class="filter-tabs">
        <view
          v-for="(filter, index) in filterOptions"
          :key="index"
          class="filter-tab"
          :class="{ active: activeFilter === filter.value }"
          @click="changeFilter(filter.value)"
        >
          <text class="filter-text">{{ filter.label }}</text>
          <view class="filter-count-badge" v-if="filter.count > 0">{{
            filter.count
          }}</view>
        </view>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <view class="content-wrapper">
      <!-- 加载状态 -->
      <view v-if="isLoading" class="loading-container">
        <uni-load-more status="loading" />
      </view>

      <!-- 空状态 -->
      <view v-else-if="filteredFavorites.length === 0" class="empty-state">
        <view class="empty-icon">💝</view>
        <text class="empty-title">还没有收藏</text>
        <text class="empty-desc">
          {{
            activeFilter === "all"
              ? "发现喜欢的内容就收藏起来吧"
              : `暂无收藏的${getCurrentFilterLabel()}`
          }}
        </text>
        <button class="explore-btn" @click="goToHome">去发现</button>
      </view>

      <!-- 收藏网格列表 -->
      <view v-else class="favorites-grid">
        <view
          v-for="favorite in filteredFavorites"
          :key="favorite.favoriteId"
          class="favorite-item"
          @click="goToDetail(favorite)"
        >
          <!-- 图片容器 -->
          <view class="image-container">
            <image
              class="item-image"
              :src="imageSrc(favorite)"
              mode="aspectFill"
            />

            <!-- 类型标签 -->
            <view class="type-badge" :class="'type-' + favorite.targetType">
              <uni-icons
                :type="getTypeIcon(favorite.targetType)"
                size="12"
                color="#fff"
              />
              <text class="type-text">{{
                getTypeText(favorite.targetType)
              }}</text>
            </view>

            <!-- 取消收藏按钮 -->
            <view
              class="unfavorite-btn"
              @click.stop="handleUnfavorite(favorite)"
            >
              <uni-icons type="heart-filled" color="#ff4757" size="16" />
            </view>
          </view>

          <!-- 信息区域 -->
          <view class="item-info">
            <text class="item-name">{{ favorite.targetName }}</text>
          </view>
        </view>
      </view>

      <!-- 统计信息 -->
      <view v-if="filteredFavorites.length > 0" class="stats-footer">
        <text class="stats-text">共 {{ filteredFavorites.length }} 项收藏</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getFavorites, removeFavorite } from "@/services/api.js";
import { RoutePath, reLaunch, navigateTo } from "@/utils/router.js";
import { useResolveImagePath } from "@/utils/useResolveImagePath.js";

// 响应式数据
const favorites = ref([]);
const isLoading = ref(false);
const activeFilter = ref("all");

// 筛选选项
const filterOptions = computed(() => [
  {
    label: "全部",
    value: "all",
    count: favorites.value.length,
  },
  {
    label: "菜品",
    value: "dish",
    count: favorites.value.filter((item) => item.targetType === "dish").length,
  },
  {
    label: "窗口",
    value: "window",
    count: favorites.value.filter((item) => item.targetType === "window")
      .length,
  },
]);

// 过滤后的收藏列表
const filteredFavorites = computed(() => {
  if (activeFilter.value === "all") {
    return favorites.value;
  }
  return favorites.value.filter(
    (item) => item.targetType === activeFilter.value
  );
});

// 获取当前筛选条件的标签
const getCurrentFilterLabel = () => {
  const filter = filterOptions.value.find(
    (item) => item.value === activeFilter.value
  );
  return filter ? filter.label : "";
};

// 图片处理
const imageSrc = (favorite) => {
  const defaultImage =
    favorite.targetType === "dish"
      ? "/static/images/default-dish.png"
      : "/static/images/default-window.png";
  return useResolveImagePath(favorite.targetImageUrl, defaultImage).value;
};

// 获取类型图标
const getTypeIcon = (type) => {
  return type === "dish" ? "nutrition" : "home";
};

// 获取类型文本
const getTypeText = (type) => {
  return type === "dish" ? "菜品" : "窗口";
};

// 获取收藏列表
const fetchFavorites = async () => {
  try {
    isLoading.value = true;
    const response = await getFavorites();
    favorites.value = response || [];
  } catch (error) {
    uni.showToast({
      title: error.message || "获取收藏列表失败",
      icon: "none",
    });
    favorites.value = [];
  } finally {
    isLoading.value = false;
  }
};

// 切换筛选条件
const changeFilter = (filterValue) => {
  activeFilter.value = filterValue;
};

// 跳转到详情页
const goToDetail = (favorite) => {
  if (favorite.targetType === "dish") {
    navigateTo(RoutePath.DISH_DETAIL, { id: favorite.targetId });
  } else {
    navigateTo(RoutePath.WINDOW_DETAIL, { id: favorite.targetId });
  }
};

// 处理取消收藏
const handleUnfavorite = async (favorite) => {
  try {
    uni.showModal({
      title: "确认取消",
      content: `确定要取消收藏"${favorite.targetName}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          await removeFavorite(favorite.favoriteId);

          // 从列表中移除
          const index = favorites.value.findIndex(
            (item) => item.favoriteId === favorite.favoriteId
          );
          if (index > -1) {
            favorites.value.splice(index, 1);
          }

          uni.showToast({
            title: "已取消收藏",
            icon: "success",
          });
        }
      },
    });
  } catch (error) {
    uni.showToast({
      title: error.message || "操作失败",
      icon: "none",
    });
  }
};

// 跳转到首页
const goToHome = () => {
  reLaunch(RoutePath.HOME);
};

// 页面生命周期
onMounted(() => {
  fetchFavorites();
});

onShow(() => {
  fetchFavorites();
});
</script>

<style scoped>
.favorites-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
}

.filter-section {
  background: #fff;
  padding: 16rpx 32rpx;
  padding-top: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 0;
  z-index: 100;
}

.filter-tabs {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  border-radius: 24rpx;
  background: #f8f9fa;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2rpx solid transparent;
}

.filter-tab.active {
  background: linear-gradient(135deg, #ff9500 0%, #ff6b35 100%);
  color: #fff;
  border-color: rgba(255, 149, 0, 0.3);
  box-shadow: 0 4rpx 16rpx rgba(255, 149, 0, 0.3);
}

.filter-text {
  font-size: 28rpx;
  font-weight: 500;
  color: inherit;
}

.filter-count-badge {
  background: rgba(255, 149, 0, 0.1);
  color: #ff9500;
  font-size: 22rpx;
  font-weight: 600;
  padding: 4rpx 8rpx;
  border-radius: 12rpx;
  min-width: 32rpx;
  text-align: center;
  line-height: 1;
}

.filter-tab.active .filter-count-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.content-wrapper {
  padding: 24rpx 32rpx;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 120rpx 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
  text-align: center;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
  opacity: 0.6;
}

.empty-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 48rpx;
  line-height: 1.5;
}

.explore-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 28rpx;
  padding: 20rpx 48rpx;
  font-size: 28rpx;
  font-weight: 500;
  box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.3);
}

.explore-btn:active {
  transform: scale(0.98);
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.favorite-item {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
}

.favorite-item:active {
  transform: scale(0.98);
}

.image-container {
  position: relative;
  height: 240rpx;
  overflow: hidden;
}

.item-image {
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}

.favorite-item:active .item-image {
  transform: scale(1.05);
}

.type-badge {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 6rpx 12rpx;
  border-radius: 16rpx;
  backdrop-filter: blur(10rpx);
  font-size: 22rpx;
}

.type-dish {
  background: rgba(255, 152, 0, 0.9);
}

.type-window {
  background: rgba(52, 199, 89, 0.9);
}

.type-text {
  color: #fff;
  font-weight: 500;
  font-size: 20rpx;
}

.unfavorite-btn {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  width: 56rpx;
  height: 56rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10rpx);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.unfavorite-btn:active {
  transform: scale(0.9);
  background: rgba(255, 71, 87, 0.9);
}

.item-info {
  padding: 20rpx;
}

.item-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stats-footer {
  margin-top: 40rpx;
  padding: 24rpx 0;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.stats-text {
  font-size: 26rpx;
  color: #999;
}

/* 响应式设计 */
@media (min-width: 768px) {
  .favorites-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24rpx;
  }
}

@media (min-width: 1024px) {
  .favorites-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 32rpx;
  }

  .content-wrapper {
    padding: 32rpx 64rpx;
  }
}
</style>
