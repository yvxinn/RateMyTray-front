import { BASE_URL } from "./config"; // 统一添加 /api 前缀，以匹配代理规则
import { ApiCode } from "./apiCode";

const request = (options) => {
  return new Promise((resolve, reject) => {
    // 请求拦截器
    // 可以在这里处理 Token
    // 例如，从 uni.getStorageSync('token') 获取 token
    const token = uni.getStorageSync("token");
    if (token) {
      if (!options.header) {
        options.header = {};
      }
      options.header.Authorization = `Bearer ${token}`;
    }

    uni.request({
      url: BASE_URL + options.url,
      method: options.method || "GET",
      data: options.data || {},
      header: options.header || {},
      success: (res) => {
        // 响应拦截器
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 成功的响应
          if (
            res.data.code === ApiCode.SUCCESS ||
            res.data.code === ApiCode.CREATED ||
            res.data.code === ApiCode.LEGACY_SUCCESS
          ) {
            resolve(res.data.data);
          } else {
            // 业务逻辑错误
            uni.showToast({
              title: res.data.message || "Error",
              icon: "none",
            });
            reject(res.data);
          }
        } else {
          // HTTP 错误
          uni.showToast({
            title: `Request Failed: ${res.statusCode}`,
            icon: "none",
          });
          reject(res);
        }
      },
      fail: (err) => {
        // 网络或其他错误
        uni.showToast({
          title: "Network Error",
          icon: "none",
        });
        reject(err);
      },
    });
  });
};

export default request;
