import { GM_getValue } from '$'
/*
    获取btzi-UserSettings用户设置，初次使用设定一个默认值。
    open鼠标左键打开图片方式；
    close鼠标左键关闭图片方式，closeWindow可关闭图片的范围；
    size图片打开后大小；
    wheelKey滚动图片组合键，wheelDirection滚动图片滚轮方向；
    zoomKey缩放图片组合键，zoomDirection缩放图片滚轮方向；
    rotateKey旋转图片组合键，rotateDirection旋转图片滚轮方向。
*/
const preferences = JSON.parse(
  GM_getValue(
    'btzi-UserSettings',
    '{"open": "dblclick","close": "click","closeWindow":"btzi_gallery","size":"100","wheelKey":"type","wheelDirection": "1","zoomKey": "ctrlKey","zoomDirection": "-1","rotateKey": "altKey","rotateDirection": "1"}'
  )
)

export default preferences
