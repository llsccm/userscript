import { GM_addStyle, GM_setValue, GM_getResourceText, GM_registerMenuCommand } from '$'
import preferences from './config'

let settingIsInit = false
// 用户设置界面函数
const settings = function () {
  // 用户设置界面样式
  GM_addStyle(
    '.btzi-enabled .btzi-modal,.btzi-enabled .btzi-container{display:flex;}.btzi-modal,.btzi-container{position:fixed;top:0;left:0;display:none;width:100%;height:100%;}.btzi-modal{z-index:20211231;background-color:rgba(0,0,0,.7);}.btzi-container{z-index:20220101;justify-content:center;align-items:center;text-align:left;}.btzi-content{width:335px;border-radius:6px;background-color:#fff;}.btzi-header,.btzi-body,.btzi-footer{padding:11px;}.btzi-header{border-bottom:1px solid #e6ecf0;}.btzi-title{padding:0;margin:0;font:400 20px sans-serif;color:#000;text-align:center;}.btzi-group{padding:0;margin:0;margin-bottom:15px;border:0;}.btzi-legend,.btzi-controls,.btzi-select,.btzi-button{font:14px sans-serif;color:#000;}.btzi-legend{padding:5px 0;margin:0;float:left;width:81px;text-align:right;}.btzi-controls{margin-left:93px;clear:none;}.btzi-select{box-sizing:border-box;padding:4px;margin:0;width:180px;height:30px;border:1px solid #e6ecf0;border-radius:3px;appearance:auto;}.btzi-select:focus{outline:#f0f auto;}.btzi-footer{text-align:center;border-top:1px solid #e6ecf0;}.btzi-button{padding:9px 18px;border:0;border-radius:75px;font-weight:700;color:#fff;background:#4ab3f4;cursor:pointer;transition:box-shadow .17s ease-in-out;}.btzi-button:hover,.btzi-button:active{background:#1da1f2;}.btzi-button:focus{box-shadow:0 0 0 2px #fff,0 0 0 4px #a4d9f9;}.btzi-button:active{box-shadow:0 0 0 2px #fff,0 0 0 4px #4ab3f4;}'
  )

  // 用户设置界面html
  const htmlText = GM_getResourceText('htmlText')
  document.body.insertAdjacentHTML('beforeend', htmlText)
  const form = document.getElementById('btzi_settings_form')

  for (const prop in preferences) {
    // 将数据库里的设置导入到用户设置界面显示
    form[`btzi[${prop}]`].value = preferences[prop]
  }

  // 避免组合键冲突，当选择已有组合键时会互相替换
  const change = function () {
    const KeyIndex = {
      'btzi[wheelKey]': form['btzi[wheelKey]'].selectedIndex,
      'btzi[zoomKey]': form['btzi[zoomKey]'].selectedIndex,
      'btzi[rotateKey]': form['btzi[rotateKey]'].selectedIndex
    }
    for (const prop in KeyIndex) {
      if (this.selectedIndex === KeyIndex[prop]) {
        let tmp = KeyIndex[this.name]
        KeyIndex[prop] = tmp
        form[prop].selectedIndex = tmp
        break
      }
    }
    KeyIndex[this.name] = this.selectedIndex
  }

  form['btzi[wheelKey]'].addEventListener('change', change)
  form['btzi[zoomKey]'].addEventListener('change', change)
  form['btzi[rotateKey]'].addEventListener('change', change)

  // 给保存按钮注册事件
  document.getElementById('btzi_settings_save').addEventListener('click', function () {
    for (const prop in preferences) {
      // 整合获得的新设置
      preferences[prop] = form[`btzi[${prop}]`].value
    }

    // 将用户的新设置导入到数据库里保存
    GM_setValue('btzi-UserSettings', JSON.stringify(preferences))

    // 刷新页面
    location.reload()
  })

  document.body.classList.add('btzi-enabled')
  settingIsInit = true
}

// if (document.title === '贴吧404') return

// 在浏览器扩展的菜单列表里添加设置选项
GM_registerMenuCommand('btzi-用户设置', function () {
  if (!settingIsInit) {
    settings()
  } else {
    document.body.classList.add('btzi-enabled')
  }
})

export default settings