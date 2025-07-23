<template>
  <view class="dish-manage-container">
    <view class="header-bar">
      <text class="window-name-display">{{ windowName }}</text>
      <button class="add-dish-button" @click="goToDishForm('add')">
        <uni-icons type="plus" size="20" color="#fff"></uni-icons>
        新增菜品
      </button>
    </view>

    <scroll-view
      scroll-y
      class="dish-list-scroll"
      @scrolltolower="refreshDishList"
      :enable-back-to-top="true"
    >
      <view v-if="loading" class="loading-state">
        <uni-icons
          type="spinner-cycle"
          size="40"
          color="#007aff"
          class="loading-icon"
        ></uni-icons>
        <text>加载中...</text>
      </view>
      <view v-else-if="dishes.length === 0" class="no-data">
        <uni-icons type="coffee" size="60" color="#cccccc"></uni-icons>
        <text>暂无菜品，点击上方"新增菜品"添加</text>
      </view>
      <view v-else>
        <view class="dish-card" v-for="dish in dishes" :key="dish.dishId">
          <image
            class="dish-image"
            :src="resolveDishImage(dish.imageUrl)"
            mode="aspectFill"
            @error="handleImageError"
          ></image>
          <view class="dish-info">
            <text class="dish-name">{{ dish.name }}</text>
            <text class="dish-price">¥{{ (dish.price || 0).toFixed(2) }}</text>
            <view class="dish-meta">
              <text class="dish-status" :class="getStatusClass(dish.status)">
                {{ getStatusText(dish.status) }}
              </text>
              <text class="dish-id">#{{ dish.dishId }}</text>
            </view>
            <text class="dish-description">{{
              dish.description || "暂无描述"
            }}</text>
          </view>
          <view class="dish-actions">
            <button
              class="action-button edit-button"
              @click="goToDishForm('edit', dish)"
            >
              <uni-icons type="compose" size="14" color="#fff"></uni-icons>
              <text class="button-text">编辑</text>
            </button>
            <button
              class="action-button delete-button"
              @click="confirmDelete(dish.dishId)"
            >
              <uni-icons type="trash" size="14" color="#fff"></uni-icons>
              <text class="button-text">删除</text>
            </button>
          </view>
        </view>

        <view class="list-footer">
          <uni-icons type="checkmarkempty" size="20" color="#999"></uni-icons>
          <text>共 {{ dishes.length }} 个菜品</text>
        </view>
      </view>
    </scroll-view>

    <!-- Confirmation dialog for deletion -->
    <uni-popup ref="alertDialog" type="dialog">
      <uni-popup-dialog
        type="warn"
        cancelText="取消"
        confirmText="确认"
        title="提示"
        content="确定要删除此菜品吗？"
        @confirm="deleteDish"
      ></uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { getWindowDetail, merchantDeleteDish } from "@/services/api.js";
import { navigateTo, RoutePath } from "@/utils/router.js";
import { useResolveImagePath } from "@/utils/useResolveImagePath.js";

const windowId = ref(null);
const windowName = ref("");
const dishes = ref([]);
const loading = ref(false);
const dishIdToDelete = ref(null);
const alertDialog = ref(null);

const resolveDishImage = (path) =>
  useResolveImagePath(
    path,
    "https://placehold.co/100x100/eeeeee/cccccc?text=无图"
  ).value;

// 处理图片加载错误
const handleImageError = (e) => {
  // 设置默认图片
  e.target.src = "https://placehold.co/100x100/eeeeee/cccccc?text=无图";
};

onLoad((options) => {
  if (options.windowId) {
    windowId.value = options.windowId;
    windowName.value = decodeURIComponent(options.windowName || "我的窗口");
  } else {
    uni.showToast({
      title: "窗口ID缺失",
      icon: "none",
    });
    setTimeout(() => uni.navigateBack(), 1500);
  }
});

onShow(() => {
  if (windowId.value) {
    getDishList();
  }
});

// 获取菜品列表（通过窗口详情API）
const getDishList = async () => {
  if (loading.value) return;

  loading.value = true;
  try {
    const windowDetail = await getWindowDetail(windowId.value);

    if (windowDetail && windowDetail.dishes) {
      dishes.value = windowDetail.dishes;
      // 更新窗口名称（如果有变化）
      if (windowDetail.windowName) {
        windowName.value = windowDetail.windowName;
      }
    } else {
      dishes.value = [];
    }
  } catch (e) {
    console.error("Failed to get dish list:", e);
    uni.showToast({
      title: "获取菜品列表失败",
      icon: "none",
    });
    dishes.value = [];
  } finally {
    loading.value = false;
  }
};

// 刷新菜品列表
const refreshDishList = () => {
  getDishList();
};

const goToDishForm = (type, dish = null) => {
  const params = {
    windowId: windowId.value,
    windowName: windowName.value,
  };
  if (type === "edit" && dish) {
    params.dishId = dish.dishId;
  }
  navigateTo(RoutePath.MERCHANT_DISH_FORM, params);
};

const confirmDelete = (id) => {
  dishIdToDelete.value = id;
  alertDialog.value.open();
};

const deleteDish = async () => {
  if (!dishIdToDelete.value) return;

  uni.showLoading({
    title: "删除中...",
  });
  try {
    await merchantDeleteDish(dishIdToDelete.value);
    uni.showToast({
      title: "菜品删除成功",
      icon: "success",
    });
    // 重新获取菜品列表
    getDishList();
  } catch (e) {
    console.error("Failed to delete dish:", e);
    uni.showToast({
      title: "删除失败",
      icon: "none",
    });
  } finally {
    uni.hideLoading();
    dishIdToDelete.value = null;
  }
};

// 获取状态样式类名
const getStatusClass = (status) => {
  switch (status) {
    case "available":
      return "status-available";
    case "unavailable":
      return "status-unavailable";
    case "pending":
      return "status-pending";
    default:
      return "status-unknown";
  }
};

// 获取状态显示文本
const getStatusText = (status) => {
  switch (status) {
    case "available":
      return "上架中";
    case "unavailable":
      return "已下架";
    case "pending":
      return "待审核";
    default:
      return "未知状态";
  }
};
</script>

<style>
.dish-manage-container {
  padding: 20rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 20rpx 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.window-name-display {
  font-size: 38rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
  margin-right: 20rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.add-dish-button {
  background-color: #007aff;
  color: #fff;
  font-size: 30rpx;
  height: 70rpx;
  line-height: 70rpx;
  border-radius: 15rpx;
  padding: 0 25rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-dish-button .uni-icons {
  margin-right: 10rpx;
}

.dish-list-scroll {
  height: calc(100vh - 180rpx); /* Subtract header and padding height */
}

.dish-card {
  display: flex;
  background-color: #fff;
  border-radius: 20rpx;
  margin-bottom: 25rpx;
  padding: 25rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  align-items: center;
}

.dish-image {
  width: 180rpx;
  height: 180rpx;
  border-radius: 15rpx;
  margin-right: 30rpx;
  flex-shrink: 0;
}

.dish-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-right: 20rpx;
}

.dish-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.dish-price {
  font-size: 32rpx;
  color: #e44d26;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.dish-meta {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.dish-status {
  font-size: 26rpx;
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  align-self: flex-start;
  margin-right: 10rpx;
}

.status-available {
  background-color: #e6ffe6;
  color: #28a745;
}

.status-unavailable {
  background-color: #ffe6e6;
  color: #dc3545;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-unknown {
  background-color: #f8f9fa;
  color: #6c757d;
}

.dish-id {
  font-size: 24rpx;
  color: #666;
  font-family: monospace;
}

.dish-description {
  font-size: 28rpx;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.dish-actions {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  flex-shrink: 0;
}

.action-button {
  width: 120rpx;
  height: 65rpx;
  font-size: 22rpx;
  border-radius: 15rpx;
  text-align: center;
  color: #fff;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  flex-direction: row;
  border: none;
  box-sizing: border-box;
}

.button-text {
  font-size: 22rpx;
  color: #fff;
  line-height: 1;
}

.edit-button {
  background-color: #ffc107; /* Yellow */
}

.edit-button:active {
  background-color: #e0a800;
}

.delete-button {
  background-color: #dc3545; /* Red */
}

.delete-button:active {
  background-color: #c82333;
}

.no-data,
.loading-state,
.list-footer {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.loading-state {
  padding: 80rpx 0;
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

.list-footer {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
  font-size: 26rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  margin-top: 20rpx;
  border-top: 1px solid #f0f0f0;
}

/* 响应式优化 */
@media screen and (max-width: 750rpx) {
  .dish-card {
    padding: 20rpx;
  }

  .dish-image {
    width: 150rpx;
    height: 150rpx;
    margin-right: 20rpx;
  }

  .action-button {
    width: 100rpx;
    height: 60rpx;
    font-size: 20rpx;
    gap: 3rpx;
  }

  .button-text {
    font-size: 20rpx;
  }

  .dish-actions {
    gap: 12rpx;
  }
}
</style>
