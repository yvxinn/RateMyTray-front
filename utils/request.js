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

    // 处理URL和参数
    let url = BASE_URL + options.url;
    let data = options.data || {};

    // 对于GET请求，将 params 参数添加到URL查询字符串中
    if (options.method === "GET" && options.params) {
      const queryString = Object.entries(options.params)
        .filter(
          ([key, value]) =>
            value !== undefined && value !== null && value !== ""
        )
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        )
        .join("&");
      if (queryString) {
        url += (url.includes("?") ? "&" : "?") + queryString;
      }
    }

    uni.request({
      url,
      method: options.method || "GET",
      data,
      header: options.header || {},
      success: (res) => {
        // 响应拦截器
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 处理204 No Content（删除成功）
          if (res.statusCode === 204) {
            resolve(null); // 204通常没有响应体
            return;
          }

          // 成功的响应
          if (
            res.data &&
            (res.data.code === ApiCode.SUCCESS ||
              res.data.code === ApiCode.CREATED ||
              res.data.code === ApiCode.LEGACY_SUCCESS)
          ) {
            resolve(res.data.data);
          } else if (!res.data) {
            // 如果没有响应体，但状态码是200-299，认为是成功的
            resolve(null);
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
