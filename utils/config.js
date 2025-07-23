// utils/config.js

const ENV = import.meta.env;

// 根据环境选择不同的基础URL
const getBaseUrl = () => {
  if (ENV.MODE === "development") {
    // 开发环境使用 HBuilderX 内置浏览器，需要代理
    return "/api";
  } else {
    // 生产环境直接指向后端服务地址
    return "https://your.production.domain"; // 请替换为您的生产环境域名
  }
};

export const BASE_URL = getBaseUrl();
export const BACKEND_URL =
  ENV.MODE === "development" ? "http://localhost:8080" : BASE_URL;
