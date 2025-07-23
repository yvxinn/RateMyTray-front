<template>
  <view class="statistics-container">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="header-content">
        <view class="header-title">
          <uni-icons type="bars" size="28" color="#ff7a45"></uni-icons>
          <text class="title-text">数据统计</text>
        </view>
        <view class="header-actions">
          <button class="refresh-btn" @click="refreshData" :loading="loading">
            <uni-icons type="refresh" size="20" color="#6b7280"></uni-icons>
            <text>刷新</text>
          </button>
          <button class="logout-btn" @click="confirmLogout">
            <uni-icons type="person" size="20" color="#6b7280"></uni-icons>
            <text>退出</text>
          </button>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <uni-icons
        type="spinner-cycle"
        size="40"
        color="#ff7a45"
        class="loading-icon"
      ></uni-icons>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 无数据 -->
    <view v-else-if="!statisticsData" class="empty-container">
      <uni-icons type="bars" size="80" color="#d1d5db"></uni-icons>
      <text class="empty-title">暂无统计数据</text>
      <text class="empty-subtitle">还没有足够的数据生成统计报告</text>
    </view>

    <!-- 统计内容 -->
    <view v-else class="content">
      <!-- 窗口概览 -->
      <view class="overview-card">
        <view class="card-header">
          <text class="card-title"
            >{{ statisticsData.windowName }} - 经营概览</text
          >
        </view>

        <view class="overview-stats">
          <view class="overview-item">
            <view
              class="overview-icon"
              style="background-color: rgba(255, 122, 69, 0.1)"
            >
              <uni-icons type="star" size="24" color="#ff7a45"></uni-icons>
            </view>
            <view class="overview-content">
              <text class="overview-value">{{ formattedAverageRating }}</text>
              <text class="overview-label">平均评分</text>
            </view>
          </view>

          <view class="overview-item">
            <view
              class="overview-icon"
              style="background-color: rgba(59, 130, 246, 0.1)"
            >
              <uni-icons type="chat" size="24" color="#3b82f6"></uni-icons>
            </view>
            <view class="overview-content">
              <text class="overview-value">{{
                statisticsData.totalComments
              }}</text>
              <text class="overview-label">总评价数</text>
            </view>
          </view>

          <view class="overview-item">
            <view
              class="overview-icon"
              style="background-color: rgba(34, 197, 94, 0.1)"
            >
              <uni-icons type="coffee" size="24" color="#22c55e"></uni-icons>
            </view>
            <view class="overview-content">
              <text class="overview-value">{{ dishRatings.length }}</text>
              <text class="overview-label">菜品数量</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 菜品评分排行 -->
      <view class="ranking-card">
        <view class="card-header">
          <text class="card-title">菜品评分排行</text>
          <view class="sort-controls">
            <button
              class="sort-btn"
              :class="{ active: sortBy === 'rating' }"
              @click="setSortBy('rating')"
            >
              按评分
            </button>
            <button
              class="sort-btn"
              :class="{ active: sortBy === 'comments' }"
              @click="setSortBy('comments')"
            >
              按评价数
            </button>
          </view>
        </view>

        <view class="dish-list">
          <view
            v-for="(dish, index) in sortedDishRatings"
            :key="dish.dishId"
            class="dish-item"
            :class="{ 'top-dish': index < 3 && dish.averageRating }"
          >
            <view class="dish-rank">
              <text v-if="dish.averageRating" class="rank-number">{{
                index + 1
              }}</text>
              <uni-icons
                v-else
                type="minus"
                size="16"
                color="#9ca3af"
              ></uni-icons>
            </view>

            <view class="dish-info">
              <text class="dish-name">{{ dish.dishName }}</text>
              <view class="dish-stats">
                <view class="rating-section">
                  <uni-icons
                    type="star-filled"
                    size="16"
                    :color="dish.averageRating ? '#fbbf24' : '#d1d5db'"
                  ></uni-icons>
                  <text class="rating-text">
                    {{
                      dish.averageRating
                        ? dish.averageRating.toFixed(1)
                        : "暂无评分"
                    }}
                  </text>
                </view>
                <text class="comment-count"
                  >{{ dish.totalComments }}条评价</text
                >
              </view>
            </view>

            <view class="dish-badge" v-if="index < 3 && dish.averageRating">
              <uni-icons
                :type="getBadgeIcon(index)"
                size="20"
                :color="getBadgeColor(index)"
              ></uni-icons>
            </view>
          </view>
        </view>

        <!-- 无菜品数据 -->
        <view v-if="dishRatings.length === 0" class="no-dishes">
          <uni-icons type="coffee" size="60" color="#d1d5db"></uni-icons>
          <text class="no-dishes-text">暂无菜品数据</text>
        </view>
      </view>

      <!-- 评分分布 -->
      <view class="distribution-card">
        <view class="card-header">
          <text class="card-title">评分分布</text>
        </view>

        <view class="distribution-content">
          <view
            v-for="level in ratingDistribution"
            :key="level.rating"
            class="distribution-item"
          >
            <view class="distribution-label">
              <text>{{ level.rating }}星</text>
              <text class="distribution-count">({{ level.count }}个)</text>
            </view>
            <view class="distribution-bar">
              <view
                class="distribution-fill"
                :style="{
                  width: level.percentage + '%',
                  backgroundColor: level.color,
                }"
              ></view>
            </view>
            <text class="distribution-percentage"
              >{{ level.percentage.toFixed(1) }}%</text
            >
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import store from "@/store";
import { getMerchantWindow, getMerchantStatistics } from "@/services/api.js";
import { RoutePath } from "@/utils/router.js";

// 数据状态
const statisticsData = ref(null);
const merchantWindow = ref(null);
const loading = ref(true);
const sortBy = ref("rating"); // 'rating' 或 'comments'

// 页面参数
const windowId = ref(null);

// 计算属性
const formattedAverageRating = computed(() => {
  const rating = statisticsData.value?.averageRating;
  return rating ? rating.toFixed(1) : "暂无";
});

const dishRatings = computed(() => {
  return statisticsData.value?.dishRatings || [];
});

const sortedDishRatings = computed(() => {
  const dishes = [...dishRatings.value];

  if (sortBy.value === "rating") {
    return dishes.sort((a, b) => {
      // 有评分的排在前面，评分高的排在前面
      if (a.averageRating && b.averageRating) {
        return b.averageRating - a.averageRating;
      }
      if (a.averageRating && !b.averageRating) return -1;
      if (!a.averageRating && b.averageRating) return 1;
      return 0;
    });
  } else {
    return dishes.sort((a, b) => b.totalComments - a.totalComments);
  }
});

const ratingDistribution = computed(() => {
  const dishes = dishRatings.value.filter((dish) => dish.averageRating);
  const total = dishes.length;

  if (total === 0) return [];

  const distribution = [
    { rating: 5, count: 0, color: "#22c55e" },
    { rating: 4, count: 0, color: "#84cc16" },
    { rating: 3, count: 0, color: "#fbbf24" },
    { rating: 2, count: 0, color: "#f97316" },
    { rating: 1, count: 0, color: "#ef4444" },
  ];

  dishes.forEach((dish) => {
    const rating = Math.floor(dish.averageRating);
    const index = distribution.findIndex((d) => d.rating === rating);
    if (index !== -1) {
      distribution[index].count++;
    }
  });

  return distribution.map((level) => ({
    ...level,
    percentage: total > 0 ? (level.count / total) * 100 : 0,
  }));
});

// 页面生命周期
onLoad((options) => {
  if (options.windowId) {
    windowId.value = parseInt(options.windowId);
  }
});

onShow(() => {
  const userInfo = store.state.userInfo;

  if (!userInfo || userInfo.role !== "merchant") {
    uni.showToast({
      title: "请以商家身份登录",
      icon: "none",
    });
    setTimeout(() => {
      uni.reLaunch({
        url: RoutePath.LOGIN,
      });
    }, 1500);
    return;
  }

  loadData();
});

// 方法
const loadData = async () => {
  loading.value = true;
  try {
    // 如果没有传入windowId，先获取商户窗口信息
    if (!windowId.value) {
      const windowData = await getMerchantWindow();
      if (windowData?.windowId) {
        windowId.value = windowData.windowId;
        merchantWindow.value = windowData;
      } else {
        uni.showToast({
          title: "未找到关联的窗口信息",
          icon: "none",
        });
        return;
      }
    }

    // 获取统计数据
    const stats = await getMerchantStatistics(windowId.value);
    statisticsData.value = stats;
  } catch (error) {
    console.error("Failed to load statistics:", error);
    uni.showToast({
      title: "获取统计数据失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  loadData();
};

const setSortBy = (type) => {
  sortBy.value = type;
};

const getBadgeIcon = (index) => {
  const icons = ["medal", "medal-filled", "star"];
  return icons[index] || "star";
};

const getBadgeColor = (index) => {
  const colors = ["#fbbf24", "#9ca3af", "#cd7f32"];
  return colors[index] || "#9ca3af";
};

// 确认退出登录
const confirmLogout = () => {
  uni.showModal({
    title: "退出登录",
    content: "确定要退出登录吗？",
    confirmText: "确定",
    cancelText: "取消",
    success: (res) => {
      if (res.confirm) {
        store.dispatch("logout");
      }
    },
  });
};
</script>

<style scoped>
.statistics-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 20rpx;
}

/* 顶部导航 */
.header {
  background: white;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 40rpx;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.title-text {
  font-size: 36rpx;
  font-weight: 600;
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 20rpx;
}

.refresh-btn,
.logout-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #6b7280;
}

.refresh-btn:active,
.logout-btn:active {
  background: #f1f5f9;
}

.logout-btn {
  border-color: #fecaca;
  background: #fef2f2;
  color: #dc2626;
}

.logout-btn:active {
  background: #fee2e2;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  gap: 20rpx;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 28rpx;
  color: #6b7280;
}

/* 空状态 */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  gap: 20rpx;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #374151;
}

.empty-subtitle {
  font-size: 26rpx;
  color: #6b7280;
  text-align: center;
  line-height: 1.5;
}

/* 内容区域 */
.content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 通用卡片样式 */
.overview-card,
.ranking-card,
.distribution-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1px solid #f1f5f9;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
}

/* 概览统计 */
.overview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.overview-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  background: #fafbfc;
  border-radius: 12rpx;
}

.overview-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.overview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.overview-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
}

.overview-label {
  font-size: 22rpx;
  color: #6b7280;
}

/* 排序控制 */
.sort-controls {
  display: flex;
  gap: 8rpx;
}

.sort-btn {
  padding: 12rpx 20rpx;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10rpx;
  font-size: 24rpx;
  color: #6b7280;
  transition: all 0.3s ease;
}

.sort-btn.active {
  background: #ff7a45;
  color: white;
  border-color: #ff7a45;
}

.sort-btn:active {
  transform: scale(0.95);
}

/* 菜品列表 */
.dish-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.dish-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background: #fafbfc;
  border-radius: 12rpx;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.dish-item.top-dish {
  background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
  border-color: #fbbf24;
}

.dish-rank {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  flex-shrink: 0;
}

.rank-number {
  font-size: 24rpx;
  font-weight: 600;
  color: #1f2937;
}

.dish-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.dish-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #1f2937;
}

.dish-stats {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.rating-section {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.rating-text {
  font-size: 24rpx;
  color: #374151;
}

.comment-count {
  font-size: 22rpx;
  color: #6b7280;
}

.dish-badge {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

/* 无菜品状态 */
.no-dishes {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 60rpx 40rpx;
}

.no-dishes-text {
  font-size: 26rpx;
  color: #6b7280;
}

/* 评分分布 */
.distribution-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.distribution-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.distribution-label {
  width: 120rpx;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  font-size: 24rpx;
  color: #374151;
}

.distribution-count {
  font-size: 20rpx;
  color: #6b7280;
}

.distribution-bar {
  flex: 1;
  height: 16rpx;
  background: #f1f5f9;
  border-radius: 8rpx;
  overflow: hidden;
}

.distribution-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.5s ease;
}

.distribution-percentage {
  width: 80rpx;
  text-align: right;
  font-size: 22rpx;
  color: #6b7280;
}

/* 响应式调整 */
@media screen and (max-width: 750rpx) {
  .overview-stats {
    grid-template-columns: 1fr;
    gap: 16rpx;
  }

  .overview-item {
    padding: 16rpx;
  }

  .overview-icon {
    width: 48rpx;
    height: 48rpx;
  }

  .sort-controls {
    flex-direction: column;
    gap: 8rpx;
  }

  .sort-btn {
    padding: 12rpx 16rpx;
    font-size: 22rpx;
  }
}
</style>
