<template>
  <view class="window-manage-container">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="header-content">
        <view class="header-title">
          <uni-icons type="shop" size="28" color="#ff7a45"></uni-icons>
          <text class="title-text">窗口管理</text>
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

    <!-- 无窗口信息 -->
    <view v-else-if="!merchantWindow" class="empty-container">
      <uni-icons type="home" size="80" color="#d1d5db"></uni-icons>
      <text class="empty-title">暂无窗口信息</text>
      <text class="empty-subtitle"
        >您还没有关联的食堂窗口，请联系管理员分配</text
      >
    </view>

    <!-- 窗口信息卡片 -->
    <view v-else class="content">
      <!-- 统计卡片 -->
      <view class="stats-grid">
        <view class="stat-card">
          <view
            class="stat-icon"
            style="background-color: rgba(255, 122, 69, 0.1)"
          >
            <uni-icons type="shop" size="24" color="#ff7a45"></uni-icons>
          </view>
          <view class="stat-content">
            <text class="stat-value">{{
              merchantWindow.windowName || "--"
            }}</text>
            <text class="stat-label">窗口名称</text>
          </view>
        </view>

        <view class="stat-card">
          <view
            class="stat-icon"
            style="background-color: rgba(34, 197, 94, 0.1)"
          >
            <uni-icons type="location" size="24" color="#22c55e"></uni-icons>
          </view>
          <view class="stat-content">
            <text class="stat-value"
              >{{ merchantWindow.canteenName
              }}{{
                merchantWindow.floor ? " " + merchantWindow.floor + "楼" : ""
              }}</text
            >
            <text class="stat-label">食堂位置</text>
          </view>
        </view>

        <view class="stat-card">
          <view
            class="stat-icon"
            style="background-color: rgba(59, 130, 246, 0.1)"
          >
            <uni-icons type="star" size="24" color="#3b82f6"></uni-icons>
          </view>
          <view class="stat-content">
            <text class="stat-value"
              >{{ averageRating.toFixed(1) }} ({{ ratingCount }}条)</text
            >
            <text class="stat-label">用户评分</text>
          </view>
        </view>

        <view class="stat-card">
          <view
            class="stat-icon"
            style="background-color: rgba(168, 85, 247, 0.1)"
          >
            <uni-icons type="coffee" size="24" color="#a855f7"></uni-icons>
          </view>
          <view class="stat-content">
            <text class="stat-value">{{ dishCount }} 个</text>
            <text class="stat-label">菜品总数</text>
          </view>
        </view>

        <view class="stat-card">
          <view
            class="stat-icon"
            style="background-color: rgba(251, 191, 36, 0.1)"
          >
            <uni-icons type="phone" size="24" color="#fbbf24"></uni-icons>
          </view>
          <view class="stat-content">
            <text class="stat-value">{{
              merchantWindow.phoneNumber || "--"
            }}</text>
            <text class="stat-label">联系电话</text>
          </view>
        </view>

        <view class="stat-card">
          <view
            class="stat-icon"
            :style="{ backgroundColor: statusColor + '20' }"
          >
            <uni-icons
              :type="statusIcon"
              size="24"
              :color="statusColor"
            ></uni-icons>
          </view>
          <view class="stat-content">
            <text class="stat-value" :style="{ color: statusColor }">{{
              statusText
            }}</text>
            <text class="stat-label">营业状态</text>
          </view>
        </view>
      </view>

      <!-- 窗口信息编辑卡片 -->
      <view class="info-card">
        <view class="card-header">
          <text class="card-title">窗口信息</text>
          <view class="card-actions">
            <button class="edit-btn" @click="toggleEdit">
              <uni-icons
                :type="isEditing ? 'close' : 'compose'"
                size="18"
                :color="isEditing ? '#ef4444' : '#6b7280'"
              ></uni-icons>
              <text>{{ isEditing ? "取消" : "编辑" }}</text>
            </button>
          </view>
        </view>

        <view class="form-grid">
          <view class="form-item">
            <text class="form-label">窗口名称</text>
            <input
              v-if="isEditing"
              class="form-input"
              v-model="editForm.windowName"
              placeholder="请输入窗口名称"
            />
            <text v-else class="form-value">{{
              merchantWindow.windowName || "--"
            }}</text>
          </view>

          <view class="form-item">
            <text class="form-label">窗口描述</text>
            <textarea
              v-if="isEditing"
              class="form-textarea"
              v-model="editForm.description"
              placeholder="请输入窗口描述"
              :maxlength="200"
            />
            <text v-else class="form-value">{{
              merchantWindow.description || "--"
            }}</text>
          </view>

          <view class="form-item">
            <text class="form-label">食堂名称</text>
            <input
              v-if="isEditing"
              class="form-input"
              v-model="editForm.canteenName"
              placeholder="请输入食堂名称"
            />
            <text v-else class="form-value">{{
              merchantWindow.canteenName || "--"
            }}</text>
          </view>

          <view class="form-item">
            <text class="form-label">楼层</text>
            <input
              v-if="isEditing"
              class="form-input"
              v-model.number="editForm.floor"
              placeholder="请输入楼层"
              type="number"
            />
            <text v-else class="form-value">{{
              merchantWindow.floor ? merchantWindow.floor + "楼" : "--"
            }}</text>
          </view>

          <view class="form-item">
            <text class="form-label">联系电话</text>
            <input
              v-if="isEditing"
              class="form-input"
              v-model="editForm.phoneNumber"
              placeholder="请输入联系电话"
              type="tel"
            />
            <text v-else class="form-value">{{
              merchantWindow.phoneNumber || "--"
            }}</text>
          </view>

          <view class="form-item">
            <text class="form-label">营业时间</text>
            <input
              v-if="isEditing"
              class="form-input"
              v-model="editForm.businessHours"
              placeholder="例: 周一至周五: 10:00-20:00, 周末: 11:00-20:00"
            />
            <text v-else class="form-value">{{
              formatBusinessHours(merchantWindow.businessHours) || "--"
            }}</text>
          </view>

          <view class="form-item">
            <text class="form-label">窗口公告</text>
            <textarea
              v-if="isEditing"
              class="form-textarea"
              v-model="editForm.announcement"
              placeholder="请输入窗口公告"
              :maxlength="100"
            />
            <text v-else class="form-value">{{
              merchantWindow.announcement || "--"
            }}</text>
          </view>

          <view class="form-item">
            <text class="form-label">营业状态</text>
            <picker
              v-if="isEditing"
              @change="onStatusChange"
              :value="statusIndex"
              :range="statusOptions"
              range-key="label"
              class="status-picker"
            >
              <view class="picker-display">
                <text>{{ statusOptions[statusIndex].label }}</text>
                <uni-icons type="bottom" size="16" color="#9ca3af"></uni-icons>
              </view>
            </picker>
            <text v-else class="form-value" :style="{ color: statusColor }">{{
              statusText
            }}</text>
          </view>
        </view>

        <view v-if="isEditing" class="form-actions">
          <button
            class="save-btn"
            @click="saveWindowInfo"
            :loading="isSaving"
            :disabled="isSaving"
          >
            <uni-icons
              type="checkmarkempty"
              size="18"
              color="white"
            ></uni-icons>
            <text>{{ isSaving ? "保存中..." : "保存" }}</text>
          </button>
          <button class="cancel-btn" @click="cancelEdit">
            <uni-icons type="close" size="18" color="#6b7280"></uni-icons>
            <text>取消</text>
          </button>
        </view>
      </view>

      <!-- 快捷操作卡片 -->
      <view class="quick-actions-card">
        <view class="card-header">
          <text class="card-title">快捷操作</text>
        </view>
        <view class="actions-grid">
          <button class="action-btn" @click="goToDishManage">
            <view class="action-icon">
              <uni-icons type="coffee" size="28" color="#ff7a45"></uni-icons>
            </view>
            <text class="action-text">菜品管理</text>
            <text class="action-desc">管理窗口菜品</text>
          </button>

          <button class="action-btn" @click="viewComments">
            <view class="action-icon">
              <uni-icons type="chat" size="28" color="#3b82f6"></uni-icons>
            </view>
            <text class="action-text">用户评价</text>
            <text class="action-desc">查看用户反馈</text>
          </button>

          <button class="action-btn" @click="viewStats">
            <view class="action-icon">
              <uni-icons type="bars" size="28" color="#22c55e"></uni-icons>
            </view>
            <text class="action-text">数据统计</text>
            <text class="action-desc">查看经营数据</text>
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, reactive } from "vue";
import { onShow } from "@dcloudio/uni-app";
import store from "@/store";
import { getMerchantWindow, merchantUpdateWindow } from "@/services/api.js";
import { navigateTo, RoutePath } from "@/utils/router.js";

// 数据状态
const merchantWindow = ref(null);
const loading = ref(true);
const isEditing = ref(false);
const isSaving = ref(false);

// 编辑表单
const editForm = reactive({
  windowName: "",
  description: "",
  canteenName: "",
  floor: "",
  phoneNumber: "",
  businessHours: "",
  announcement: "",
  status: "open",
});

// 状态选项
const statusOptions = [
  { value: "open", label: "营业中" },
  { value: "closed", label: "休息中" },
];

// 计算属性
const statusIndex = computed(() =>
  statusOptions.findIndex(
    (opt) =>
      opt.value ===
      (isEditing.value ? editForm.status : merchantWindow.value?.status)
  )
);

const statusText = computed(() => {
  const status = isEditing.value
    ? editForm.status
    : merchantWindow.value?.status;
  const option = statusOptions.find((opt) => opt.value === status);
  return option?.label || "--";
});

const statusColor = computed(() => {
  const status = isEditing.value
    ? editForm.status
    : merchantWindow.value?.status;
  return status === "open" ? "#22c55e" : "#ef4444";
});

const statusIcon = computed(() => {
  const status = isEditing.value
    ? editForm.status
    : merchantWindow.value?.status;
  return status === "open" ? "checkmarkempty" : "closeempty";
});

// 格式化营业时间显示
const formatBusinessHours = (businessHours) => {
  if (!businessHours) return "--";
  try {
    const hours =
      typeof businessHours === "string"
        ? JSON.parse(businessHours)
        : businessHours;
    const mondayFriday = hours["mon-fri"] || "--";
    const weekend = hours["sat-sun"] || "--";
    return `周一至周五: ${mondayFriday}, 周末: ${weekend}`;
  } catch (error) {
    return businessHours.toString();
  }
};

// 解析营业时间为编辑格式
const parseBusinessHours = (businessHours) => {
  if (!businessHours) return "";
  try {
    const hours =
      typeof businessHours === "string"
        ? JSON.parse(businessHours)
        : businessHours;
    const mondayFriday = hours["mon-fri"] || "";
    const weekend = hours["sat-sun"] || "";
    return `周一至周五: ${mondayFriday}, 周末: ${weekend}`;
  } catch (error) {
    return businessHours.toString();
  }
};

// 统计信息
const dishCount = computed(() => merchantWindow.value?.dishes?.length || 0);
const averageRating = computed(() => merchantWindow.value?.averageRating || 0);
const ratingCount = computed(() => merchantWindow.value?.ratingCount || 0);

// 页面显示时执行
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

  loadMerchantWindow();
});

// 加载商户窗口信息
const loadMerchantWindow = async () => {
  loading.value = true;
  try {
    const result = await getMerchantWindow();
    merchantWindow.value = result;

    // 初始化编辑表单
    if (result) {
      Object.assign(editForm, {
        windowName: result.windowName || "",
        description: result.description || "",
        canteenName: result.canteenName || "",
        floor: result.floor || "",
        phoneNumber: result.phoneNumber || "",
        businessHours: parseBusinessHours(result.businessHours),
        announcement: result.announcement || "",
        status: result.status || "open",
      });
    }
  } catch (error) {
    console.error("Failed to load merchant window:", error);
    uni.showToast({
      title: "获取窗口信息失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const refreshData = () => {
  loadMerchantWindow();
};

// 切换编辑状态
const toggleEdit = () => {
  if (isEditing.value) {
    cancelEdit();
  } else {
    isEditing.value = true;
  }
};

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false;
  if (merchantWindow.value) {
    Object.assign(editForm, {
      windowName: merchantWindow.value.windowName || "",
      description: merchantWindow.value.description || "",
      canteenName: merchantWindow.value.canteenName || "",
      floor: merchantWindow.value.floor || "",
      phoneNumber: merchantWindow.value.phoneNumber || "",
      businessHours: parseBusinessHours(merchantWindow.value.businessHours),
      announcement: merchantWindow.value.announcement || "",
      status: merchantWindow.value.status || "open",
    });
  }
};

// 状态改变
const onStatusChange = (e) => {
  editForm.status = statusOptions[e.detail.value].value;
};

// 将编辑格式的营业时间转换为JSON格式
const convertBusinessHoursToJson = (businessHoursText) => {
  if (!businessHoursText) return "";

  try {
    // 尝试解析格式: "周一至周五: 10:00-20:00, 周末: 11:00-20:00"
    const parts = businessHoursText.split(",");
    const result = {};

    for (const part of parts) {
      const trimmedPart = part.trim();
      if (
        trimmedPart.includes("周一至周五") ||
        trimmedPart.includes("工作日")
      ) {
        const timeMatch = trimmedPart.match(/(\d{1,2}:\d{2}-\d{1,2}:\d{2})/);
        if (timeMatch) {
          result["mon-fri"] = timeMatch[1];
        }
      } else if (
        trimmedPart.includes("周末") ||
        trimmedPart.includes("休息日")
      ) {
        const timeMatch = trimmedPart.match(/(\d{1,2}:\d{2}-\d{1,2}:\d{2})/);
        if (timeMatch) {
          result["sat-sun"] = timeMatch[1];
        }
      }
    }

    return JSON.stringify(result);
  } catch (error) {
    // 如果解析失败，返回原始文本
    return businessHoursText;
  }
};

// 保存窗口信息
const saveWindowInfo = async () => {
  if (!merchantWindow.value?.windowId) {
    uni.showToast({
      title: "窗口信息不完整",
      icon: "none",
    });
    return;
  }

  // 表单验证
  if (!editForm.windowName.trim()) {
    uni.showToast({
      title: "请输入窗口名称",
      icon: "none",
    });
    return;
  }

  if (!editForm.canteenName.trim()) {
    uni.showToast({
      title: "请输入食堂名称",
      icon: "none",
    });
    return;
  }

  // 验证电话号码格式
  if (editForm.phoneNumber && !/^1[3-9]\d{9}$/.test(editForm.phoneNumber)) {
    uni.showToast({
      title: "请输入正确的手机号码",
      icon: "none",
    });
    return;
  }

  isSaving.value = true;
  try {
    const updateData = {
      windowName: editForm.windowName,
      description: editForm.description,
      canteenName: editForm.canteenName,
      floor: editForm.floor ? Number(editForm.floor) : null,
      phoneNumber: editForm.phoneNumber,
      businessHours: convertBusinessHoursToJson(editForm.businessHours),
      announcement: editForm.announcement,
      status: editForm.status,
    };

    await merchantUpdateWindow(merchantWindow.value.windowId, updateData);

    uni.showToast({
      title: "保存成功",
      icon: "success",
    });

    isEditing.value = false;
    await loadMerchantWindow(); // 重新加载数据
  } catch (error) {
    console.error("Failed to save window info:", error);
    uni.showToast({
      title: "保存失败",
      icon: "none",
    });
  } finally {
    isSaving.value = false;
  }
};

// 跳转到菜品管理
const goToDishManage = () => {
  if (merchantWindow.value?.windowId) {
    navigateTo(RoutePath.MERCHANT_DISH_MANAGE, {
      windowId: merchantWindow.value.windowId,
      windowName: merchantWindow.value.windowName,
    });
  } else {
    uni.showToast({
      title: "请先加载窗口信息",
      icon: "none",
    });
  }
};

// 查看评价
const viewComments = () => {
  uni.showToast({
    title: "评价管理功能开发中",
    icon: "none",
  });
};

// 查看统计
const viewStats = () => {
  if (merchantWindow.value?.windowId) {
    navigateTo(RoutePath.MERCHANT_STATISTICS, {
      windowId: merchantWindow.value.windowId,
      windowName: merchantWindow.value.windowName,
    });
  } else {
    uni.showToast({
      title: "请先加载窗口信息",
      icon: "none",
    });
  }
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
.window-manage-container {
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

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.stat-card {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.stat-card:active {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0; /* 允许文本截断 */
}

.stat-value {
  font-size: 24rpx;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-label {
  font-size: 20rpx;
  color: #6b7280;
}

/* 信息卡片 */
.info-card,
.quick-actions-card {
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

.card-actions {
  display: flex;
  gap: 16rpx;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.edit-btn:active {
  background: #f1f5f9;
}

/* 表单网格 */
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.form-label {
  font-size: 26rpx;
  font-weight: 500;
  color: #374151;
}

.form-input {
  padding: 20rpx 24rpx;
  border: 2px solid #e5e7eb;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #1f2937;
  background: #fafbfc;
  transition: all 0.3s ease;
}

.form-input:focus {
  border-color: #ff7a45;
  background: white;
  box-shadow: 0 0 0 4rpx rgba(255, 122, 69, 0.1);
}

.form-value {
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: #1f2937;
  background: #f8fafc;
  border-radius: 12rpx;
  border: 2px solid transparent;
}

.form-textarea {
  padding: 20rpx 24rpx;
  border: 2px solid #e5e7eb;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #1f2937;
  background: #fafbfc;
  transition: all 0.3s ease;
  min-height: 100rpx; /* 确保文本域有最小高度 */
  line-height: 1.5;
  box-sizing: border-box; /* 包含内边距 */
}

.form-textarea:focus {
  border-color: #ff7a45;
  background: white;
  box-shadow: 0 0 0 4rpx rgba(255, 122, 69, 0.1);
}

.status-picker {
  border: 2px solid #e5e7eb;
  border-radius: 12rpx;
  background: #fafbfc;
}

.picker-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: #1f2937;
}

/* 表单操作 */
.form-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}

.save-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #ff7a45 0%, #ff5a1f 100%);
  color: white;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(255, 122, 69, 0.3);
}

.save-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(255, 122, 69, 0.3);
}

.save-btn:disabled {
  opacity: 0.6;
  transform: none;
}

.cancel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 24rpx 32rpx;
  background: #f8fafc;
  color: #6b7280;
  border: 1px solid #e2e8f0;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.cancel-btn:active {
  background: #f1f5f9;
}

/* 快捷操作 */
.actions-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background: #fafbfc;
  border: 1px solid #e5e7eb;
  border-radius: 12rpx;
  text-align: left;
  transition: all 0.3s ease;
}

.action-btn:active {
  background: #f1f5f9;
  transform: translateY(1rpx);
}

.action-icon {
  width: 64rpx;
  height: 64rpx;
  background: rgba(255, 122, 69, 0.1);
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4rpx;
}

.action-desc {
  font-size: 22rpx;
  color: #6b7280;
}

/* 响应式调整 */
@media screen and (max-width: 750rpx) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12rpx;
  }

  .stat-card {
    padding: 20rpx;
    gap: 12rpx;
  }

  .stat-icon {
    width: 48rpx;
    height: 48rpx;
  }

  .stat-value {
    font-size: 22rpx;
  }

  .stat-label {
    font-size: 18rpx;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-btn {
    padding: 24rpx;
  }
}
</style>
