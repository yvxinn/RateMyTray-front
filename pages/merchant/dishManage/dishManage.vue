<template>
  <view class="dish-manage-container">
    <view class="header-bar">
      <text class="window-name-display">{{ windowName }}</text>
      <button class="add-dish-button" @click="goToDishForm('add')">
        <uni-icons type="plus" size="20" color="#fff"></uni-icons>
        新增菜品
      </button>
    </view>

    <scroll-view scroll-y class="dish-list-scroll" @scrolltolower="loadMore">
      <view v-if="loading && dishes.length === 0" class="loading-state"
        >加载中...</view
      >
      <view v-else-if="dishes.length === 0 && !loading" class="no-data"
        >暂无菜品，点击上方“新增菜品”添加</view
      >
      <view class="dish-card" v-for="dish in dishes" :key="dish.dishId">
        <image
          class="dish-image"
          :src="
            dish.imageUrl ||
            'https://placehold.co/100x100/eeeeee/cccccc?text=无图'
          "
          mode="aspectFill"
        ></image>
        <view class="dish-info">
          <text class="dish-name">{{ dish.name }}</text>
          <text class="dish-price"
            >¥{{ dish.price ? dish.price.toFixed(2) : "0.00" }}</text
          >
          <text
            class="dish-status"
            :class="
              dish.status === 'available'
                ? 'status-available'
                : 'status-unavailable'
            "
          >
            {{ dish.status === "available" ? "上架中" : "已下架" }}
          </text>
          <text class="dish-description">{{ dish.description }}</text>
        </view>
        <view class="dish-actions">
          <button
            class="action-button edit-button"
            @click="goToDishForm('edit', dish)"
          >
            编辑
          </button>
          <button
            class="action-button delete-button"
            @click="confirmDelete(dish.dishId)"
          >
            删除
          </button>
        </view>
      </view>
      <view v-if="loading && dishes.length > 0" class="loading-more"
        >加载中...</view
      >
      <view v-if="!hasMore && dishes.length > 0" class="no-more"
        >没有更多了</view
      >
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
import { merchantGetDishes, merchantDeleteDish } from "@/services/api.js";
import { navigateTo, RoutePath } from "@/utils/router.js";
import { useResolveImagePath } from "@/utils/useResolveImagePath.js";

const windowId = ref(null);
const windowName = ref("");
const dishes = ref([]);
const page = ref(1);
const size = ref(10);
const loading = ref(false);
const hasMore = ref(true);
const dishIdToDelete = ref(null);
const alertDialog = ref(null);

const resolveDishImage = (path) =>
  useResolveImagePath(
    path,
    "https://placehold.co/100x100/eeeeee/cccccc?text=无图"
  ).value;

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
    resetAndGetDishList();
  }
});

const resetAndGetDishList = () => {
  page.value = 1;
  dishes.value = [];
  hasMore.value = true;
  getDishList();
};

const getDishList = async () => {
  if (loading.value || !hasMore.value) return;

  loading.value = true;
  try {
    const res = await merchantGetDishes(windowId.value, {
      page: page.value,
      size: size.value,
    });
    // Assuming API returns { dishes: [], pages: number }
    if (res.dishes && res.dishes.length > 0) {
      dishes.value.push(...res.dishes);
      page.value++;
      hasMore.value = page.value <= res.pages;
    } else {
      hasMore.value = false;
    }
  } catch (e) {
    console.error("Failed to get dish list:", e);
    uni.showToast({
      title: "获取菜品列表失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
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
    resetAndGetDishList();
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

.dish-status {
  font-size: 26rpx;
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
  align-self: flex-start;
  margin-bottom: 8rpx;
}

.status-available {
  background-color: #e6ffe6;
  color: #28a745;
}

.status-unavailable {
  background-color: #ffe6e6;
  color: #dc3545;
}

.dish-description {
  font-size: 28rpx;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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
  font-size: 28rpx;
  line-height: 65rpx;
  border-radius: 15rpx;
  text-align: center;
  color: #fff;
  padding: 0;
}

.edit-button {
  background-color: #ffc107; /* Yellow */
}

.delete-button {
  background-color: #dc3545; /* Red */
}

.no-data,
.loading-more,
.no-more,
.loading-state {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 30rpx;
}
</style>
