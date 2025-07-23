import { reactive } from "vue";

const store = reactive({
  state: {
    token: uni.getStorageSync("token") || null,
    userInfo: uni.getStorageSync("userInfo") || null,
  },

  mutations: {
    setToken(state, token) {
      state.token = token;
      uni.setStorageSync("token", token);
    },
    setUser(state, userInfo) {
      state.userInfo = userInfo;
      uni.setStorageSync("userInfo", userInfo);
    },
    clearAuth(state) {
      state.token = null;
      state.userInfo = null;
      uni.removeStorageSync("token");
      uni.removeStorageSync("userInfo");
    },
  },

  actions: {
    login({ commit }, token, userInfo) {
      commit("setToken", token);
      commit("setUser", userInfo);
    },
    logout({ commit }) {
      commit("clearAuth");
      // 可以跳转到登录页
      uni.reLaunch({
        url: "/pages/login/login",
      });
    },
  },

  // 辅助函数，使得在组件中可以像 this.$store.commit('xxx') 一样调用
  commit(mutationName, payload) {
    const mutation = store.mutations[mutationName];
    if (mutation) {
      mutation(store.state, payload);
    } else {
      console.error(`[Store] Mutation not found: ${mutationName}`);
    }
  },

  dispatch(actionName, payload) {
    const action = store.actions[actionName];
    if (action) {
      const context = {
        commit: store.commit,
        state: store.state,
        dispatch: store.dispatch,
      };
      return action(context, payload);
    } else {
      console.error(`[Store] Action not found: ${actionName}`);
      return Promise.reject(new Error(`Action not found: ${actionName}`));
    }
  },
});

export default store;
