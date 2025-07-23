<template>
  <view class="dish-form-container">
    <text class="page-title">{{ isEdit ? "编辑菜品" : "新增菜品" }}</text>

    <view class="form-section">
      <view class="form-item">
        <text class="label">菜品名称:</text>
        <input
          class="input-field"
          v-model="form.name"
          placeholder="请输入菜品名称"
        />
      </view>
      <view class="form-item">
        <text class="label">菜品价格:</text>
        <input
          class="input-field"
          type="digit"
          v-model="form.price"
          placeholder="请输入菜品价格"
        />
      </view>
      <view class="form-item">
        <text class="label">菜品描述:</text>
        <textarea
          class="textarea-field"
          v-model="form.description"
          placeholder="请输入菜品描述 (可选)"
          maxlength="80"
        ></textarea>
      </view>
      <view class="form-item" v-if="isEdit">
        <text class="label">菜品状态:</text>
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

      <view class="form-item">
        <text class="label">菜品图片:</text>
        <view class="image-preview" v-if="form.imageUrl">
          <image
            :src="resolveDishImage(form.imageUrl)"
            mode="aspectFit"
            class="uploaded-image"
          ></image>
        </view>
        <button
          class="upload-button"
          @click="chooseImage"
          :disabled="isUploadingImage"
        >
          {{
            isUploadingImage
              ? "上传中..."
              : form.imageUrl
              ? "更换图片"
              : "选择图片"
          }}
        </button>
        <text class="upload-tip">建议上传图片，提升菜品吸引力</text>
      </view>

      <view class="form-item">
        <text class="label">菜品标签:</text>
        <view class="tags-input-container">
          <view class="tag-chip" v-for="(tag, index) in form.tags" :key="index">
            {{ tag }}
            <uni-icons
              type="closeempty"
              size="16"
              color="#fff"
              @click="removeTag(index)"
            ></uni-icons>
          </view>
          <input
            class="input-field tag-input"
            v-model="newTag"
            placeholder="添加标签"
            @confirm="addTag"
          />
        </view>
      </view>
    </view>

    <button class="submit-button" @click="submitForm" :disabled="isSubmitting">
      {{ isSubmitting ? "提交中..." : isEdit ? "保存修改" : "新增菜品" }}
    </button>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  getDishDetail,
  merchantAddDish,
  merchantUpdateDish,
  uploadFile,
} from "@/services/api.js";
import { useResolveImagePath } from "@/utils/useResolveImagePath.js";

const isEdit = ref(false);
const windowId = ref(null);
const dishId = ref(null);
const form = reactive({
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  status: "available",
  tags: [],
});
const statusOptions = ref([
  {
    value: "available",
    label: "上架",
  },
  {
    value: "unavailable",
    label: "下架",
  },
]);
const newTag = ref("");
const isSubmitting = ref(false);
const isUploadingImage = ref(false);

const statusIndex = computed(() =>
  statusOptions.value.findIndex((opt) => opt.value === form.status)
);

const resolveDishImage = (path) => useResolveImagePath(path).value;

onLoad(async (options) => {
  windowId.value = options.windowId;
  if (options.dishId) {
    isEdit.value = true;
    dishId.value = options.dishId;
    uni.setNavigationBarTitle({
      title: "编辑菜品",
    });
    await fetchDishDetails(options.dishId);
  } else {
    uni.setNavigationBarTitle({
      title: "新增菜品",
    });
  }
});

const fetchDishDetails = async (id) => {
  uni.showLoading({
    title: "加载中...",
  });
  try {
    const res = await getDishDetail(id);
    form.name = res.name;
    form.description = res.description;
    form.price = res.price;
    form.imageUrl = res.imageUrl;
    form.status = res.status;
    form.tags = res.tags || [];
  } catch (e) {
    console.error("Failed to fetch dish details:", e);
    uni.showToast({
      title: "加载菜品信息失败",
      icon: "none",
    });
  } finally {
    uni.hideLoading();
  }
};

const onStatusChange = (e) => {
  form.status = statusOptions.value[e.detail.value].value;
};

const chooseImage = async () => {
  if (isUploadingImage.value) return;
  try {
    const res = await uni.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
    });
    isUploadingImage.value = true;
    uni.showLoading({
      title: "上传中...",
    });
    const uploadedUrl = await uploadFile("dishes", res.tempFilePaths[0]);
    form.imageUrl = uploadedUrl;
    uni.showToast({
      title: "上传成功",
      icon: "success",
    });
  } catch (err) {
    console.error("Image upload failed:", err);
    uni.showToast({
      title: "上传失败",
      icon: "none",
    });
  } finally {
    uni.hideLoading();
    isUploadingImage.value = false;
  }
};

const addTag = () => {
  const tag = newTag.value.trim();
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag);
    newTag.value = "";
  }
};

const removeTag = (index) => {
  form.tags.splice(index, 1);
};

const submitForm = async () => {
  if (isSubmitting.value) return;

  if (!form.name.trim()) {
    return uni.showToast({
      title: "菜品名称不能为空",
      icon: "none",
    });
  }
  const priceValue = parseFloat(form.price);
  if (isNaN(priceValue) || priceValue <= 0) {
    return uni.showToast({
      title: "价格必须是有效数字且大于0",
      icon: "none",
    });
  }

  isSubmitting.value = true;
  uni.showLoading({
    title: "提交中...",
  });

  try {
    const dataToSubmit = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: priceValue,
      imageUrl: form.imageUrl.trim(),
      tags: form.tags,
      status: form.status,
    };

    if (isEdit.value) {
      await merchantUpdateDish(dishId.value, dataToSubmit);
    } else {
      await merchantAddDish(windowId.value, dataToSubmit);
    }
    uni.showToast({
      title: "操作成功",
      icon: "success",
    });
    setTimeout(() => uni.navigateBack(), 1500);
  } catch (e) {
    console.error("Submission failed:", e);
    uni.showToast({
      title: "操作失败",
      icon: "none",
    });
  } finally {
    uni.hideLoading();
    isSubmitting.value = false;
  }
};
</script>

<style>
.dish-form-container {
  padding: 30rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.page-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 40rpx;
  display: block;
}

.form-section {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.form-item {
  margin-bottom: 30rpx;
  border-bottom: 1px solid #eee;
  padding-bottom: 20rpx;
}

.form-item:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
}

.label {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
  display: block;
}

.input-field,
.textarea-field,
.picker-value {
  width: calc(100% - 20rpx);
  padding: 20rpx;
  border: 1px solid #ddd;
  border-radius: 15rpx;
  font-size: 32rpx;
  color: #333;
  background-color: #f9f9f9;
}

.textarea-field {
  height: 160rpx;
  line-height: 1.5;
}

.picker-value {
  height: 70rpx;
  line-height: 70rpx;
}

.upload-button {
  width: 100%;
  height: 90rpx;
  background-color: #007aff;
  color: #fff;
  border-radius: 20rpx;
  font-size: 32rpx;
  line-height: 90rpx;
  text-align: center;
  margin-top: 20rpx;
}

.upload-button[disabled] {
  background-color: #90caf9;
}

.upload-tip {
  font-size: 26rpx;
  color: #999;
  text-align: center;
  display: block;
  margin-top: 10rpx;
}

.image-preview {
  width: 100%;
  height: 300rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  border-radius: 20rpx;
  overflow: hidden;
  margin-top: 20rpx;
  position: relative;
}

.uploaded-image {
  width: 100%;
  height: 100%;
}

.image-error-tip {
  position: absolute;
  color: #dc3545;
  font-size: 28rpx;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10rpx 20rpx;
  border-radius: 10rpx;
}

.tags-input-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  padding: 10rpx;
  border: 1px solid #ddd;
  border-radius: 15rpx;
  background-color: #f9f9f9;
  min-height: 70rpx;
  align-items: center;
}

.tag-chip {
  background-color: #007aff;
  color: #fff;
  padding: 10rpx 20rpx;
  border-radius: 25rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.tag-chip .uni-icons {
  margin-left: 5rpx;
}

.tag-input {
  flex: 1;
  min-width: 150rpx;
  border: none;
  background-color: transparent;
  padding: 0;
  height: auto;
}

.submit-button {
  width: 100%;
  height: 90rpx;
  background-color: #4caf50;
  color: #fff;
  border-radius: 20rpx;
  font-size: 36rpx;
  line-height: 90rpx;
  text-align: center;
  margin-top: 50rpx;
}

.submit-button[disabled] {
  background-color: #a5d6a7;
}
</style>
