;(function (window, document) {
  // 更改transform
  function changeTransform (ele, left, top) {
    ele.style.transform = `translate(${left}px, ${top}px)`
    ele.style.WebkitTransform = `translate(${left}px, ${top}px)`
  }
  class TabSwiper {
    get nowIndex () {
      return this._nowIndex
    }
    set nowIndex (val) {
      if (val === this._nowIndex) return
      this._nowIndex = val
      this.options.onEnd && this.options.onEnd(val)
    }
    constructor (ele, options) {
      this._nowIndex = 0
      this.ele = ele
      this.width = ele.clientWidth             // 容器宽度
      this.height = ele.clientHeight           // 容器高度
      this.totalWidth = 0                      // 总宽度
      this.box = ele.querySelector('.box')
      this.containers = ele.querySelectorAll('.tab-container')         // 容器
      this.direction = ''
      this.scrollTop = 0
      this.options = options                    // 配置参数
      this.prohibitPull = false                 // 禁止上下拉动操作标记
      this.startY = 0                           // 起始y坐标
      this.startX = 0                           // 起始x坐标
      this.isBottom = false                     // 是否在底部
      this.disX = 0                             // 滑动X差值
      this.disY = 0                             // 滑动Y差值
      this.pullDownHtml = ele.querySelector('.pullDownHtml')
      this.pullUpHtml = ele.querySelector('.pullUpHtml')
      this.pullDownHtmlHeight = 0               // 下拉的html高度
      this.pullUpHtmlHeight = 0                 // 上拉的html高度
      this.left = 0                             // 向左偏移量
      // 初始化
      this.init()
    }

    // 初始化
    init () {
      this.options.xThreshold = this.options.xThreshold || 0.25
      // 设置样式
      this.ele.style.overflow = 'hidden'
      this.ele.style.position = 'relative'

      this.box.style.height = '100%'
      this.box.style.width = this.containers.length * 100 + 'vw'
      this.box.style.float = 'left'
      this.box.style.transition = 'all ' + this.options.speed / 1000 + 's'
      this.box.style.position = 'relative'
      this.box.style.zIndex = 2

      this.totalWidth = this.box.clientWidth;

      [].forEach.call(this.containers, (ele) => {
        ele.style.float = 'left'
        ele.style.width = '100vw'
        ele.style.height = '100%'
        ele.style.overflow = 'auto'
        ele.style.WebkitOverflowScrolling = 'touch'
        ele.addEventListener('touchstart', (e) => {
          this.startY = e.touches[0].clientY   // 设置起始y坐标
          this.startX = e.touches[0].clientX   // 设置起始y坐标
        }, false)

        ele.addEventListener('touchmove', (e) => {
          this.scrollTop = this.containers[this.nowIndex].scrollTop
          this.isBottom = this.containers[this.nowIndex].querySelector('.s-pull').clientHeight <= this.scrollTop + this.height
          // 判断滑动方向是否为上下
          const disY = e.touches[0].clientY - this.startY
          const disX = e.touches[0].clientX - this.startX
          // 设置事件(当为顶部或底部是取消默认事件)
          if ((disY > 0 && ele.scrollTop == 0) || (disY < 0 && this.isBottom)) {
            e.preventDefault()
          }
          // 若为左右滑动时取消默认事件
          if (Math.abs(disY) < Math.abs(disX)) e.preventDefault()
        }, false)
      })

      // 上下拉
      if (this.options.isPullDown) {
        this.pullDownHtml.style.position = 'absolute'
        this.pullDownHtml.style.width = '100%'
        this.pullDownHtmlHeight = this.pullDownHtml.clientHeight
      }
      if (this.options.isPullUp) {
        this.pullUpHtml.style.position = 'absolute'
        this.pullUpHtml.style.width = '100%'
        this.pullUpHtml.style.bottom = '0'
        this.pullUpHtmlHeight = this.pullUpHtml.clientHeight
      }


      // 添加事件
      // 拖拽
      touch.on(this.box, 'drag', (e) => {
        this.direction = e.direction
        this.touchmove(e)
        this.options.onTouchmove && this.options.onTouchmove(this.nowIndex, e) // 事件输出
      })
      // 滑动
      !this.options.closeInertia && touch.on(this.box, 'swipe', (e) => {
        this.swipe(e)
      })
      // 手指离开屏幕
      touch.on(this.box, 'touchend', (e) => {
        this.touchend(e)
      })

      // 移动至默认页面
      this.changePage(this.options.defaultPage || 0)
      this.options.initCb && this.options.initCb()
    }

    // 拖拽方法
    touchmove (e) {
      this.box.style.transition = 'none'              // 取消动画
      if ((e.direction === 'left' || e.direction === 'right') && !this.disY) {
        // 左右滑动
        this.disX = e.distanceX
        changeTransform(this.box, (this.left + this.disX), this.disY)
      } else if (!this.disX && !this.prohibitPull) {
        // 上下滑动
        if (e.direction === 'down' && !this.options.isPullDown) return
        if (e.direction === 'up' && !this.options.isPullUp) return
        if ((this.scrollTop <= 0 && this.direction === 'down') || (this.isBottom && this.direction === 'up')) {
          // 上下拉动容器
          this.disY = e.distanceY
          changeTransform(this.box, (this.left + this.disX), this.disY)
        }
      }
    }
    // 手指离开屏幕
    touchend (e) {
      this.box.style.transition = 'all ' + this.options.speed / 1000 + 's'              // 开启动画
      if (!this.prohibitPull) {
        if (Math.abs(this.disY) < this.options.threshold) {                   // 上下拉小于阀值自动复原
          this.disY = 0
          changeTransform(this.box, (this.left + this.disX), this.disY)
        }

        // 下拉刷新触发
        if (this.scrollTop <= 0 && this.direction === 'down' && this.disY >= this.options.threshold) {
          this.disY = this.pullDownHtmlHeight
          this.prohibitPull = true
          // 显示加载中
          this.pullDownHtml.style.visibility = 'visible'
          this.options.onRefreshStart && this.options.onRefreshStart(this.nowIndex) // 输出下拉刷新事件
        }
        // 上拉加载触发
        else if (this.isBottom && this.direction === 'up' && Math.abs(this.disY) > this.options.threshold) {
          this.disY = -this.pullUpHtmlHeight
          this.prohibitPull = true
          // 显示加载中
          this.pullUpHtml.style.visibility = 'visible'
          this.options.onLoadStart && this.options.onLoadStart(this.nowIndex)       // 输出上拉事件
        }
      }
      // 左右滑动
      if (Math.abs(this.disX) < this.width * this.options.xThreshold) {
        changeTransform(this.box, this.left, this.disY)
        this.disX = 0
      } else {
        this.left += this.disX / Math.abs(this.disX) * this.width
        if (this.left > 0) this.left = 0
        if (this.left <= -this.totalWidth) this.left = -(this.totalWidth - this.width)
        changeTransform(this.box, this.left, this.disY)
      }
      this.direction = ''                                       // 重置方向
      this.nowIndex = Math.abs(this.left) / this.width          // 计算页数
    }
    // 快速滑动
    swipe (e) {
      if (e.factor < 1 && !this.disX && !this.disY) {
        if (e.direction === 'left') {
          this.left -= this.width
        } else if (e.direction === 'right') {
          this.left += this.width
        }
        if (this.left > 0) this.left = 0
        if (this.left <= -this.totalWidth) this.left = -(this.totalWidth - this.width)
        changeTransform(this.box, this.left, this.disY)
      }
      this.disX = 0
      this.nowIndex = Math.abs(this.left) / this.width          // 计算页数
    }

    // 关闭上下拉
    pullEnd (cb) {
      cb && cb(this.nowIndex)
      changeTransform(this.box, this.left, 0)
      this.disY = 0
      this.prohibitPull = false
    }

    // 切换页数
    changePage (page) {
      if (this.prohibitPull) return
      this.left = -page * this.width
      changeTransform(this.box, this.left, this.disY)
      this.nowIndex = Math.abs(this.left) / this.width
    }
  }
  window.TabSwiper = TabSwiper
})(window, document)