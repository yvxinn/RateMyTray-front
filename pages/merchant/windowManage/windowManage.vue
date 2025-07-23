<template>
  <view class="window-manage-container">
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>
    <view v-else-if="!merchantWindow" class="no-window-info">
      <text>您还没有关联的食堂窗口信息。</text>
      <text class="tip-text">请联系系统管理员分配您的窗口。</text>
    </view>
    <view v-else class="window-details-card">
      <text class="card-title">我的食堂窗口</text>
      <view class="info-item">
        <text class="label">窗口名称:</text>
        <input
          class="value-input"
          v-model="merchantWindow.name"
          placeholder="请输入窗口名称"
        />
      </view>
      <view class="info-item">
        <text class="label">窗口位置:</text>
        <input
          class="value-input"
          v-model="merchantWindow.location"
          placeholder="请输入窗口位置"
        />
      </view>
      <view class="info-item">
        <text class="label">营业时间:</text>
        <input
          class="value-input"
          v-model="merchantWindow.operatingHours"
          placeholder="请输入营业时间"
        />
      </view>
      <view class="info-item">
        <text class="label">营业状态:</text>
        <picker
          @change="onStatusChange"
          :value="statusIndex"
          :range="statusOptions"
          range-key="label"
        >
          <view class="picker-value">{{
            statusOptions[statusIndex].label
          }}</view>
        </picker>
      </view>

      <button
        class="save-button"
        @click="saveWindowInfo"
        :disabled="isSavingWindow"
      >
        {{ isSavingWindow ? "保存中..." : "保存窗口信息" }}
      </button>
      <button
        class="manage-dishes-button"
        @click="goToDishManage"
        :disabled="!merchantWindow || isSavingWindow"
      >
        管理菜品
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import store from "@/store";
import { getWindowDetail, merchantUpdateWindow } from "@/services/api.js";
import { navigateTo, RoutePath } from "@/utils/router.js";

const merchantWindow = ref(null);
const loading = ref(true);
const isSavingWindow = ref(false);
const statusOptions = ref([
  {
    value: "open",
    label: "营业中",
  },
  {
    value: "closed",
    label: "休息中",
  },
]);
const statusIndex = computed(() =>
  merchantWindow.value
    ? statusOptions.value.findIndex(
        (opt) => opt.value === merchantWindow.value?.status
      )
    : 0
);

const user = computed(() => store.state.user);

onShow(() => {
  if (!user.value || user.value.role !== "merchant") {
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
  // Assuming the merchant's user ID is their window ID for this API
  getMerchantWindowInfo(user.value.userId);
});

const getMerchantWindowInfo = async (windowId) => {
  loading.value = true;
  try {
    const res = await getWindowDetail(windowId);
    merchantWindow.value = res;
  } catch (e) {
    console.error("Failed to get merchant window info:", e);
    uni.showToast({
      title: "获取窗口信息失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
};

const onStatusChange = (e) => {
  if (merchantWindow.value) {
    merchantWindow.value.status = statusOptions.value[e.detail.value].value;
  }
};

const saveWindowInfo = async () => {
  if (isSavingWindow.value || !merchantWindow.value) return;

  if (
    !merchantWindow.value.name.trim() ||
    !merchantWindow.value.location.trim() ||
    !merchantWindow.value.operatingHours.trim()
  ) {
    uni.showToast({
      title: "请填写完整的窗口信息",
      icon: "none",
    });
    return;
  }

  isSavingWindow.value = true;
  uni.showLoading({
    title: "保存中...",
  });

  try {
    await merchantUpdateWindow(merchantWindow.value.windowId, {
      name: merchantWindow.value.name,
      location: merchantWindow.value.location,
      operatingHours: merchantWindow.value.operatingHours,
      status: merchantWindow.value.status,
    });
    uni.showToast({
      title: "窗口信息保存成功",
      icon: "success",
    });
    getMerchantWindowInfo(merchantWindow.value.windowId);
  } catch (e) {
    console.error("Failed to save window info:", e);
    uni.showToast({
      title: "保存窗口信息失败",
      icon: "none",
    });
  } finally {
    uni.hideLoading();
    isSavingWindow.value = false;
  }
};

const goToDishManage = () => {
  if (merchantWindow.value?.windowId) {
    navigateTo(RoutePath.MERCHANT_DISH_MANAGE, {
      windowId: merchantWindow.value.windowId,
      windowName: merchantWindow.value.name,
    });
  } else {
    uni.showToast({
      title: "请先加载窗口信息",
      icon: "none",
    });
  }
};
</script>

<style>
.window-manage-container {
  padding: 30rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.loading-state,
.no-window-info {
  text-align: center;
  padding: 80rpx 0;
  color: #999;
  font-size: 32rpx;
}

.tip-text {
  font-size: 28rpx;
  color: #666;
  margin-top: 20rpx;
}

.window-details-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.card-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 40rpx;
  display: block;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  font-size: 32rpx;
  color: #555;
  border-bottom: 1px solid #eee;
  padding-bottom: 20rpx;
}

.info-item:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
}

.label {
  font-weight: bold;
  margin-right: 20rpx;
  min-width: 180rpx;
}

.value-input {
  flex: 1;
  height: 60rpx;
  padding: 0 10rpx;
  border: 1px solid #ddd;
  border-radius: 10rpx;
  font-size: 32rpx;
}

.picker-value {
  flex: 1;
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 10rpx;
  border: 1px solid #ddd;
  border-radius: 10rpx;
  font-size: 32rpx;
  color: #333;
}

.save-button,
.manage-dishes-button {
  width: 100%;
  height: 90rpx;
  border-radius: 20rpx;
  font-size: 36rpx;
  line-height: 90rpx;
  text-align: center;
  margin-top: 40rpx;
  color: #fff;
}

.save-button {
  background-color: #4caf50; /* Green */
}

.save-button[disabled] {
  background-color: #a5d6a7;
}

.manage-dishes-button {
  background-color: #007aff; /* Blue */
}
</style>
