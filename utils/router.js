// utils/router.js

/**
 * @description 页面路径枚举，用于统一管理页面跳转路径
 */
export const RoutePath = {
  // --- TabBar Pages ---
  HOME: "/pages/index/index",
  FAVORITES: "/pages/favorites/favorites",
  NOTIFICATIONS: "/pages/notifications/notifications",
  PROFILE: "/pages/profile/profile",

  // --- Auth Pages ---
  LOGIN: "/pages/login/login",
  REGISTER: "/pages/register/register",

  // --- Detail Pages ---
  WINDOW_DETAIL: "/pages/windowDetail/windowDetail",
  DISH_DETAIL: "/pages/dishDetail/dishDetail",

  // --- Action Pages ---
  COMMENT: "/pages/comment/comment",
  PROFILE_EDIT: "/pages/profile/edit",

  // --- Merchant Pages ---
  MERCHANT_WINDOW_MANAGE: "/pages/merchant/windowManage/windowManage",
  MERCHANT_DISH_MANAGE: "/pages/merchant/dishManage/dishManage",
  MERCHANT_DISH_FORM: "/pages/merchant/dishForm/dishForm",
};

/**
 * @description 封装 uni.navigateTo
 * @param {string} path - RoutePath 中的路径
 * @param {object} [params] - 查询参数
 */
export const navigateTo = (path, params = {}) => {
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  const url = queryString ? `${path}?${queryString}` : path;
  uni.navigateTo({
    url,
  });
};

/**
 * @description 封装 uni.reLaunch
 * @param {string} path - RoutePath 中的路径
 */
export const reLaunch = (path) => {
  uni.reLaunch({
    url: path,
  });
};
