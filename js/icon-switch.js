/* icon-switch.js: demo arrows at the screen edges of the "What do you need to protect" cards (V1 + V2).
   Each arrow moves every card to the previous / next icon style (3D, line, flat, glass, solid, mono, deco), one card after another.
   Cards are matched by kind (auto, home, condo, business), so any card order works; rows with other cards are left alone. */
;(function () {
  if (window.__iconSwitch) return
  window.__iconSwitch = 1
  var STYLES = {
    auto: ['/static/landing/v4/auto.webp', '/static/landing/line-auto-anim.svg', '/static/landing/v3/icons/car.svg', '/static/landing/v4/glass/auto.svg', '/static/landing/v4/solid/auto.svg', '/static/landing/v4/mono/auto.svg', '/static/landing/v4/deco/auto.svg'],
    home: ['/static/landing/v4/home.webp', '/static/landing/line-home-anim.svg', '/static/landing/v3/icons/house.svg', '/static/landing/v4/glass/home.svg', '/static/landing/v4/solid/home.svg', '/static/landing/v4/mono/home.svg', '/static/landing/v4/deco/home.svg'],
    condo: ['/static/landing/v4/condo.webp', '/static/landing/line-condo-anim.svg', '/static/landing/v3/icons/condo.svg', '/static/landing/v4/glass/condo.svg', '/static/landing/v4/solid/condo.svg', '/static/landing/v4/mono/condo.svg', '/static/landing/v4/deco/condo.svg'],
    business: ['/static/landing/v4/business-cafe.webp', '/static/landing/line-business-anim.svg', '/static/landing/v3/icons/store.svg', '/static/landing/v4/glass/business.svg', '/static/landing/v4/solid/business.svg', '/static/landing/v4/mono/business.svg', '/static/landing/v4/deco/business.svg']
  }
  var ALIAS = { car: 'auto', house: 'home', store: 'business', cafe: 'business' }
  // V3's flat icons are a small layered build (shadow, speed lines, accessory) animated by .tile-anim CSS in the shared stylesheet
  var FLAT = { auto: '<span class="ta-speed"><i></i><i></i><i></i></span>', home: 'shield', condo: 'key', business: 'briefcase' }
  var svgs = {} // SVG sets are inlined so their own animations run and react to the card's hover (an <img> can't see :hover outside it)
  var V = '20261029j' // bump when the icon SVGs change, so browsers don't keep old copies
  var N = STYLES.auto.length
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'

  // what an art node shows: kind from its file name (img) or class (V1 inlines the line icons as <svg class="ia-auto ...">)
  function read(node) {
    var id = node.getAttribute('src') || node.getAttribute('class') || ''
    var m = /(auto|car|home|house|condo|business|store|cafe)/.exec(id.split('/').pop())
    if (!m) return null
    var kind = ALIAS[m[1]] || m[1], path = id.split('?')[0]
    var style = node.tagName.toLowerCase() === 'svg' ? 1 : STYLES[kind].indexOf(path)
    return { kind: kind, style: style < 0 ? 0 : style }
  }

  function make(kind, s, src) {
    if (s !== 0 && s !== 2) {
      var box = document.createElement('span')
      box.className = 'ml-art-line'
      box.ready = (svgs[src] = svgs[src] || fetch(src + '?v=' + V).then(function (r) { return r.text() })).then(function (t) {
        box.innerHTML = t
        var svg = box.querySelector('svg'); if (svg) svg.classList.add('ml-anim-icon')
      })
      return box
    }
    if (s === 2) {
      var a = document.createElement('span'), f = FLAT[kind], dir = '/static/landing/v3/icons/'
      a.className = 'tile-anim k-' + kind
      a.innerHTML = '<span class="ta-shadow"></span>' + (kind === 'auto' ? f : '') + '<img class="ta-main" src="' + src + '" alt="">' +
        (kind === 'auto' ? '' : '<span class="ta-s"><img class="ta-acc" src="' + dir + f + '.svg" alt=""></span>') +
        (kind === 'condo' ? '<img class="ta-spark" src="' + dir + 'sparkle.svg" alt="">' : '')
      return a
    }
    var im = new Image(); im.src = src; im.alt = ''; im.decoding = 'async'; im.className = 'ml-art-alt'
    return im
  }

  function setup(row) {
    var arts = [].slice.call(row.querySelectorAll('.ml-protect-art'))
    var cards = arts.map(function (a) { var n = a.firstElementChild; return n && read(n) })
    if (!arts.length || cards.some(function (c) { return !c })) return
    var k = cards[0].style, busy = false
    // one element per style per card; the page's own artwork is kept so its animations come back intact
    var els = arts.map(function (a, i) {
      return STYLES[cards[i].kind].map(function (src, s) {
        return s === cards[i].style ? null : make(cards[i].kind, s, src) // the page's own art is picked up live on the first switch
      })
    })
    function go(dir) {
      if (busy) return
      busy = true
      var was = k
      k = (k + dir + N) % N
      var r = matchMedia('(prefers-reduced-motion: reduce)').matches
      arts.forEach(function (a, n) {
        var i = dir > 0 ? n : arts.length - 1 - n // the wave follows the arrow's direction
        var cur = arts[i].firstElementChild, next = els[i][k]
        els[i][was] = cur // keep what's showing now (V1 inlines its line icons after load, so read it live)
        var out = cur.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-dir * 14) + 'px) scale(.86)' }],
          { duration: r ? 1 : 240, delay: r ? 0 : n * 70, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' })
        out.onfinish = function () {
          var ready = next.decode ? next.decode().catch(function () {}) : Promise.resolve(next.ready)
          ready.then(function () {
            out.cancel()
            arts[i].replaceChild(next, cur)
            next.animate([{ opacity: 0, transform: 'translateX(' + (dir * 14) + 'px) scale(.86)' }, { opacity: 1, transform: 'none' }],
              { duration: r ? 1 : 560, easing: 'cubic-bezier(.34,1.45,.64,1)' })
              .onfinish = function () { if (n === arts.length - 1) busy = false }
          })
        }
      })
    }
    ;[-1, 1].forEach(function (dir) {
      var b = document.createElement('button')
      b.type = 'button'
      b.className = 'ml-art-nav ' + (dir < 0 ? 'is-prev' : 'is-next')
      b.setAttribute('aria-label', dir < 0 ? 'Previous icon style' : 'Next icon style')
      b.innerHTML = ARROW
      b.addEventListener('click', function () { go(dir) })
      row.appendChild(b)
    })
  }

  function init() { [].forEach.call(document.querySelectorAll('.ml-v3-protect .ml-protect-row'), setup) }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init()
})()
