// ==UserScript==
// @name         SGS Base
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  三国杀依赖脚本
// @author       ll
// @match       http://web.sanguosha.com/*
// @match       *://*.sanguosha.com/*
// @match       *://game.iwan4399.com/yxsgs/*
// @run-at      document-start
// @grant       none
// ==/UserScript==

;(function () {
  'use strict'
  window.WDVerSion = '1.0.0'
  window.SGSMODULE = []
  console._log = console.log
  console._log('%cBASE', 'font-weight: bold; color: white; background-color: #525288; padding: 1px 4px; border-radius: 4px;')
  const _log = function () {
    const args = Array.prototype.slice.call(arguments)
    console._log(...args)
    Array.isArray(SGSMODULE) &&
      SGSMODULE.forEach((fn) => {
        fn(...arguments)
      })
  }
  Object.defineProperty(console, 'log', {
    get() {
      return _log
    },
    set() {
      return
    }
  })
})()
