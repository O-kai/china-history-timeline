Page({
  data: {
    url: 'https://china-history-timeline.vercel.app/'
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
