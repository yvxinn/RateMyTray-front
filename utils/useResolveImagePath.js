// utils/useResolveImagePath.js
import { computed } from "vue";
import { BACKEND_URL } from "@/utils/config.js";

/**
 * @description 一个 Vue Composable，用于解析图片路径
 * @param {import('vue').Ref<string> | string} pathRef - 包含图片路径的 Ref 对象或普通字符串
 * @param {string} [defaultImage] - 加载失败时要显示的默认图片路径
 * @returns {import('vue').ComputedRef<string>} - 解析后的完整图片路径
 */
export function useResolveImagePath(pathRef, defaultImage = "") {
  return computed(() => {
    const path = typeof pathRef === "string" ? pathRef : pathRef.value;
    if (!path) {
      return defaultImage;
    }
    if (path.startsWith("http") || path.startsWith("blob")) {
      return path;
    }
    return BACKEND_URL + path;
  });
}
