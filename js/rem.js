; (function (designwidth) {
    function computeFont() {
        // 获取视口
        let winW = document.documentElement.clientWidth;
        if (winW >= 750) {
            // 如果视口超过750就把页面HTML的fontSize设为100px
            document.documentElement.style.fontSize = '100px';
            return;
        }
        //根据视口和设计稿的比例关系计算当前设备下HTML的字体大小
        document.documentElement.style.fontSize = winW / designwidth * 100 + 'px'
    }

    computeFont();

    // 当浏览器的可视窗口尺寸发生变化时，会触发onresize事件，当onresize事件触发时，重新计算HTML的fontSize
    window.addEventListener('resize', computeFont);
    // 屏幕朝向发生变化时重新计算HTML的fontsize
    window.addEventListener('orientationchange', computeFont);
}(750)); 