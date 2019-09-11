/*
* qq 音乐：
* 1. 用 rem 布局解决移动端适配问题
* 2. 播放音频（audio）；页面加载后，自动播放；通过音符按钮来手动控制音频的播放和暂停；点击音符按钮到底是播放还是暂停，依赖于音频的播放状态；
* 3. 随着播放要做以下处理：
*   3.1 高亮当前进度匹配的歌词，歌词还会向上滑
*   3.2 更新当前的播放进度
*   3.3 更新进度条
* */

// zepto 轻量级用于移动端的库，和 jq 使用起来一样的；但是有一些方法它没有；zepto 提供专门的移动端事件；
// 常用的方法，如获取元素、addClass、removeClass ... 用法和 jq 一样；
// 在页面中引入的时候，要在咱们自己的写的 js 文件之前引入；

// 1. 获取元素对象
let audio = document.getElementById('audio'); // 获取 audio 标签
let $header = $('.header'); // 获取头
let $footer = $('.footer'); // 获取尾部
let $musicBtn = $('.musicBtn'); // 音符按钮
let $main = $('.main'); // 包裹 wrapper 的容器
let $wrapper = $('.wrapper'); // 获取包裹歌词的容器，歌词滚动的效果就是操作 $wrapper 相对于 $main 的 top 值
let $current = $('.current'); // 音频当前播放的时间
let $duration = $('.duration'); // 音频的总时长
let $already = $('.already'); // 进度条

let autoTimer = null; // 定义一个变量存储定时器id


// 2. 动态计算 main 区域的高度
// main 的高度 = 视口的高度 - header的高度 - footer 的高度 - 0.6 rem的 padding （height 是指内容区域的高度）
function computeMain () {
  let winH = document.documentElement.clientHeight; // 获取视口的高度
  let headerH = $header[0].offsetHeight; // 获取 header 的高度
  let footerH = $footer[0].offsetHeight; // 获取 footer 的高度

  // winH、headerH、footerH 都是以 px 为单位的，需要转成 rem 才能计算；
  // 如何把 winH、headerH、footerH 转成 rem？用 px 除以 HTML 的 fontSize 就可以转成 rem
  let fontSize = parseFloat(document.documentElement.style.fontSize); // 这个 fontSize 是一个带单位的字符串，需要转成数字

  let curH = (winH - headerH - footerH) / fontSize - 0.6 - 0.3; // 多减去的 0.3 是为了让下载按钮距离底部有一点距离

  $main.css({
    height: curH + 'rem'
  })
}
computeMain();
window.addEventListener('resize', computeMain); // 当屏幕尺寸发生变化时，重新计算 main 区域的高度

// 2. 通过 ajax 获取歌词
$.ajax({
  url: 'json/lyric.json', // 接口
  method: 'GET', // HTTP METHOD: GET POST
  async: false, // async 是否异步，默认值是 true
  error (err) {
    console.log(err)
  },
  success ({ lyric }) {
    // console.log(lyric)
    // lyric 就是我们需要的歌词数据，我们需要把歌词绑定到页面中
    bindHTML(lyric)
  }
});

// 绑定数据
function bindHTML(data) {
  // 处理第一句：
  // 我的梦 (华为手机主题曲) - 张靓颖
  // 我的梦&#32;&#40;华为手机主题曲&#41;&#32;&#45;&#32;张靓颖&#10;
  // &#32; -> ' '
  // &#40; -> '('
  // &#41; -> ')'
  // &#45; -> '-'
  let d1 = data.replace(/&#(\d+);/g, (wholeMatch, group) => {
    // replace 方法使用回调函数进行替换时，用回调函数的返回值替换正则捕获的内容；
    switch (parseFloat(group)) {
      case 32:
        return ' ';
      case 40:
        return '(';
      case 41:
        return ')';
      case 45:
        return '-'
    }
    return wholeMatch // 本次替换我们只想处理 32 40 41 45；其他的情况我们不做替换，所以我们原样返回大正则捕获到的内容
  });

  // console.log(d1)
  // 处理每一秒的歌词
  // [00&#58;08&#46;73]一直地一直地往前走&#10;
  // &#58; 前面的数字是 分钟数
  // &#46; 前面的是 秒数
  // 方括号以后 &#10; 之前的是 歌词
  let reg = /\[(\d+)&#58;(\d+)&#46;(?:\d+)\]([^&#]+)&#10/g;
  let ary = [];

  // 使用正则 + replace 遍历歌词，把需要的数据保存到数组中
  d1.replace(reg, (wholeMatch, minute, seconds, value) => {
    // 正则能够匹配到多少次，这个回调函数就会执行多少次
    ary.push({
      minute,
      seconds,
      value
    })
  });
  // console.log(ary)

  // 绑定数据
  let str = ``;
  ary.forEach(({ minute, seconds, value }) => {
    str += `<p data-min="${minute}" data-sec="${seconds}">${value}</p>`
  });
  $wrapper.html(str);

  // 歌词就绪后，让音乐自动播放
  // audio.play(); // audio 元素上自带播放和暂停的方法；
  // play 播放；pause 暂停

  // $musicBtn.addClass('select')
}

// 处理音符按钮的点击事件: zepto 提供了一个 tap 方法用于给元素绑定触摸事件；
$musicBtn.tap(function () {
  // 如果音频是暂停的，需要让音频播放；如果是播放的，就让音频暂停；
  // audio 有一个 paused 属性，是一个布尔值，true 表示处于暂停，false 表示正在播放
  if (audio.paused) {
    // 暂停的
    audio.play();
    $(this).addClass('select')

    // 每隔一秒钟计算一下进度
    autoTimer = setInterval(computeTime, 1000)
  } else {
    // 播放中
    audio.pause();
    $(this).removeClass('select');
    clearInterval(autoTimer); // 当音频停止播放的时候，清除定时器；
  }
});

let step = 0; // 前 5 行，歌词不会向上划动，所以需要记录当前匹配到多少行
let curTop = 0; // 记录 wrapper 相对于 main 的 top 值；初始值是 0；

function computeTime() {
  // 获取当前音频的播放进度，audio 标签身上有两个属性：
  // currentTime 表示当前音频已经播放的时间，单位：秒
  // duration 表示当前音频的总时长，单位：秒
  let { currentTime, duration } = audio;
  let curTime = formatTime(currentTime);
  let durTime = formatTime(duration);
  // 把时间进度回填到页面中
  $current.html(curTime);
  $duration.html(durTime);

  // 更新进度条: 进度条的宽度就是 当前时间 / 总时长 的百分比
  $already.css({
    width: currentTime / duration * 100 + '%'
  });

  // 高亮歌词：就是从 wrapper 下找到和当前播放进度匹配的歌词的 p 标签，然后给他增加 select 类名，同时移除其兄弟们的 select 类名
  // curTime 02:34
  let [min, sec] = curTime.split(':');
  // console.log(min, sec)

  let highLight = $('.wrapper p').filter(`[data-min="${min}"]`).filter(`[data-sec="${sec}"]`); // 是用 filter 方法把和当前播放进度匹配的歌词 p 标签找到；
  if (highLight.length) {
    highLight.addClass('select').siblings().removeClass('select')

    // 匹配到一次给 step 累加1
    step++;

    if (step >= 5) {
      curTop -= .84; // 让歌词向上移动一行，就是让 wrapper 的 top 值减小一个 p 标签的高度（0.84 就是 p 的高度）
      $wrapper.css({
        top: curTop + 'rem'
      })
    }
  }

  // 如果当前的播放时长大于等于总时长的时候，把定时器清除掉
  if (currentTime >= duration) {
    clearInterval(autoTimer)
    $musicBtn.removeClass('select');
  }
}

function formatTime(time) {
  // time 157.12345 s
  let min = Math.floor(time / 60);
  let sec = Math.floor(time - min * 60);

  if (min < 10) {
    min = '0' + min
  }
  if (sec < 10) {
    sec = '0' + sec
  }

  return `${min}:${sec}` // => 03:15
}