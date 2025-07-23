<template>
  <uni-popup ref="popup" type="center" background-color="rgba(0,0,0,0.7)">
    <view class="report-modal">
      <!-- 标题栏 -->
      <view class="modal-header">
        <text class="modal-title">举报{{ contentTypeText }}</text>
        <view class="close-btn" @click="closeModal">
          <uni-icons type="closeempty" size="20" color="#999" />
        </view>
      </view>

      <!-- 内容区域 -->
      <view class="modal-content">
        <!-- 举报对象信息 -->
        <view class="target-info">
          <view class="target-type">
            <uni-icons
              :type="getContentIcon()"
              :color="getContentColor()"
              size="18"
            />
            <text class="target-type-text">{{ contentTypeText }}</text>
          </view>
          <text class="target-name">{{ targetName || "未知内容" }}</text>
        </view>

        <!-- 举报原因选择 -->
        <view class="reason-section">
          <text class="section-title">请选择举报原因</text>
          <view class="reason-list">
            <view
              v-for="(reason, index) in reportReasons"
              :key="index"
              class="reason-item"
              :class="{ active: selectedReason === reason }"
              @click="selectReason(reason)"
            >
              <view class="reason-radio">
                <view
                  v-if="selectedReason === reason"
                  class="reason-dot"
                ></view>
              </view>
              <text class="reason-text">{{ reason }}</text>
            </view>
          </view>
        </view>

        <!-- 自定义原因输入 -->
        <view class="custom-reason-section" v-if="selectedReason === '其他'">
          <text class="section-title">请详细描述问题</text>
          <textarea
            class="custom-input"
            v-model="customReason"
            placeholder="请详细描述您遇到的问题..."
            maxlength="200"
            :auto-height="true"
          />
          <view class="char-count">{{ customReason.length }}/200</view>
        </view>

        <!-- 补充说明 -->
        <view
          class="additional-section"
          v-if="selectedReason && selectedReason !== '其他'"
        >
          <text class="section-title">补充说明（可选）</text>
          <textarea
            class="additional-input"
            v-model="additionalInfo"
            placeholder="可以补充更多详细信息..."
            maxlength="100"
            :auto-height="true"
          />
          <view class="char-count">{{ additionalInfo.length }}/100</view>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="modal-footer">
        <button class="cancel-btn" @click="closeModal">取消</button>
        <button
          class="submit-btn"
          @click="submitReport"
          :disabled="!canSubmit"
          :loading="isSubmitting"
        >
          {{ isSubmitting ? "提交中..." : "提交举报" }}
        </button>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { ref, computed, toRefs } from "vue";
import { submitReport as submitReportAPI } from "@/services/api.js";

const emit = defineEmits(["success"]);

const props = defineProps({
  contentType: {
    type: String,
    required: true,
    validator: (value) => ["comment", "dish", "window"].includes(value),
  },
  contentId: {
    type: [Number, String],
    required: true,
  },
  targetName: {
    type: String,
    default: "",
  },
});

const { contentType, contentId, targetName } = toRefs(props);

// 响应式数据
const popup = ref();
const selectedReason = ref("");
const customReason = ref("");
const additionalInfo = ref("");
const isSubmitting = ref(false);

// 举报原因选项
const reportReasons = computed(() => {
  const baseReasons = [
    "包含不当言论",
    "信息不实或误导",
    "垃圾广告信息",
    "涉嫌违法违规",
    "侵犯他人权益",
  ];

  if (contentType.value === "comment") {
    return [...baseReasons, "恶意刷评论", "人身攻击", "其他"];
  } else if (contentType.value === "dish") {
    return [
      ...baseReasons,
      "菜品信息错误",
      "价格信息有误",
      "图片与实物不符",
      "其他",
    ];
  } else if (contentType.value === "window") {
    return [
      ...baseReasons,
      "营业信息错误",
      "位置信息有误",
      "联系方式错误",
      "其他",
    ];
  }
  return [...baseReasons, "其他"];
});

// 计算属性
const contentTypeText = computed(() => {
  const typeMap = {
    comment: "评论",
    dish: "菜品",
    window: "窗口",
  };
  return typeMap[contentType.value] || "内容";
});

const canSubmit = computed(() => {
  if (!selectedReason.value) return false;

  if (selectedReason.value === "其他") {
    return customReason.value.trim().length >= 5;
  }

  return true;
});

const finalReason = computed(() => {
  if (selectedReason.value === "其他") {
    return customReason.value.trim();
  }

  if (additionalInfo.value.trim()) {
    return `${selectedReason.value}（${additionalInfo.value.trim()}）`;
  }

  return selectedReason.value;
});

// 方法
const getContentIcon = () => {
  const iconMap = {
    comment: "chatbubble",
    dish: "star",
    window: "home",
  };
  return iconMap[contentType.value] || "info";
};

const getContentColor = () => {
  const colorMap = {
    comment: "#007AFF",
    dish: "#FF9500",
    window: "#34C759",
  };
  return colorMap[contentType.value] || "#999";
};

const selectReason = (reason) => {
  selectedReason.value = reason;
  // 清空相关输入
  if (reason !== "其他") {
    customReason.value = "";
  }
  if (reason === "其他") {
    additionalInfo.value = "";
  }
};

const openModal = () => {
  popup.value?.open();
};

const closeModal = () => {
  popup.value?.close();
  resetForm();
};

const resetForm = () => {
  selectedReason.value = "";
  customReason.value = "";
  additionalInfo.value = "";
  isSubmitting.value = false;
};

const submitReport = async () => {
  if (!canSubmit.value || isSubmitting.value) return;

  try {
    isSubmitting.value = true;

    await submitReportAPI({
      reportedContentType: contentType.value,
      reportedContentId: Number(contentId.value),
      reportReason: finalReason.value,
    });

    uni.showToast({
      title: "举报提交成功",
      icon: "success",
    });

    emit("success");
    closeModal();
  } catch (error) {
    uni.showToast({
      title: error.message || "提交失败",
      icon: "none",
    });
  } finally {
    isSubmitting.value = false;
  }
};

// 暴露方法给父组件
defineExpose({
  openModal,
  closeModal,
});
</script>

<style scoped>
.report-modal {
  width: 640rpx;
  max-width: 90vw;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  background: #f5f5f5;
  transition: all 0.3s ease;
}

.close-btn:active {
  background: #e5e5e5;
  transform: scale(0.95);
}

.modal-content {
  padding: 32rpx;
  flex: 1;
  overflow-y: auto;
}

.target-info {
  background: #f8f9fa;
  padding: 24rpx;
  border-radius: 16rpx;
  margin-bottom: 32rpx;
}

.target-type {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 8rpx;
}

.target-type-text {
  font-size: 24rpx;
  color: #666;
  font-weight: 500;
}

.target-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
  line-height: 1.4;
}

.reason-section,
.custom-reason-section,
.additional-section {
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
}

.reason-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.reason-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  border: 2rpx solid #f0f0f0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.reason-item:active {
  transform: scale(0.98);
}

.reason-item.active {
  border-color: #007aff;
  background: #f0f8ff;
}

.reason-radio {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 2rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.reason-item.active .reason-radio {
  border-color: #007aff;
  background: #007aff;
}

.reason-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #fff;
}

.reason-text {
  font-size: 28rpx;
  color: #333;
  flex: 1;
}

.custom-input,
.additional-input {
  width: 100%;
  min-height: 120rpx;
  padding: 20rpx;
  border: 2rpx solid #f0f0f0;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
  background: #fafafa;
  resize: none;
  box-sizing: border-box;
}

.custom-input:focus,
.additional-input:focus {
  border-color: #007aff;
  background: #fff;
}

.char-count {
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.modal-footer {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.cancel-btn,
.submit-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:active {
  background: #e5e5e5;
}

.submit-btn {
  background: #007aff;
  color: #fff;
}

.submit-btn:disabled {
  background: #ccc;
  color: #999;
}

.submit-btn:not(:disabled):active {
  background: #0056cc;
  transform: scale(0.98);
}
</style>
