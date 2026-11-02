/* lite.js: lite mode for weak machines (2 GB virtual machines, no GPU, software WebGL).
   Runs in <head> before anything else. In lite mode <html> gets data-lite, and every script that checks
   prefers-reduced-motion takes its calm path (no parallax, tilt, pinned scroll or looping canvases).
   Pages skip their WebGL scenes and backdrop blurs on html[data-lite]. ?lite=1 forces it on, ?lite=0 off. */
;(function () {
  var n = navigator, q = /[?&]lite=([01])/.exec(location.search)
  var lite = q ? q[1] === '1' : (n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 2)
  if (!q && !lite) {
    try { // no WebGL, or WebGL drawn on the CPU (SwiftShader, llvmpipe, Microsoft Basic Render Driver)
      var g = document.createElement('canvas').getContext('webgl'), d = g && g.getExtension('WEBGL_debug_renderer_info')
      lite = !g || !!(d && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(g.getParameter(d.UNMASKED_RENDERER_WEBGL)))
      var l = g && g.getExtension('WEBGL_lose_context'); if (l) l.loseContext()
    } catch (e) {}
  }
  if (!lite) return
  document.documentElement.setAttribute('data-lite', '')
  var mm = window.matchMedia.bind(window), noop = function () {}
  window.matchMedia = function (s) {
    return /prefers-reduced-motion:\s*reduce/.test(s)
      ? { matches: true, media: s, onchange: null, addEventListener: noop, removeEventListener: noop, addListener: noop, removeListener: noop }
      : mm(s)
  }
})()
