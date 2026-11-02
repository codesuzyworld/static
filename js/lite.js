/* lite.js: lite mode for weak machines (2 GB virtual machines, no GPU, software WebGL).
   Runs in <head> before anything else. In lite mode <html> gets data-lite, and every script that checks
   prefers-reduced-motion takes its calm path (no parallax, tilt, pinned scroll or looping canvases).
   Pages skip their WebGL scenes and backdrop blurs on html[data-lite]. ?lite=1 forces it on, ?lite=0 off.
   Machines that pass the upfront checks get a frame-rate check after load; if the page stutters it switches
   to lite on the spot (fires 'mib:lite' so live scenes can stop) and remembers it for the next pages. */
;(function () {
  var n = navigator, c = n.connection, q = /[?&]lite=([01])/.exec(location.search), KEY = 'mib-lite'
  var get = function () { try { return localStorage.getItem(KEY) } catch (e) {} }
  var put = function (v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY) } catch (e) {} }
  if (q && q[1] === '0') put(null)
  var lite = q ? q[1] === '1' : get() === '1' || !!(c && c.saveData) || (n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 2)
  if (!q && !lite) {
    try { // no WebGL, or WebGL drawn on the CPU (SwiftShader, llvmpipe, Microsoft Basic Render Driver)
      var g = document.createElement('canvas').getContext('webgl'), d = g && g.getExtension('WEBGL_debug_renderer_info')
      lite = !g || !!(d && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(g.getParameter(d.UNMASKED_RENDERER_WEBGL)))
      var l = g && g.getExtension('WEBGL_lose_context'); if (l) l.loseContext()
    } catch (e) {}
  }

  function on() {
    if (document.documentElement.hasAttribute('data-lite')) return
    document.documentElement.setAttribute('data-lite', '')
    var mm = window.matchMedia.bind(window), noop = function () {}
    window.matchMedia = function (s) {
      return /prefers-reduced-motion:\s*reduce/.test(s)
        ? { matches: true, media: s, onchange: null, addEventListener: noop, removeEventListener: noop, addListener: noop, removeListener: noop }
        : mm(s)
    }
  }
  if (lite) return on()
  if (q) return // ?lite=0: no frame-rate check either

  // frame-rate check: time 60 frames shortly after load; typical frame over 35 ms (under ~30 fps) or 3+ freezes over 100 ms -> lite
  addEventListener('load', function () {
    setTimeout(function () {
      var ts = [], last = 0, hidden = false
      var vis = function () { if (document.hidden) hidden = true } // a background tab pauses frames, which would read as a freeze
      document.addEventListener('visibilitychange', vis)
      requestAnimationFrame(function f(t) {
        if (last) ts.push(t - last)
        last = t
        if (ts.length < 60 && !hidden) return requestAnimationFrame(f)
        document.removeEventListener('visibilitychange', vis)
        if (hidden || document.hidden) return
        var s = ts.slice().sort(function (a, b) { return a - b }), mid = s[s.length >> 1]
        var freezes = ts.filter(function (x) { return x > 100 }).length
        window.__liteCheck = { median: mid, freezes: freezes } // for checking the numbers in the console
        if (mid > 35 || freezes >= 3) { put('1'); on(); dispatchEvent(new Event('mib:lite')) }
      })
    }, 500)
  })
})()
