import { GM_addStyle, GM_getValue } from 'vite-plugin-monkey/dist/client'
import preferences from './config'
import settings from './setting'
import decrypt from './utils/decrypt'

const scriptContent = `
  function generate2d(x, y, ax, ay, bx, by, coordinates) {
    const w = Math.abs(ax + ay);
    const h = Math.abs(bx + by);
    const dax = Math.sign(ax), day = Math.sign(ay);
    const dbx = Math.sign(bx), dby = Math.sign(by);
    if (h === 1) {
      for (let i = 0; i < w; i++) {
        coordinates.push([x, y]);
        x += dax;
        y += day;
      }
      return;
    }
    if (w === 1) {
      for (let i = 0; i < h; i++) {
        coordinates.push([x, y]);
        x += dbx;
        y += dby;
      }
      return;
    }
    let ax2 = Math.floor(ax / 2), ay2 = Math.floor(ay / 2);
    let bx2 = Math.floor(bx / 2), by2 = Math.floor(by / 2);
    const w2 = Math.abs(ax2 + ay2);
    const h2 = Math.abs(bx2 + by2);
    if (2 * w > 3 * h) {
      if (w2 % 2 && w > 2) {
        ax2 += dax;
        ay2 += day;
      }
      generate2d(x, y, ax2, ay2, bx, by, coordinates);
      generate2d(x + ax2, y + ay2, ax - ax2, ay - ay2, bx, by, coordinates);
    } else {
      if (h2 % 2 && h > 2) {
        bx2 += dbx;
        by2 += dby;
      }
      generate2d(x, y, bx2, by2, ax2, ay2, coordinates);
      generate2d(x + bx2, y + by2, ax, ay, bx - bx2, by - by2, coordinates);
      generate2d(x + (ax - dax) + (bx2 - dbx), y + (ay - day) + (by2 - dby), -bx2, -by2, -(ax - ax2), -(ay - ay2), coordinates);
    }
  }
`

const script = document.createElement('script')
script.textContent = scriptContent
document.body.appendChild(script)

/* 添加样式。鼠标放到图片上的cursor鼠标样式，放大后图片的btzi-gallery框架位置，以及btzi-img图片定位和hover鼠标经过图片时置顶并显示阴影，active鼠标按下图片后隐藏阴影。（可修改） */
GM_addStyle(
  '.BDE_Image,.d_content_img,.j_user_sign{cursor:zoom-in;}.btzi-gallery{position:fixed;top:0;left:0;z-index:19990801;}.btzi-img{position:absolute;transform-origin:0 0;box-shadow:0 0 7px rgba(0,0,0,.4);}.btzi-img:hover{z-index:20220801;box-shadow:0 0 7px rgb(0,0,0);}.btzi-img:active{box-shadow:0 0 7px rgba(0,0,0,.4);cursor:move;}'
)

// 关闭图片的范围是w图片框架还是doc页面
function frame(w) {
  return document.getElementById(w) || document
}

// 图片动画函数。translate移动，scale缩放，rotate旋转度
function transform(t, x, y, s, r) {
  t.style.transform = `translate(${x | 0}px, ${y | 0}px) scale(${s}) rotate(${r}deg)`
}

function loadComment(img, pic_id, t) {
  const xhttp = new XMLHttpRequest()
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      img.src = JSON.parse(this.responseText)?.data?.img?.original?.waterurl || t.src
    }
  }

  const tiebaTid = /\d+/.exec(location.pathname)[0]
  xhttp.open('GET', 'https://tieba.baidu.com/photo/p?alt=jview&pic_id=' + pic_id + '&tid=' + tiebaTid, true)
  xhttp.send()
}

// 创建存放图片的div框架
const gallery = document.createElement('div')
gallery.className = 'btzi-gallery'
gallery.id = 'btzi_gallery'
// 给框架注册鼠标按下事件，可以移动关闭图片
gallery.addEventListener('mousedown', down)
// 给框架注册鼠标滚轮事件，可以滚动图片
gallery.addEventListener('wheel', wheel)
document.body.appendChild(gallery)

let iTarget, iMouse

// 打开图片函数
function open(e) {
  let target = e.target

  /* className分别指向BDE_Image新图，j_user_sign签名档，d_content_img老图。只有鼠标左键点击以上图片且不是图册贴里的图片时才会放大图片。（可修改） */
  if (!e.button && ['BDE_Image', 'j_user_sign', 'd_content_img'].includes(target.className) && target.parentNode.nodeName !== 'A') {
    iTarget = target
    let img = document.createElement('img')
    let tSrc = /https?:\/\/(\w+)\.baidu\.com\/.+\/(\w+\.[a-zA-Z]{3,4}([^_]*_?))/.exec(target.src)

    img.crossOrigin = 'anonymous'

    // 如果原图加载失败，直接显示贴子里的压缩图片；图片损坏不加载
    img.onerror = function () {
      if (this.src !== target.src) {
        this.src = target.src
      } else {
        this.onerror = null
        this.onload = null
      }
    }

    // 获取要加载图片的w宽和h高，计算图片的s大小以及x横y纵坐标
    img.onload = function () {
      const docWidth = document.documentElement.clientWidth - 5
      const docHeight = document.documentElement.clientHeight - 5
      let w = this.width,
        h = this.height,
        s = !+preferences.size && (docWidth - w < 0 || docHeight - h < 0) ? Math.min((docWidth - 5) / w, (docHeight - 5) / h) : 1, // 等比例缩小到最长边显示在窗口内或1原图显示
        x = docWidth - w * s - 5 > 0 ? (docWidth - w * s) / 2 : 5, // 判断图片w宽是否小于docWidth窗口宽，是则居中，不是则左上角。5表示预留5px位置不贴合
        y = docHeight - h * s - 5 > 0 ? (docHeight - h * s) / 2 : 5

      this.onerror = null
      this.onload = null

      const newimg = decrypt(this)
      newimg.iData = {
        width: w,
        height: h,
        x: x,
        y: y,
        scale: s,
        rotate: 0
      }
      newimg.className = 'btzi-img'
      transform(newimg, x, y, s, 0)
      gallery.appendChild(newimg) // 将加载好的图片插入到图片框架里显示
    }

    /*
        以下两句代码关系着放大后的图片是否是原图，匹配失败打开的则是贴子里被压缩的图片。
        比如某图片直接右键打开是下面这个地址：
        http://abc.baidu.com/forum/xxx/sign=xxx/123.jpg?tbpicau=xxx
        用原贴吧图片功能查到原图是下面这个地址：
        https://abc.baidu.com/forum/pic/item/123.jpg
        我们需要获取到点击图片的abc和123的内容，然后补全成原图的地址。
        需学习“正则表达式”。（可修改）
        */

    if (tSrc && tSrc[3]) {
      const pic_id = /(\w+)/.exec(tSrc[2])[0]
      loadComment(img, pic_id, target)
    } else {
      img.src = tSrc ? `//${tSrc[1]}.baidu.com/forum/pic/item/${tSrc[2]}` : target.src
    }
  }
}

// 鼠标按下图片函数
function down(e) {
  if (!e.button) {
    let t = (iTarget = e.target)
    if (t.tagName !== 'IMG') return
    let data = t.iData

    // 获取鼠标按下时的xy坐标和相对图片的xy坐标
    iMouse = {
      clientX: e.clientX,
      clientY: e.clientY,
      offsetX: data.x - e.clientX,
      offsetY: data.y - e.clientY
    }

    e.preventDefault()
    e.stopPropagation()
    document.addEventListener('mousemove', move) // 鼠标按下时给页面注册鼠标移动和鼠标放开事件
    document.addEventListener('mouseup', up)
  }
}

// 鼠标移动图片函数
function move(e) {
  let t = e.target,
    data = t.iData,
    x = e.clientX + iMouse.offsetX,
    y = e.clientY + iMouse.offsetY
  e.stopPropagation()
  if (t.tagName !== 'IMG') return
  transform(t, x, y, data.scale, data.rotate)
}

// 固定图片位置函数
function up(e) {
  if (iMouse.clientX === e.clientX && iMouse.clientY === e.clientY) {
    // 判断鼠标按下和松开的位置一致才能关闭图片
    iTarget = null
  } else {
    let t = e.target
    if (t.tagName !== 'IMG') return
    let data = t.iData
    // 获取图片变化后的位置导入图片属性内
    let translate = /translate\((-?\d+)px,\s?(-?\d+)px\)/.exec(t.getAttribute('style'))
    data.x = translate[1] | 0 // 取整
    data.y = translate[2] | 0
  }
  iMouse = null
  // 鼠标松开后注销页面鼠标移动和鼠标放开事件
  document.removeEventListener('mousemove', move)
  document.removeEventListener('mouseup', up)
}

/* 图片关闭函数。（可修改） */
function close(e) {
  let t = e.target
  switch (preferences.closeWindow) {
    case 'btzi_gallery': // 关闭图片范围为图片时，点击图片关闭该图片
      if (!iTarget) {
        t.iData = null
        t.remove()
      }
      break
    case 'document': // 当关闭图片方式为页面时，点击要放大的图片以外的区域都会关闭所有图片
      if (!iTarget || (t !== iTarget && t !== document.documentElement)) {
        if (document.body.classList.contains('btzi-enabled') || t.id === 'btzi_settings_save') break // 打开用户设置界面，不会关闭图片
        gallery.style.display = 'none'
        while (gallery.hasChildNodes()) {
          // 关闭所有图片
          gallery.firstChild.iData = null
          gallery.firstChild.remove()
        }
        gallery.style.display = ''
      }
      break
  }
  iTarget = null
}

// 鼠标滚轮函数
function wheel(e) {
  const {
    wheelKey: wKey,
    zoomKey: zKey,
    rotateKey: rKey,
    wheelDirection: wDirection,
    zoomDirection: zDirection,
    rotateDirection: rDirection
  } = preferences

  let z
  let t = e.target,
    data = t.iData,
    eKey = !e.altKey && !e.ctrlKey && !e.shiftKey

  if (t.tagName !== 'IMG') return

  let { x, y, scale: s, rotate: r } = data

  // 滚轮向下滚动时e.deltaY/e.deltaX返回正值，向上滚动时e.deltaY/e.deltaX返回负值。因使用组合键时浏览器变化的参数不一样，故判断e.deltaY/e.deltaX哪个发生了变化。图片移动设置为一次100px
  let deltaXY = (e.deltaY || e.deltaX) > 0 ? 100 : -100
  e.preventDefault()
  e.stopPropagation()

  if ((wKey === 'type' && eKey) || (wKey !== 'type' && e[wKey])) {
    const docWidth = document.documentElement.clientWidth - 5
    const docHeight = document.documentElement.clientHeight - 5
    // 图片滚轮移动判断
    let tmp = docHeight - data.height * s // 只要图片高大于窗口高，就上下移动。

    if (tmp < 0) {
      let delta = r > 90 ? data.height * s : 0 // 图片翻转超过90度后，原本图片的左上角跑到了下方，要增加图片高度计算
      z = y - deltaXY * wDirection // 图片y纵坐标移动后的新纵坐标。相对窗口左上角，往上移（图片到底）减小，往下移（图片到顶）增加
      if (z > 5 + delta) {
        // 到顶
        z = 5 + delta
      } else if (z < tmp + delta) {
        // 到底
        z = tmp + delta
      }
      data.y = z
      transform(t, x, z, s, r)
      return
    }

    tmp = docWidth - data.width * s // 单单只有图片宽大于窗口宽，才左右移动
    if (tmp < 0) {
      let delta = r % 270 ? data.width * s : 0
      z = x - deltaXY * wDirection
      if (z > 5 + delta) {
        z = 5 + delta
      } else if (z < tmp + delta) {
        z = tmp + delta
      }
      data.x = z
      transform(t, z, y, s, r)
      return
    }
  }

  if ((zKey === 'type' && eKey) || (zKey !== 'type' && e[zKey])) {
    // 图片缩放判断
    let delta = deltaXY * zDirection > 0 ? 0.1 : -0.1
    z = s + delta
    if ((z < 0.2 && s >= 0.1) || (s < 0.1 && z < 0)) {
      // 缩放过小不再进行缩放
      return
    }
    let tmp = z / s
    // 我感觉这样好
    // 计算以鼠标位置进行缩放。e.clientX - x为鼠标距离图片边的距离，* tmp为缩放后的距离，e.clientX - 计算得相对鼠标移动缩放后的图片边距
    data.x = e.clientX - (e.clientX - x) * tmp
    data.y = e.clientY - (e.clientY - y) * tmp
    data.scale = z
    transform(t, data.x, data.y, z, r)
    return
  }

  if ((rKey === 'type' && eKey) || (rKey !== 'type' && e[rKey])) {
    // 图片旋转判断
    let tmp = data.width // 对图片内data.width宽data.height高属性进行调换，使旋转后的图片数据正常计算
    data.width = data.height
    data.height = tmp
    let delta = deltaXY * rDirection > 0 ? 90 : 270 // 270比-90好计算
    z = (r + delta) % 360 // 取余。保证为0，90，180，270度
    tmp = 0.01745329 * delta
    data.x = e.clientX - (e.clientX - x) * Math.cos(tmp) + (e.clientY - y) * Math.sin(tmp) // 以鼠标位置(e.clientX,e.clientY)为中心，图片坐标(x,y)旋转tmp弧度，计算新坐标
    data.y = e.clientY - (e.clientX - x) * Math.sin(tmp) - (e.clientY - y) * Math.cos(tmp)
    data.rotate = z
    transform(t, data.x, data.y, s, z)
    return
  }
}

/* 定位到贴子内容，用来注册事件。（可修改） */
const postlist = document.getElementById('j_p_postlist')

// if (!postlist) {
//   return
// }

/* 监听贴子是否翻页。（可修改） */
const observer = new MutationObserver(() => {
  gallery.style.display = 'none'
  while (gallery.hasChildNodes()) {
    gallery.firstChild.iData = null
    gallery.firstChild.remove()
  }
  gallery.style.display = ''
})

observer.observe(postlist, {
  childList: true
})

// 给贴子内容注册阻止原图片打开事件
postlist.addEventListener(
  'click',
  function (e) {
    let t = e.target
    if (!e.button && t.className === 'BDE_Image' && t.parentNode.nodeName !== 'A') {
      // t.parentNode.nodeName !== 'A'图册贴里的图片打开方式不取消，仍为默认方式
      e.stopPropagation()
    }
  },
  true
)

// 给贴子内容注册打开图片事件
postlist.addEventListener(preferences.open, open, true)
// 给关闭图片的范围注册图片关闭图片事件
frame(preferences.closeWindow).addEventListener(preferences.close, close)

if (!GM_getValue('btzi-UserSettings')) {
  // 第一次使用，弹出设置界面
  settings()
}
