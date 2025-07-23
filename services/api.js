import request from "@/utils/request";
const BASE_URL = "/api"; // 与 request.js 保持一致

// =====================================================================================
// 通用模块
// =====================================================================================

/**
 * 通用文件上传
 * @param {string} fileType - 上传文件类型，例如 'avatars', 'dishes', 'comments'
 * @param {string} filePath - uni.chooseImage 返回的临时文件路径
 */
export function uploadFile(fileType, filePath) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync("token");

    uni.uploadFile({
      url: `${BASE_URL}/upload/${fileType}`,
      filePath: filePath,
      name: "file", // 后端接收文件的字段名，根据API文档为 'file'
      header: {
        Authorization: `Bearer ${token}`,
      },
      success: (uploadRes) => {
        if (uploadRes.statusCode >= 200 && uploadRes.statusCode < 300) {
          const data = JSON.parse(uploadRes.data);
          if (data.code === 201) {
            resolve(data.data); // 返回 { fileUrl: '...' }
          } else {
            uni.showToast({ title: data.message || "上传失败", icon: "none" });
            reject(data);
          }
        } else {
          uni.showToast({
            title: `上传失败: ${uploadRes.statusCode}`,
            icon: "none",
          });
          reject(uploadRes);
        }
      },
      fail: (err) => {
        uni.showToast({ title: "网络错误，上传失败", icon: "none" });
        reject(err);
      },
    });
  });
}

// =====================================================================================
// 用户模块 (user)
// =====================================================================================

/**
 * 用户注册
 * @param {object} data - { username, password, contactInfo }
 */
export function register(data) {
  return request({
    url: "/users/register",
    method: "post",
    data,
  });
}

/**
 * 用户登录
 * @param {object} data - { username, password }
 */
export function login(data) {
  return request({
    url: "/users/login",
    method: "post",
    data,
  });
}

/**
 * 获取个人信息
 * @param {number} userId
 */
export function getUserInfo(userId) {
  return request({
    url: `/users/${userId}`,
    method: "get",
  });
}

/**
 * 修改个人信息
 * @param {number} userId
 * @param {object} data
 */
export function updateUserInfo(userId, data) {
  return request({
    url: `/users/${userId}`,
    method: "put",
    data,
  });
}

// =====================================================================================
// 窗口模块 (window)
// =====================================================================================

/**
 * 获取食堂窗口列表
 * @param {object} params - { name, location, status, sortBy, order, page, size }
 */
export function getWindows(params) {
  return request({
    url: "/windows",
    method: "get",
    data: params,
  });
}

/**
 * 获取食堂窗口详情
 * @param {number} windowId
 */
export function getWindowDetail(windowId) {
  return request({
    url: `/windows/${windowId}`,
    method: "get",
  });
}

/**
 * 商家编辑窗口信息
 * @param {number} windowId
 * @param {object} data
 */
export function merchantUpdateWindow(windowId, data) {
  return request({
    url: `/merchant/windows/${windowId}`,
    method: "put",
    data,
  });
}

// =====================================================================================
// 菜品模块 (dish)
// =====================================================================================

/**
 * 商家获取菜品列表 (分页)
 * @param {number} windowId
 * @param {object} params - { page, size, name }
 */
export function merchantGetDishes(windowId, params) {
  return request({
    url: `/merchant/windows/${windowId}/dishes`,
    method: "get",
    params, // GET请求应该使用params
  });
}

/**
 * 获取菜品详情
 * @param {number} dishId
 */
export function getDishDetail(dishId) {
  return request({
    url: `/dishes/${dishId}`,
    method: "get",
  });
}

/**
 * 商家添加菜品
 * @param {number} windowId
 * @param {object} data
 */
export function merchantAddDish(windowId, data) {
  return request({
    url: `/merchant/windows/${windowId}/dishes`,
    method: "post",
    data,
  });
}

/**
 * 商家修改菜品信息
 * @param {number} dishId
 * @param {object} data
 */
export function merchantUpdateDish(dishId, data) {
  return request({
    url: `/merchant/dishes/${dishId}`,
    method: "put",
    data,
  });
}

/**
 * 商家删除菜品
 * @param {number} dishId
 */
export function merchantDeleteDish(dishId) {
  return request({
    url: `/merchant/dishes/${dishId}`,
    method: "delete",
  });
}

/**
 * 按标签返回菜品
 * @param {string[]} tagNames - 标签名称数组
 */
export function getDishesByTags(tagNames) {
  // 将数组转换为查询字符串参数
  const queryParams = tagNames
    .map((tag) => `tagNames=${encodeURIComponent(tag)}`)
    .join("&");
  return request({
    url: `/dishes/by-tag?${queryParams}`,
    method: "get",
  });
}

// =====================================================================================
// 评价模块 (comment)
// =====================================================================================

/**
 * 用户提交评价
 * @param {object} data - { targetType, targetId, rating, content, imageUrls, isAnonymous }
 */
export function submitComment(data) {
  return request({
    url: "/comments",
    method: "post",
    data,
  });
}

/**
 * 用户点赞评价
 * @param {number} commentId
 */
export function likeComment(commentId) {
  return request({
    url: `/comments/${commentId}/like`,
    method: "post",
  });
}

/**
 * 用户回复评论（通用接口）
 * @param {number} commentId
 * @param {object} data - { replyContent }
 */
export function replyComment(commentId, data) {
  return request({
    url: `/comments/${commentId}/reply`,
    method: "post",
    data,
  });
}

/**
 * 商家回复用户评论（已废弃，使用 replyComment 替代）
 * @deprecated 请使用 replyComment 函数
 * @param {number} commentId
 * @param {object} data - { replyContent }
 */
export function merchantReplyComment(commentId, data) {
  return request({
    url: `/comments/${commentId}/reply`,
    method: "post",
    data,
  });
}

// =====================================================================================
// 标签模块 (tag)
// =====================================================================================

/**
 * 获取所有标签
 */
export function getTags() {
  return request({
    url: "/tags",
    method: "get",
  });
}

// =====================================================================================
// 通知模块 (notification)
// =====================================================================================

/**
 * 获取用户的通知列表 (分页)
 * @param {object} params - { page, size }
 */
export function getNotifications(params) {
  return request({
    url: "/notifications",
    method: "get",
    params,
  });
}

/**
 * 将通知标记为已读
 * @param {number} notificationId
 */
export function markNotificationAsRead(notificationId) {
  return request({
    url: `/notifications/${notificationId}/read`,
    method: "post",
  });
}
