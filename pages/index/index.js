Page({
  data: {
    // 优先使用 Cloudflare Pages（国内访问最稳定）
    // 备用：https://china-history-timeline.jsk-developer.workers.dev/
    url: 'https://china-history-timeline-c4m.pages.dev/'
  },
  onLoad: function () {
    console.log('WebView loading:', this.data.url)
  },
  onWebViewLoad: function () {
    console.log('WebView loaded successfully')
  },
  onError: function (e) {
    console.error('WebView error:', e.detail)
    wx.showToast({
      title: '页面加载失败，请检查网络',
      icon: 'none',
      duration: 3000
    })
  }
})
