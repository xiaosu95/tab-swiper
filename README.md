# 移动端tab滑动和上下拉刷新加载

### [查看demo](http://www.suyuanli.ink/example/tab-swiper/ "查看demo")（请在移动端模式下查看）
### <a href="https://github.com/xiaosu95/tab-swiper" target="_blank">查看代码</a>

> 开发该插件的初衷是，在做一个项目时发现现在实现移动端tab滑动的插件大多基于swiper，swiper的功能太强大而我只要一个小小的tab滑动功能，就要引入200+k的js这未免太过浪费。而且swiper是没有下拉刷新功能的，要用swiper实现下拉刷新还得改造一番。在实现功能的同时产生了不少bug。要是在引入一个下拉刷新的插件又难免多了几十kb的js。而且这些插件对dom结构又是有一定要求的，一不小心就有bug。修复bug的时间都可以在撸一个插件出来了。

> 这次开发的这个插件只依赖手势库touch.js。使用原生实现功能。大小只有6kb。兼容性也算不错。

> 其实对touch.js的依赖并不严重，只是用了其两个手势事件，花点时间完全可以自己实现的。

***<font color="red">插件我只是粗略的测试了一番，若有什么bug请大家提出</font>***

------------


> - 该插件基于百度手势库touch.js该改手势库的大小也只有13k不到。官方文档链接是找不到了所以引用别人写的吧：[API文档](http://blog.csdn.net/wangjiaohome/article/details/49364177 "API文档")

##### 总结一下这次开发插件的原理和所遇到的坑吧
###### 实现的话主要分为： 
1. 确定好容器结构
2. 捕获滑动的事件（使用touch.js获取滑动的方向、滑动的距离和滑动的速度）
3. 实现滑动的效果（这里使用的是transform来实现滑动， transtion来实现动画）
4. 确定临界点（根据滑动不同的距离判断是否切换页数，还有根据滑动的速度确定是否切换页数）
5. 暴露监听事件（产生不同状态的回调）

###### 坑：
主要体现在微信和ios浏览器对下拉时会有弹簧效果：

![tab滑动图1](http://p0639a4mt.bkt.clouddn.com/1521115555000-915.png "tab滑动图1")

这个是浏览器的默认效果，是可以通过“e.preventDefault()”取消默认效果的。不过这就会产生容器不能滚动了。
所以就不能直接e.preventDefault()取消默认效果了。只能在特定的条件下才能取消默认事件。那条件是什么呢？
第一个条件就是滑动方向是向下&&是在容器顶部时候
第二个条件就是滑动方向向下&&在容器底部
在这里touch.js可以轻易的获取滑动的方向，滚动条所在的位置也很容易算出。我已开始也以为很简单的，结果却发现touch.js获取滚动方向是有一定延时的，这就造成第一时间捕获的位置是上一次的，所以出现偶尔可以偶尔不可，有时干脆滚动不了。所以使用touch.js获取方向的方式是不可取的。
只能自己采集触摸屏幕时的坐标，在对比滑动时的坐标取得方向。ok这个bug就这样轻松解决了。这都是在微信上运行的结构，后来拉到uc的时候竟然发现uc连左右滑动都有默认效果（丧尽天良）。
这就只能用老办法解决了，增加两组条件，左右滑动。根据采集的初始点，对比滑动过程的坐标，判断上下滚动还是左右滑动。在取消默认效果。

#### API：
dom结构：
```html
<div id="box">						<!-- 主容器 -->
    <div class="pullDownHtml">		<!-- 下拉刷新的显示内容 -->
      <div class="pullDownshow1">下拉刷新</div>
      <div class="pullDownshow2">正在刷新</div>
    </div>
    <div class="pullUpHtml">		<!-- 上拉加载的显示内容 -->
      <div class="pullUpHtmlshow1">上拉加载</div>
      <div class="pullUpHtmlshow2">正在加载</div>
    </div>
    <div class="box">
      <div class="tab-container">
        <div class="s-pull">
			// 页面一内容
        </div>
      </div>
      <div class="tab-container">
        <div class="s-pull">
			// 页面二内容
        </div>
      </div>
      <div class="tab-container">
        <div class="s-pull">
			// 页面三内容
        </div>
      </div>
    </div>
  </div>
```
1、初始化
```javascript
var swiper = new TabSwiper(ele, options)
// ele：容器
// options： 参数(Object)
```
2、options参数
```javascript
{
	speed: 300,						// 动画速度
	threshold: 100,					// 上下拉触发的阀值（px）
	xThreshold: 0.3,			  // 左右滑动触发的阀值（0~1）默认为：‘0.25’
  closeInertia: false,    // 是否关闭惯性滑动， 默认开启
	isPullDown: true,				// 是否开启下拉刷新
	isPullUp: true,					// 是否开启上拉加载
	defaultPage: 0,					// 默认显示的页数
	initCb: function(){},			// 初始化回调
	onEnd： function(page){},				// 切换页数时回调(返回当前页数)
	onRefreshStart: function(page){},		// 触发下拉刷新时回调(返回当前页数)
	onLoadStart: function(page){},			// 触发上拉加载时回调(返回当前页数)
	onTouchmove: function(page, e){}			// 正在页面上滑动回调(返回当前页数和滑动信息。可通过滑动的信息得到当前滑动的方向速度滑动的距离，进行功能扩展)
}
```
3、pullEnd(cb)方法:
```javascript
swiper.pullEnd(function (page) {			// 返回当前页数
	console.log(page)
})
```
4、changePage(page)方法:
```javascript
swiper.changePage(page)						// 切换页面page目标页面从0开始
```
5、nowIndex属性：
```javascript
var nowIndex = swiper.nowIndex    // 获取当前所在页数（只读）
```

###### 下面是代码（基于es6）
若要查看es5的版本请移步（<a href="https://github.com/xiaosu95/tab-swiper" target="_blank">查看代码</a>）
```javascript
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
```