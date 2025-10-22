(function () {
  const { createApp } = Vue;
  const STORAGE_KEY = "cloud-ev-dashboard-auth";

  const emptyDashboard = () => ({
    updatedAt: "",
    stats: [],
    alerts: [],
    usage: { today: 0, week: 0 },
    yesterday: { chargeCount: 0, trips: 0 },
    dailyRange: [],
    realtimeSeries: [],
    weeklyStats: [],
    monthlyStats: [],
    patrols: [],
  });

  createApp({
    data() {
      return {
        isAuthenticated: false,
        auth: { token: null, user: null },
        authLoading: false,
        loginForm: {
          username: "",
          password: "",
        },
        loginError: "",
        loading: false,
        dashboard: emptyDashboard(),
        usageRange: "today",
        charts: {
          daily: null,
          power: null,
          weekly: null,
          monthly: null,
        },
      };
    },
    computed: {
      statsCards() {
        return this.dashboard.stats;
      },
      usageTabs() {
        return [
          { key: "today", label: "今天" },
          { key: "week", label: "本周" },
        ];
      },
      usagePercent() {
        return this.dashboard.usage[this.usageRange] ?? 0;
      },
      formattedUpdatedAt() {
        if (!this.dashboard.updatedAt) return "";
        const date = new Date(this.dashboard.updatedAt);
        const pad = (value) => String(value).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      },
      currentUser() {
        return this.auth.user;
      },
    },
    methods: {
      saveAuth(auth) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
        } catch (error) {
          console.warn("Failed to persist auth state", error);
        }
      },
      clearAuth() {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
          console.warn("Failed to clear auth state", error);
        }
      },
      restoreAuth() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return;
          const stored = JSON.parse(raw);
          if (stored?.token) {
            this.auth = stored;
            this.isAuthenticated = true;
            this.loadDashboard();
          }
        } catch (error) {
          console.warn("Failed to restore auth state", error);
          this.clearAuth();
        }
      },
      async handleLogin() {
        if (!this.loginForm.username || !this.loginForm.password) return;
        this.authLoading = true;
        this.loginError = "";
        try {
          const auth = await window.MockApi.login({
            username: this.loginForm.username,
            password: this.loginForm.password,
          });
          this.auth = auth;
          this.isAuthenticated = true;
          this.saveAuth(auth);
          this.loginForm.password = "";
          await this.loadDashboard();
        } catch (error) {
          this.loginError = error?.message || "登录失败，请稍后再试";
        } finally {
          this.authLoading = false;
        }
      },
      handleLogout() {
        this.clearAuth();
        this.isAuthenticated = false;
        this.auth = { token: null, user: null };
        this.loginForm.username = "";
        this.loginForm.password = "";
        this.dashboard = emptyDashboard();
        this.usageRange = "today";
        this.destroyCharts();
      },
      async loadDashboard() {
        if (!this.isAuthenticated) return;
        this.loading = true;
        try {
          const data = await window.MockApi.fetchDashboardData();
          this.dashboard = data;
          this.$nextTick(() => {
            this.ensureCharts();
            this.renderCharts();
          });
        } catch (error) {
          console.error("Failed to load dashboard data", error);
        } finally {
          this.loading = false;
        }
      },
      ensureCharts() {
        const chartTargets = [
          ["daily", "daily-chart"],
          ["power", "power-chart"],
          ["weekly", "weekly-chart"],
          ["monthly", "monthly-chart"],
        ];

        chartTargets.forEach(([key, elementId]) => {
          const element = document.getElementById(elementId);
          if (!element) return;
          if (!this.charts[key]) {
            this.charts[key] = echarts.init(element);
          }
        });
      },
      renderCharts() {
        this.renderDailyChart();
        this.renderPowerChart();
        this.renderWeeklyChart();
        this.renderMonthlyChart();
      },
      renderDailyChart() {
        if (!this.charts.daily) return;
        const option = {
          grid: { left: 40, right: 20, top: 20, bottom: 40 },
          tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(13, 43, 79, 0.9)",
            borderWidth: 0,
            padding: 10,
            textStyle: { color: "#27f0ff" },
          },
          xAxis: {
            type: "category",
            data: this.dashboard.dailyRange.map((item) => item.date),
            axisLine: { lineStyle: { color: "#264d73" } },
            axisLabel: { color: "#7aa5d6" },
          },
          yAxis: {
            type: "value",
            axisLine: { show: false },
            splitLine: { lineStyle: { color: "rgba(39, 240, 255, 0.1)" } },
            axisLabel: { color: "#7aa5d6" },
          },
          series: [
            {
              name: "充电次数",
              type: "line",
              smooth: true,
              data: this.dashboard.dailyRange.map((item) => item.value),
              lineStyle: { color: "#27f0ff" },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "rgba(39, 240, 255, 0.35)" },
                  { offset: 1, color: "rgba(39, 240, 255, 0)" },
                ]),
              },
              symbol: "circle",
              symbolSize: 8,
              itemStyle: { color: "#27f0ff", borderColor: "#0c1f3f" },
            },
          ],
        };
        this.charts.daily.setOption(option, true);
      },
      renderPowerChart() {
        if (!this.charts.power) return;
        const option = {
          grid: { left: 36, right: 18, top: 20, bottom: 40 },
          tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(13, 43, 79, 0.9)",
            borderWidth: 0,
            padding: 10,
            textStyle: { color: "#27f0ff" },
          },
          xAxis: {
            type: "category",
            data: this.dashboard.realtimeSeries.map((item) => item.label),
            axisLine: { lineStyle: { color: "#264d73" } },
            axisLabel: { color: "#7aa5d6" },
          },
          yAxis: {
            type: "value",
            axisLine: { show: false },
            splitLine: { lineStyle: { color: "rgba(39, 240, 255, 0.1)" } },
            axisLabel: { color: "#7aa5d6" },
          },
          series: [
            {
              type: "line",
              smooth: true,
              data: this.dashboard.realtimeSeries.map((item) => item.value),
              symbol: "circle",
              symbolSize: 6,
              lineStyle: { color: "#27f0ff" },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "rgba(39, 240, 255, 0.35)" },
                  { offset: 1, color: "rgba(39, 240, 255, 0)" },
                ]),
              },
            },
          ],
        };
        this.charts.power.setOption(option, true);
      },
      renderWeeklyChart() {
        if (!this.charts.weekly) return;
        const option = {
          legend: {
            data: ["总时长", "充断次数"],
            textStyle: { color: "#7aa5d6" },
          },
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            backgroundColor: "rgba(13, 43, 79, 0.9)",
            borderWidth: 0,
            padding: 10,
            textStyle: { color: "#27f0ff" },
          },
          grid: { left: 40, right: 24, top: 40, bottom: 40 },
          xAxis: {
            type: "category",
            data: this.dashboard.weeklyStats.map((item) => item.date),
            axisLabel: { color: "#7aa5d6" },
            axisLine: { lineStyle: { color: "#264d73" } },
          },
          yAxis: [
            {
              type: "value",
              axisLabel: { color: "#7aa5d6" },
              splitLine: { lineStyle: { color: "rgba(39, 240, 255, 0.1)" } },
            },
            {
              type: "value",
              axisLabel: { color: "#7aa5d6" },
              splitLine: { show: false },
            },
          ],
          series: [
            {
              name: "总时长",
              type: "bar",
              data: this.dashboard.weeklyStats.map((item) => item.duration),
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#27f0ff" },
                  { offset: 1, color: "#0c1f3f" },
                ]),
              },
            },
            {
              name: "充断次数",
              type: "line",
              yAxisIndex: 1,
              data: this.dashboard.weeklyStats.map((item) => item.interrupts),
              lineStyle: { color: "#ff9a3c" },
              symbol: "circle",
              symbolSize: 8,
              itemStyle: { color: "#ff9a3c", borderColor: "#0c1f3f" },
            },
          ],
        };
        this.charts.weekly.setOption(option, true);
      },
      renderMonthlyChart() {
        if (!this.charts.monthly) return;
        const option = {
          grid: { left: 40, right: 20, top: 20, bottom: 40 },
          tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(13, 43, 79, 0.9)",
            borderWidth: 0,
            padding: 10,
            textStyle: { color: "#27f0ff" },
          },
          xAxis: {
            type: "category",
            data: this.dashboard.monthlyStats.map((item) => item.month),
            axisLabel: { color: "#7aa5d6" },
            axisLine: { lineStyle: { color: "#264d73" } },
          },
          yAxis: {
            type: "value",
            axisLabel: { color: "#7aa5d6" },
            splitLine: { lineStyle: { color: "rgba(39, 240, 255, 0.1)" } },
          },
          series: [
            {
              type: "bar",
              data: this.dashboard.monthlyStats.map((item) => item.value),
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#27f0ff" },
                  { offset: 1, color: "#0c1f3f" },
                ]),
              },
              barWidth: 22,
            },
          ],
        };
        this.charts.monthly.setOption(option, true);
      },
      handleResize() {
        Object.values(this.charts).forEach((chart) => chart && chart.resize());
      },
      destroyCharts() {
        Object.keys(this.charts).forEach((key) => {
          if (this.charts[key]) {
            this.charts[key].dispose();
            this.charts[key] = null;
          }
        });
      },
    },
    mounted() {
      this.restoreAuth();
      window.addEventListener("resize", this.handleResize);
    },
    beforeUnmount() {
      window.removeEventListener("resize", this.handleResize);
      this.destroyCharts();
    },
  }).mount("#app");
})();
