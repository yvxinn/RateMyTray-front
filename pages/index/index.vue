<template>
  <view class="index-container">
    <!-- Enhanced Navigation Bar -->
    <view class="navbar">
      <view class="navbar-content">
        <view class="navbar-left">
          <text class="app-title">小众点评</text>
          <text class="app-subtitle">发现校园美味</text>
        </view>
        <view class="navbar-right">
          <view class="nav-icon-item" @click="goToNotifications">
            <uni-icons type="notification" size="24" color="#fff" />
            <view v-if="unreadCount > 0" class="badge">{{
              unreadCount > 99 ? "99+" : unreadCount
            }}</view>
          </view>
          <view class="nav-icon-item" @click="goToProfile">
            <image class="user-avatar" :src="userAvatarSrc" mode="aspectFill" />
          </view>
          <view class="nav-icon-item nav-text-icon" @click="handleLogout">
            <text class="logout-icon">❌</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Hero Section with Background and Search -->
    <view class="hero-section">
      <view class="hero-bg"></view>
      <view class="hero-content">
        <text class="hero-title">发现与分享</text>
        <text class="hero-subtitle">校园中的每一份美味</text>
        <view class="search-wrapper">
          <uni-easyinput
            prefixIcon="search"
            v-model="searchParams.name"
            placeholder="搜索窗口名称..."
            @confirm="handleSearch"
            :styles="{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderColor: 'transparent',
            }"
            :input-style="{ color: '#333' }"
          />
        </view>
      </view>
    </view>

    <!-- Grouped Category Tags -->
    <view class="tags-section">
      <scroll-view class="tags-scroll-view" scroll-x :show-scrollbar="false">
        <view class="tag-group">
          <view
            :class="[
              'tag-item',
              'clear-all-tag',
              activeTags.length === 0 ? 'active' : '',
            ]"
            @click="onClearAllTags"
          >
            全部 ({{ activeTags.length === 0 ? "已选中" : "清空选择" }})
          </view>
        </view>
        <view
          v-for="(group, category) in groupedTags"
          :key="category"
          class="tag-group"
        >
          <text class="tag-category-title">{{ category }}</text>
          <view
            v-for="tag in group"
            :key="tag.id"
            :class="[
              'tag-item',
              activeTags.includes(tag.tagName) ? 'active' : '',
            ]"
            @click="onTagClick(tag)"
          >
            {{ tag.tagName }}
            <text v-if="activeTags.includes(tag.tagName)" class="tag-check"
              >✓</text
            >
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- Sorting Options -->
    <view class="sort-section" v-if="activeTags.length === 0">
      <view
        v-for="option in sortOptions"
        :key="option.key"
        :class="['sort-option', activeSortKey === option.key ? 'active' : '']"
        @click="changeSort(option)"
      >
        {{ option.label }}
      </view>
    </view>

    <!-- Content Flow -->
    <scroll-view
      scroll-y
      class="window-list-scroll"
      @scrolltolower="onReachBottom"
      @refresherrefresh="onPullDownRefresh"
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
    >
      <!-- Skeleton Loading -->
      <view v-if="isLoading && feedItems.length === 0" class="window-list">
        <view v-for="n in 6" :key="n" class="skeleton-card"></view>
      </view>

      <!-- Content Grid -->
      <view v-else-if="feedItems.length > 0" class="window-list">
        <view
          v-for="(item, index) in feedItems"
          :key="item.type + '-' + (item.windowId || item.dishId) + '-' + index"
        >
          <!-- Window Card (Only shows in '全部' view) -->
          <view
            v-if="item.type === 'window'"
            class="window-card"
            @click="goToDetail(item)"
          >
            <image
              class="cover-image"
              :src="resolveWindowImage(item.coverImageUrl)"
              mode="aspectFill"
            />
            <view class="card-content">
              <view class="card-title">
                <text class="window-name">{{ item.name }}</text>
                <view
                  :class="[
                    'window-status',
                    item.status === 'open' ? 'status-open' : 'status-closed',
                  ]"
                >
                  {{ item.status === "open" ? "营业中" : "休息中" }}
                </view>
              </view>
              <view class="card-info"
                ><text>{{ item.location }}</text></view
              >
              <view class="card-footer">
                <view class="rating-badge">
                  <uni-icons type="star-filled" color="#f59e0b" size="16" />
                  <text class="rating-text"
                    >{{
                      item.averageRating
                        ? item.averageRating.toFixed(1)
                        : "暂无"
                    }}
                    ({{ item.rating_count }} 评)</text
                  >
                </view>
              </view>
            </view>
          </view>
          <!-- Dish Card -->
          <HomeDishCard
            v-else-if="item.type === 'dish'"
            :dish="item"
            @click="goToDetail(item)"
          />
        </view>
      </view>

      <!-- Empty State -->
      <view v-else class="empty-state">
        <text>该分类下暂无内容</text>
      </view>

      <!-- Load More Indicator -->
      <view v-if="isLoading && feedItems.length > 0" class="load-state">
        <uni-load-more status="loading"></uni-load-more>
      </view>
      <view v-if="!hasMore && feedItems.length > 0" class="load-state">
        <uni-load-more status="noMore"></uni-load-more>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import {
  getWindows,
  getWindowDetail,
  getTags,
  getDishesByTags,
} from "@/services/api.js";
import { useResolveImagePath } from "@/utils/useResolveImagePath.js";
import { navigateTo, RoutePath } from "@/utils/router.js";
import HomeDishCard from "@/components/HomeDishCard.vue";

const feedItems = ref([]);
const isLoading = ref(true);
const isRefreshing = ref(false);
const hasMore = ref(true);
const groupedTags = ref({});
const activeTags = ref([]);
const unreadCount = ref(5); // 模拟未读消息数量

const searchParams = reactive({
  name: "",
  page: 1,
  size: 10,
  sortBy: "averageRating",
  order: "desc",
});

const sortOptions = ref([
  { key: "default", label: "综合排序", sortBy: "averageRating", order: "desc" },
  { key: "rating", label: "评分最高", sortBy: "averageRating", order: "desc" },
  {
    key: "popularity",
    label: "人气最高",
    sortBy: "rating_count",
    order: "desc",
  },
]);
const activeSortKey = ref("default");

const resolveWindowImage = (path) =>
  useResolveImagePath(path, "/static/images/default-cover.png").value;

// 用户头像处理
const userAvatarSrc = computed(() => {
  // 这里可以从 store 中获取用户头像，现在先用默认头像
  return useResolveImagePath("", "/static/images/default-avatar.png").value;
});

// --- Navigation Actions ---
const goToNotifications = () => {
  navigateTo(RoutePath.NOTIFICATIONS);
};

const goToProfile = () => {
  navigateTo(RoutePath.PROFILE);
};

const handleLogout = () => {
  uni.showModal({
    title: "确认退出",
    content: "您确定要退出登录吗？",
    success: (res) => {
      if (res.confirm) {
        // 清除用户信息和token
        uni.removeStorageSync("token");
        uni.removeStorageSync("user");

        // 跳转到登录页面
        uni.reLaunch({
          url: RoutePath.LOGIN,
        });

        uni.showToast({
          title: "已退出登录",
          icon: "success",
        });
      }
    },
  });
};

// --- API & Data Logic ---
const fetchWindows = async (isLoadMore = false) => {
  if (isLoading.value && isLoadMore) return;
  isLoading.value = true;
  if (!isLoadMore) {
    searchParams.page = 1;
    hasMore.value = true;
    feedItems.value = [];
  }

  try {
    // 移除发送到后端的排序参数，只保留分页和搜索
    const apiParams = {
      name: searchParams.name,
      page: searchParams.page,
      size: searchParams.size,
    };
    const windowRes = await getWindows(apiParams);

    let newWindows = windowRes.windows.map((w) => ({ ...w, type: "window" }));

    // 前端排序窗口
    const sortKey = searchParams.sortBy;
    const order = searchParams.order;

    if (sortKey) {
      newWindows.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        if (valA < valB) {
          return order === "asc" ? -1 : 1;
        }
        if (valA > valB) {
          return order === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    // 获取菜品数据用于交错显示
    const dishPromises = newWindows
      .slice(0, 3)
      .map((w) => getWindowDetail(w.windowId));
    const detailResults = await Promise.all(dishPromises);
    const extractedDishes = detailResults.flatMap((detail, index) =>
      detail.dishes && detail.dishes.length > 0
        ? [
            {
              ...detail.dishes[0],
              type: "dish",
              windowId: newWindows[index].windowId,
              windowName: newWindows[index].name,
            },
          ]
        : []
    );

    // 交错排列窗口和菜品
    let finalItems = [];
    let dishIndex = 0;
    newWindows.forEach((win, index) => {
      finalItems.push(win);
      if ((index + 1) % 2 === 0 && dishIndex < extractedDishes.length) {
        finalItems.push(extractedDishes[dishIndex++]);
      }
    });

    if (isLoadMore) {
      feedItems.value.push(...finalItems);
    } else {
      feedItems.value = finalItems;
    }

    hasMore.value = searchParams.page < windowRes.pages;
  } catch (error) {
    console.error("Failed to fetch windows:", error);
  } finally {
    isLoading.value = false;
    isRefreshing.value = false;
  }
};

const fetchDishesByTags = async () => {
  isLoading.value = true;
  feedItems.value = [];
  try {
    const dishRes = await getDishesByTags(activeTags.value);
    feedItems.value = dishRes.map((d) => ({ ...d, type: "dish" }));
    hasMore.value = false; // No pagination for tags
  } catch (error) {
    console.error("Failed to fetch dishes by tags:", error);
  } finally {
    isLoading.value = false;
    isRefreshing.value = false;
  }
};

const fetchInitialFeed = () => {
  if (activeTags.value.length > 0) {
    fetchDishesByTags();
  } else {
    fetchWindows();
  }
};

const fetchTags = async () => {
  try {
    const tags = await getTags();
    groupedTags.value = tags.reduce((acc, tag) => {
      const { category } = tag;
      if (!acc[category]) acc[category] = [];
      acc[category].push(tag);
      return acc;
    }, {});
  } catch (error) {
    console.error("Failed to fetch tags:", error);
  }
};

// --- Event Handlers ---
const handleSearch = () => {
  fetchInitialFeed();
};

const onTagClick = (tag) => {
  const tagName = tag.tagName;
  const index = activeTags.value.indexOf(tagName);
  if (index > -1) {
    activeTags.value.splice(index, 1);
  } else {
    activeTags.value.push(tagName);
  }
  fetchInitialFeed();
};

const changeSort = (sortOption) => {
  activeSortKey.value = sortOption.key;
  searchParams.sortBy = sortOption.sortBy;
  searchParams.order = sortOption.order;
  fetchInitialFeed();
};

const onClearAllTags = () => {
  activeTags.value = [];
  fetchInitialFeed();
};

const onPullDownRefresh = () => {
  isRefreshing.value = true;
  fetchInitialFeed();
};

const onReachBottom = () => {
  if (activeTags.value.length === 0 && hasMore.value && !isLoading.value) {
    searchParams.page++;
    fetchWindows(true);
  }
};

const goToDetail = (item) => {
  if (item.type === "dish") {
    navigateTo(RoutePath.DISH_DETAIL, { id: item.dishId });
  } else {
    navigateTo(RoutePath.WINDOW_DETAIL, { id: item.windowId });
  }
};

// --- Lifecycle ---
onMounted(() => {
  // 获取状态栏高度
  const systemInfo = uni.getSystemInfoSync();
  const statusBarHeight = systemInfo.statusBarHeight;
  if (statusBarHeight) {
    document.documentElement.style.setProperty(
      "--status-bar-height",
      `${statusBarHeight}px`
    );
  }

  fetchTags();
  fetchInitialFeed();
});
</script>

<style scoped>
/* Enhanced Navigation Bar */
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #ff8c00 0%, #ff7a45 100%);
  box-shadow: 0 2rpx 12rpx rgba(255, 140, 0, 0.3);
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  padding-top: calc(20rpx + var(--status-bar-height, 0));
  width: 100%;
}

.navbar-left {
  display: flex;
  flex-direction: column;
  padding-left: 30rpx;
}

.app-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.app-subtitle {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4rpx;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 32rpx;
  padding-right: 30rpx;
}

.nav-icon-item {
  position: relative;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transition: all 0.3s ease;
  cursor: pointer;
}

.nav-icon-item:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.nav-icon-item:active {
  transform: scale(0.95);
}

.user-avatar {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.5);
  object-fit: cover;
}

.badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  background-color: #ff4757;
  color: #fff;
  font-size: 20rpx;
  font-weight: 600;
  padding: 4rpx 8rpx;
  border-radius: 12rpx;
  min-width: 24rpx;
  text-align: center;
  line-height: 1;
}

.nav-text-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-icon {
  color: #fff;
  font-size: 28rpx;
  line-height: 1;
}

/* Hero Section */
.hero-section {
  position: relative;
  height: 320rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
}
.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff8c00, #ff7a45);
  z-index: 1;
}
.hero-content {
  z-index: 2;
  padding: 0 40rpx;
}
.hero-title {
  font-size: 52rpx;
  font-weight: bold;
  display: block;
}
.hero-subtitle {
  font-size: 30rpx;
  opacity: 0.9;
  margin-top: 10rpx;
  display: block;
}
.search-wrapper {
  margin-top: 40rpx;
}

/* Grouped Tags Section */
.tags-section {
  padding: 20rpx;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}
.tags-scroll-view {
  white-space: nowrap;
}
.tag-group {
  display: inline-flex;
  align-items: center;
  margin-right: 30rpx;
}
.tag-category-title {
  font-size: 28rpx;
  color: #999;
  font-weight: bold;
  margin-right: 15rpx;
}
.tag-item {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 28rpx;
  margin-right: 20rpx;
  border-radius: 30rpx;
  background-color: #f3f4f6;
  color: #4b5563;
  font-size: 28rpx;
  transition: all 0.2s;
  cursor: pointer;
  user-select: none;
}
.tag-item.active {
  background-color: #ff7a45;
  color: white;
  font-weight: bold;
  box-shadow: 0 2rpx 8rpx rgba(255, 122, 69, 0.3);
}
.tag-item:hover {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}
.clear-all-tag {
  background-color: #e5e7eb !important;
  color: #374151 !important;
  font-weight: 600;
}
.clear-all-tag.active {
  background-color: #10b981 !important;
  color: white !important;
}
.tag-check {
  margin-left: 8rpx;
  font-weight: bold;
  font-size: 24rpx;
}

/* Sorting Section */
.sort-section {
  display: flex;
  padding: 0 20rpx 20rpx;
  background-color: #f7f8fa;
  gap: 20rpx;
  align-items: center;
}
.sort-option {
  padding: 10rpx 24rpx;
  border-radius: 30rpx;
  background-color: #fff;
  color: #6b7280;
  font-size: 28rpx;
  transition: all 0.2s;
  cursor: pointer;
}
.sort-option.active {
  background-color: #ff8c00;
  color: white;
  font-weight: 600;
}

/* Main Container */
.index-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
}

.window-list-scroll {
  height: calc(100vh - 480rpx); /* 调整高度以适应新的导航栏 */
}

/* Window List Grid (retained from previous) */
.window-list {
  padding: 20rpx;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20rpx;
}
@media (min-width: 768px) {
  .window-list {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

/* Card Styles (retained from previous) */
.window-card {
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}
.cover-image {
  width: 100%;
  height: 250rpx;
  background-color: #e9ecef;
}
.card-content {
  padding: 24rpx;
}
.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.window-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #1f2937;
}
.window-status {
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  font-weight: 500;
}
.status-open {
  background-color: #ecfdf5;
  color: #065f46;
}
.status-closed {
  background-color: #fef2f2;
  color: #991b1b;
}
.card-info {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #6b7280;
}
.card-footer {
  margin-top: 20rpx;
  display: flex;
  align-items: center;
}
.rating-badge {
  display: flex;
  align-items: center;
  background-color: #fffbeb;
  padding: 4rpx 10rpx;
  border-radius: 6rpx;
}
.rating-text {
  color: #b45309;
  font-weight: 600;
  font-size: 26rpx;
  margin-left: 6rpx;
}

/* States */
.load-state,
.empty-state {
  text-align: center;
  color: #9ca3af;
  padding: 40rpx 0;
}
.skeleton-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  height: 400rpx; /* Adjusted to better match card height */
}
</style>
