/* site.js: plain-JS runtime for the pages that used to be React (Next.js) exports.
   Each page was saved as its settled HTML; the bits React built on demand (mega menus, office cards,
   mobile menu, form thank-you, theme icons) live in <template>s inside #site-tpls and get cloned in here.
   Elements with data-a-to start at their inline style and animate to data-a-to when scrolled into view. */
;(function () {
  if (window.__siteJs) return
  window.__siteJs = 1
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)) }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var EASE = 'cubic-bezier(.22,1,.36,1)'
  function tpl(kind, key) {
    var sel = '#site-tpls template[data-kind="' + kind + '"]' + (key != null ? '[data-key="' + key + '"]' : '')
    return document.querySelector(sel)
  }
  function clone(t) { return t.content.firstElementChild.cloneNode(true) }
  function css(str) { var d = document.createElement('div'); d.setAttribute('style', str || ''); return d.style }

  // ---- entrance animations (framer's initial -> final styles)
  function play(el, delay) {
    var to = el.getAttribute('data-a-to')
    if (to == null) return
    el.removeAttribute('data-a-to')
    // animated icons inside restart as their card comes in, so the draw-in is seen
    $$('svg.ml-anim-icon', el).forEach(function (svg) { svg.replaceWith(svg.cloneNode(true)) })
    if (reduce) { el.setAttribute('style', to); return }
    var t = css(to)
    var word = el.classList.contains('ml-word-inner')
    el.style.transition = 'opacity ' + (word ? .55 : .7) + 's ' + EASE + ' ' + delay + 's, transform ' + (word ? .7 : .9) + 's ' + EASE + ' ' + delay + 's'
    void el.offsetWidth
    // set each settled property rather than replacing the style, so values other scripts add meanwhile (e.g. --mega-left) survive
    for (var i = 0; i < t.length; i++) if (t[i] !== 'transition') el.style.setProperty(t[i], t.getPropertyValue(t[i]))
    if (!t.opacity) el.style.opacity = '1'
    if (!t.transform) el.style.transform = 'none'
    setTimeout(function () { el.style.transition = t.transition || '' }, (delay + 1) * 1000)
  }
  function playAll(list, step) {
    var i = 0
    list.forEach(function (el) { play(el, Math.min(i++ * (el.classList.contains('ml-word-inner') ? .035 : step || .07), .6)) })
  }
  var io = 'IntersectionObserver' in window && new IntersectionObserver(function (es) {
    var batch = []
    es.forEach(function (e) {
      if (!e.isIntersecting) return
      io.unobserve(e.target)
      if (e.target.classList.contains('mib-block-reveal')) e.target.setAttribute('data-revealed', 'true')
      else batch.push(e.target)
    })
    playAll(batch)
  }, { rootMargin: '0px 0px -6% 0px' })
  function watch(root) {
    $$('[data-a-to]', root).forEach(function (el) {
      if (el.closest('template')) return
      io ? io.observe(el) : play(el, 0)
    })
    $$('.mib-block-reveal:not([data-revealed])', root).forEach(function (el) {
      io ? io.observe(el) : el.setAttribute('data-revealed', 'true')
    })
  }

  // ---- theme (pre-paint script in <head> sets data-theme; this keeps toggles and storage in sync)
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t)
    try { localStorage.setItem('payload-theme', t); localStorage.setItem('mib-theme', t) } catch (e) {}
    var icon = tpl('theme-icon', t)
    $$('[data-theme-toggle]').forEach(function (b) {
      if (icon) { b.innerHTML = icon.innerHTML; watch(b) } // the dark icon starts hidden and fades in via data-a-to
      b.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')
    })
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-theme-toggle]')) setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark')
  })

  // ---- desktop nav mega menus (V2-style .mib-topnav-desktop and V1-style header.ml-nav pills)
  function megas() {
    var nav = document.querySelector('.mib-topnav-desktop nav, header.ml-nav nav.ml-nav-pills')
    if (!nav) return
    var links = $$('a.mib-topnav-link, a.ml-nav-link', nav)
    // V1-style nav: a pill background follows the hovered link
    var pill = nav.querySelector('.ml-nav-pill-bg'), home = pill && pill.parentElement
    function movePill(to) {
      if (!pill || pill.parentElement === to) return
      var a = pill.getBoundingClientRect()
      to.appendChild(pill)
      var b = pill.getBoundingClientRect()
      pill.style.opacity = '1'
      if (!reduce && a.width && b.width) pill.animate([{ transform: 'translateX(' + (a.left - b.left) + 'px) scaleX(' + a.width / b.width + ')' }, { transform: 'none' }], { duration: 350, easing: EASE })
    }
    var open = null, closeT = 0
    function close() {
      links.forEach(function (a) { if (a.hasAttribute('aria-expanded')) a.setAttribute('aria-expanded', 'false') })
      if (home) movePill(home)
      if (!open) return
      var m = open; open = null
      m.style.transition = 'opacity .15s, transform .15s'
      m.style.opacity = '0'
      setTimeout(function () { m.remove() }, 160)
    }
    function show(a) {
      clearTimeout(closeT)
      var href = a.getAttribute('href'), t = tpl('mega', href)
      movePill(a)
      links.forEach(function (l) { if (l.hasAttribute('aria-expanded')) l.setAttribute('aria-expanded', l === a && t ? 'true' : 'false') })
      if (open && open.getAttribute('data-for') === href) return
      if (open) { open.remove(); open = null }
      if (!t) return
      var m = clone(t)
      m.setAttribute('data-for', href)
      nav.appendChild(m)
      // line the menu up with the hovered link (the CSS reads --mega-left)
      var op = m.offsetParent || nav
      m.style.setProperty('--mega-left', (a.getBoundingClientRect().left - op.getBoundingClientRect().left) + 'px')
      open = m
      playAll([m].concat($$('[data-a-to]', m)), .04)
    }
    links.forEach(function (a) {
      a.addEventListener('mouseenter', function () { show(a) })
    })
    nav.addEventListener('mouseleave', function () { closeT = setTimeout(close, 180) })
    nav.addEventListener('mouseenter', function () { clearTimeout(closeT) })
    // hovered item: soft highlight behind it and a little wiggle on its icon
    nav.addEventListener('mouseover', function (e) {
      var item = e.target.closest('.mib-mega-item')
      if (!item || item.querySelector('.mib-mega-highlight')) return
      $$('.mib-mega-highlight', nav).forEach(function (h) { h.remove() })
      $$('.mib-mega-icon', nav).forEach(function (i) { i.style.transform = 'none' })
      var h = document.createElement('span')
      h.className = 'mib-mega-highlight'
      item.insertBefore(h, item.firstChild)
      var icon = item.querySelector('.mib-mega-icon')
      if (icon) { icon.style.transition = 'transform .35s ' + EASE; icon.style.transform = 'scale(1.12) rotate(-6deg)' }
    })
  }

  // ---- mobile menu sheet
  function mobile() {
    var btn = document.querySelector('button[aria-label="Open menu"]')
    var t = tpl('mobile-sheet')
    if (!btn || !t) return
    var sheet = null
    function setIcon(name) { var s = btn.querySelector('span'); if (s) s.textContent = name }
    function close() {
      if (!sheet) return
      sheet.remove(); sheet = null
      document.body.style.overflow = ''
      btn.setAttribute('aria-label', 'Open menu'); btn.setAttribute('aria-expanded', 'false'); setIcon('menu')
    }
    btn.addEventListener('click', function () {
      if (sheet) return close()
      sheet = clone(t)
      // the sheet goes back where React put it: the page body (V2 nav) or inside header.ml-nav (V1 nav)
      var into = document.querySelector(t.getAttribute('data-into') || 'body') || document.body
      into.insertBefore(sheet, into.children[+t.getAttribute('data-index')] || null)
      playAll($$('[data-a-to]', sheet).concat(sheet.hasAttribute('data-a-to') ? [sheet] : []), .03)
      if (into === document.body) document.body.style.overflow = 'hidden'
      btn.setAttribute('aria-label', 'Close menu'); btn.setAttribute('aria-expanded', 'true'); setIcon('close')
      sheet.addEventListener('click', function (e) {
        var b = e.target.closest('button[aria-label="Expand"],button[aria-label="Collapse"]')
        if (!b) { if (e.target.closest('a')) close(); return }
        var sec = b.parentElement
        while (sec.parentElement !== sheet) sec = sec.parentElement
        var idx = Array.prototype.indexOf.call(sheet.children, sec)
        if (b.getAttribute('aria-label') === 'Expand') {
          var x = tpl('mobile-section', idx)
          if (!x) return
          var open = clone(x)
          open.__closed = sec
          sec.replaceWith(open)
        } else if (sec.__closed) sec.replaceWith(sec.__closed)
      })
    })
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close() })
    window.addEventListener('resize', function () { if (window.innerWidth >= 1280) close() })
  }

  // ---- office locations: pills swap the office card; the stacked map iframes cross-fade (no reloads)
  function locations() {
    var pills = $$('.ml-loc-pill')
    if (!pills.length || !tpl('hq', 0)) return
    pills.forEach(function (p, i) {
      p.addEventListener('click', function () {
        var cur = document.querySelector('.ml-hq'), t = tpl('hq', i)
        if (!cur || !t) return
        pills.forEach(function (q) { q.classList.toggle('is-active', q === p) })
        var next = clone(t)
        var oldMap = cur.querySelector('.ml-hq-map'), newMap = next.querySelector('.ml-hq-map')
        if (oldMap && newMap) {
          // maps are matched by address; an office's map is added the first time it's picked and,
          // like before, the current map stays up until the new one has loaded, then they cross-fade
          var target = $$('iframe', newMap).filter(function (f) { return f.style.opacity === '1' })[0]
          newMap.replaceWith(oldMap)
          if (target) {
            var src = target.getAttribute('src')
            oldMap.__want = src
            var show = function (f) {
              if (oldMap.__want !== f.getAttribute('src')) return
              $$('iframe', oldMap).forEach(function (o) {
                var on = o === f
                o.style.opacity = on ? '1' : '0'; o.style.pointerEvents = on ? 'auto' : 'none'; o.style.zIndex = on ? '1' : '0'
              })
            }
            var have = $$('iframe', oldMap).filter(function (f) { return f.getAttribute('src') === src })[0]
            if (have) show(have)
            else {
              target.style.opacity = '0'; target.style.pointerEvents = 'none'; target.style.zIndex = '0'
              target.addEventListener('load', function () { show(target) }, { once: true })
              oldMap.appendChild(target)
            }
          }
        }
        cur.replaceWith(next)
        if (!reduce) $$(':scope > :not(.ml-hq-map)', next).forEach(function (el, k) {
          el.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: k * 60, easing: EASE, fill: 'backwards' })
        })
      })
    })
  }

  // ---- tilt cards (max 6deg, lift 8px, like the React Tilt)
  function tilt() {
    $$('[data-tilt]').forEach(function (el) {
      var base = el.style.transform || 'perspective(900px)'
      el.addEventListener('pointermove', function (e) {
        if (reduce || e.pointerType === 'touch') return
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5
        el.style.transition = 'transform .15s ease-out'
        el.style.transform = 'perspective(900px) rotateX(' + (-y * 12).toFixed(2) + 'deg) rotateY(' + (x * 12).toFixed(2) + 'deg) translateY(-8px)'
      })
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform .6s ' + EASE
        el.style.transform = base
      })
    })
  }

  // ---- quote form: a valid submit shows the thank-you panel (the demo never sent anything)
  function form() {
    var t = tpl('form-thanks')
    $$('form.ml-form-fields').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault()
        var card = f.closest('.ml-quote-card') || f.parentElement
        if (!t || !card) return
        card.innerHTML = t.innerHTML
        watch(card)
        playAll($$('[data-a-to]', card))
      })
    })
  }

  // ---- floating shapes: data-float="amplitude,rotate,duration,delay" (rise to -amplitude and tilt, then back, forever)
  function floats() {
    if (reduce) return
    $$('[data-float]').forEach(function (el) {
      var f = el.getAttribute('data-float').split(',').map(Number)
      el.animate([{ transform: 'none' }, { transform: 'translateY(' + -f[0] + 'px) rotate(' + f[1] + 'deg)' }, { transform: 'none' }],
        { duration: f[2] * 1000, delay: f[3] * 1000, iterations: Infinity, easing: 'ease-in-out' })
    })
  }

  // ---- hero depth layers: data-depth=N shifts N px with the pointer (N * -1..1 across the hero), eases back on leave
  function depth() {
    var els = $$('[data-depth]')
    if (!els.length || reduce) return
    var field = els[0].closest('section') || document.body
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0
    function tick() {
      x += (tx - x) * .12; y += (ty - y) * .12
      els.forEach(function (el) {
        var d = +el.getAttribute('data-depth')
        el.style.transform = Math.abs(x) + Math.abs(y) < .001 ? 'none' : 'translateX(' + (d * x).toFixed(2) + 'px) translateY(' + (d * y).toFixed(2) + 'px)'
      })
      raf = Math.abs(tx - x) + Math.abs(ty - y) > .001 ? requestAnimationFrame(tick) : 0
    }
    function go() { if (!raf) raf = requestAnimationFrame(tick) }
    field.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return
      var r = field.getBoundingClientRect()
      tx = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1))
      ty = Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height * 2 - 1))
      go()
    })
    field.addEventListener('pointerleave', function () { tx = 0; ty = 0; go() })
  }

  // ---- V1 pinned headline ("Insurance for everyone"): fades from 15% to full as its track scrolls in
  //      (same mapping as the React build: full after ~45% of the window height)
  function pinFade() {
    var pins = $$('.ml-pin-track .ml-pin')
    if (!pins.length) return
    function on() {
      pins.forEach(function (el) {
        var t = el.closest('.ml-pin-track').getBoundingClientRect().top
        var k = Math.max(0, Math.min(1, (innerHeight - t) / (innerHeight * .45)))
        el.style.opacity = reduce ? '1' : (.15 + .85 * k).toFixed(3)
      })
    }
    window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on); on()
  }

  // ---- V1-style nav gets data-scrolled once the page moves
  function navScrolled() {
    var h = document.querySelector('header.ml-nav')
    if (!h) return
    function on() { if (window.scrollY > 48) h.setAttribute('data-scrolled', 'true'); else h.removeAttribute('data-scrolled') }
    window.addEventListener('scroll', on, { passive: true }); on()
  }

  // ---- V2 product icons: inline the animated SVGs so hovering the card can drive their full animation
  //      (an <img> can't see the page's :hover). Each SVG scopes its own CSS under .ia-<name>.
  function inlineIcons() {
    $$('.ml-protect-art img[src*="-anim.svg"]').forEach(function (img) {
      fetch(img.getAttribute('src').split('#')[0]).then(function (r) { return r.ok ? r.text() : null }).then(function (t) {
        if (!t || !img.isConnected) return
        var box = document.createElement('div'); box.innerHTML = t
        var svg = box.querySelector('svg'); if (!svg) return
        svg.classList.add('ml-anim-icon')
        img.replaceWith(svg)
      }).catch(function () {})
    })
  }

  // ---- pressable controls: quick squash while pressed
  var st = document.createElement('style')
  st.textContent = '[data-press]{transition:transform .2s cubic-bezier(.34,1.56,.64,1)}[data-press]:active{transform:scale(.96)}' +
    // inlined icons keep the old <img> sizing, hover pop and dark-mode lift
    '.ml-protect-art svg.ml-anim-icon{max-width:80%;height:auto;transition:transform .7s cubic-bezier(.34,1.56,.64,1)}' +
    // hover: a subtle float instead of the old scale + slant
    '.ml-protect:hover .ml-protect-art svg.ml-anim-icon{animation:ml-icon-float 2.6s cubic-bezier(.45,0,.55,1) infinite}' +
    '@keyframes ml-icon-float{0%,100%{transform:translateY(-2px)}50%{transform:translateY(-7px)}}' +
    '@media (prefers-reduced-motion:reduce){.ml-protect:hover .ml-protect-art svg.ml-anim-icon{animation:none}}' +
    'html[data-theme=dark] .ml-protect-art svg.ml-anim-icon{filter:brightness(1.25)}'
  document.head.appendChild(st)

  function init() {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light')
    watch(document)
    megas(); mobile(); locations(); tilt(); form(); floats(); depth(); navScrolled(); inlineIcons(); pinFade()
    // demo: icon-style switcher on the product cards
    if (document.querySelector('.ml-v3-protect .ml-protect-art')) { var sw = document.createElement('script'); sw.src = '/static/js/icon-switch.js?v=20261029p'; document.body.appendChild(sw) }
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init()
})()

/* ---- DOM add-ons carried over from the old bundle (mobile theme row, location dropdown, reviews row, stat units, animated logos, mega alignment, hero slideshows) */
;(function(){if(typeof document==="undefined")return;
// mobile menu theme row: V1/V2 hide .ml-theme-toggle under 1100px, so mirror it inside the sheet
function isDark(){return document.documentElement.getAttribute("data-theme")==="dark"}
function paint(b){var d=isDark();b.innerHTML='<span class="material-symbols-rounded" aria-hidden="true">'+(d?"light_mode":"dark_mode")+"</span>"+(d?"LIGHT MODE":"DARK MODE");b.setAttribute("aria-label",d?"Switch to light theme":"Switch to dark theme")}
function add(){var s=document.querySelector(".ml-nav-sheet");if(!s||s.querySelector(".ml-sheet-theme"))return;var t=document.querySelector(".ml-theme-toggle");if(!t)return;var b=document.createElement("button");b.type="button";b.className="ml-sheet-theme";paint(b);b.addEventListener("click",function(){t.click();setTimeout(function(){paint(b)},30)});s.insertBefore(b,s.querySelector(".ml-btn"))}
new MutationObserver(add).observe(document.documentElement,{childList:true,subtree:true})})();
;(function(){if(typeof document==="undefined")return;
// V3 mobile menu (div.xl:hidden list): add a theme row that drives the existing nav toggle
function src(){return[].slice.call(document.querySelectorAll('button[aria-label^="Switch to"]')).find(function(b){return!b.classList.contains("mib-v3-sheet-theme")})}
function paint(b){var d=document.documentElement.getAttribute("data-theme")==="dark";b.innerHTML='<span class="material-symbols-rounded" aria-hidden="true">'+(d?"light_mode":"dark_mode")+"</span>"+(d?"LIGHT MODE":"DARK MODE");b.setAttribute("aria-label",d?"Switch to light theme":"Switch to dark theme")}
function add(){var m=[].slice.call(document.querySelectorAll("div.xl\\:hidden")).find(function(x){return x.querySelector('a[href="/static/careers"]')&&x.getBoundingClientRect().width>0});if(!m||m.querySelector(".mib-v3-sheet-theme"))return;var b=document.createElement("button");b.type="button";b.className="mib-v3-sheet-theme";paint(b);b.addEventListener("click",function(){var t=src();if(t)t.click();setTimeout(function(){paint(b)},30)});m.appendChild(b)}
new MutationObserver(add).observe(document.documentElement,{childList:true,subtree:true})})();
;(function(){if(typeof document==="undefined")return;
// mobile: location pills become a mib-ui style dropdown; choosing an item clicks the matching pill so each page's own map logic runs
var CHEV='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',CHECK='<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',uid=0;
function isOn(b){return b.classList.contains("is-active")||b.classList.contains("active")||b.getAttribute("aria-selected")==="true"||b.getAttribute("aria-pressed")==="true"}
function lca(a){var n=a[0].parentElement;while(n&&!a.every(function(x){return n.contains(x)}))n=n.parentElement;return n}
function wire(){var g=[].slice.call(document.querySelectorAll(".loc-tabs")).map(function(t){return[].slice.call(t.querySelectorAll("button"))});var ml=[].slice.call(document.querySelectorAll(".ml-loc-pill"));if(ml.length)g.push(ml);g.forEach(one)}
function one(pills){if(pills.length<2)return;var box=pills[0].closest(".loc-tabs")||lca(pills);if(!box||box.classList.contains("loc-pills-mobile-hide"))return;
var id="locdd"+(++uid),wrap=document.createElement("div");wrap.className="locdd";
wrap.innerHTML='<button type="button" class="locdd-btn" aria-haspopup="listbox" aria-expanded="false" aria-controls="'+id+'"><span class="locdd-val"></span><span class="locdd-chev">'+CHEV+'</span></button><ul class="locdd-panel" role="listbox" id="'+id+'" tabindex="-1" hidden></ul>';
var btn=wrap.firstChild,val=btn.firstChild,list=wrap.lastChild,cur=0,hi=0;
pills.forEach(function(b,i){var li=document.createElement("li");li.className="locdd-item";li.setAttribute("role","option");li.id=id+"-"+i;li.innerHTML='<span>'+b.textContent.trim()+'</span><span class="locdd-check">'+CHECK+'</span>';li.addEventListener("click",function(){pick(i)});li.addEventListener("mousemove",function(){mark(i)});list.appendChild(li)});
var items=[].slice.call(list.children);
function sync(){var i=pills.findIndex(isOn);if(i>=0)cur=i;val.textContent=pills[cur].textContent.trim();items.forEach(function(li,j){li.setAttribute("aria-selected",j===cur?"true":"false")})}
function mark(i){hi=i;items.forEach(function(li,j){li.classList.toggle("is-hi",j===i)});list.setAttribute("aria-activedescendant",items[i].id);items[i].scrollIntoView({block:"nearest"})}
function open(o){list.hidden=!o;btn.setAttribute("aria-expanded",o);wrap.classList.toggle("is-open",o);if(o){mark(cur);list.focus()}}
function pick(i){pills[i].click();cur=i;setTimeout(sync,50);sync();open(false);btn.focus()}
btn.addEventListener("click",function(){open(list.hidden)});
btn.addEventListener("keydown",function(e){if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();open(true)}});
list.addEventListener("keydown",function(e){if(e.key==="ArrowDown"){e.preventDefault();mark(Math.min(hi+1,items.length-1))}else if(e.key==="ArrowUp"){e.preventDefault();mark(Math.max(hi-1,0))}else if(e.key==="Home"){e.preventDefault();mark(0)}else if(e.key==="End"){e.preventDefault();mark(items.length-1)}else if(e.key==="Enter"||e.key===" "){e.preventDefault();pick(hi)}else if(e.key==="Escape"||e.key==="Tab"){open(false);if(e.key==="Escape")btn.focus()}});
document.addEventListener("click",function(e){if(!wrap.contains(e.target))open(false)});
pills.forEach(function(b){b.addEventListener("click",function(){setTimeout(sync,50)})});
sync();box.parentNode.insertBefore(wrap,box);box.classList.add("loc-pills-mobile-hide")}
var t;new MutationObserver(function(){clearTimeout(t);t=setTimeout(wire,200)}).observe(document.documentElement,{childList:true,subtree:true});if(document.readyState!=="loading")wire();else document.addEventListener("DOMContentLoaded",wire)})();
;(function(){if(typeof document==="undefined")return;
// mobile reviews: horizontal row, starts on the middle card; the card nearest the centre is full size, neighbours shrink
var mq=matchMedia("(max-width:1100px),(max-aspect-ratio:6/5)");
function cards(row){return[].slice.call(row.children).filter(function(c){return!c.classList.contains("ml-floater")})}
function paint(row){var r=row.getBoundingClientRect(),mid=r.left+r.width/2;cards(row).forEach(function(c){var b=c.getBoundingClientRect(),d=Math.min(Math.abs(b.left+b.width/2-mid)/b.width,1);var x=c.querySelector(".ml-review")||c;x.style.transform=mq.matches?"scale("+(1-.14*d)+")":"";x.style.opacity=mq.matches?String(1-.45*d):""})}
function setup(row){if(row.dataset.flow)return;row.dataset.flow="1";var raf=0;row.addEventListener("scroll",function(){cancelAnimationFrame(raf);raf=requestAnimationFrame(function(){paint(row)})},{passive:true});
function centre(){if(!mq.matches){paint(row);return}var cs=cards(row),m=cs[Math.floor(cs.length/2)];if(m)row.scrollLeft=m.offsetLeft-(row.clientWidth-m.offsetWidth)/2;paint(row)}
centre();addEventListener("resize",centre);mq.addEventListener&&mq.addEventListener("change",centre)}
function wire(){[].forEach.call(document.querySelectorAll(".ml-review-row, .ml-v2-reviews-stack"),setup)}
var t;new MutationObserver(function(){clearTimeout(t);t=setTimeout(wire,200)}).observe(document.documentElement,{childList:true,subtree:true});if(document.readyState!=="loading")wire();else document.addEventListener("DOMContentLoaded",wire)})();
;(function(){if(typeof document==="undefined"||!("IntersectionObserver" in window))return;
// V1 footer glow: add .is-lit once the footer scrolls into view (CSS reveals it left→right)
var io=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle("is-lit",e.isIntersecting)})},{threshold:.12});
function wire(){[].forEach.call(document.querySelectorAll(".ml-footer-v1 .ml-footer-inner:not([data-lit])"),function(el){el.setAttribute("data-lit","");io.observe(el)})}
var t;new MutationObserver(function(){clearTimeout(t);t=setTimeout(wire,200)}).observe(document.documentElement,{childList:true,subtree:true});if(document.readyState!=="loading")wire();else document.addEventListener("DOMContentLoaded",wire)})();
;(function(){if(typeof document==="undefined")return;
// wrap the unit in stat values ("10+ yrs") so CSS can size it separately
function wire(){[].forEach.call(document.querySelectorAll(".ml-about-value"),function(el){if(el.querySelector(".ml-about-unit"))return;var m=el.textContent.match(/^(.*?\S)\s+([A-Za-z]+)$/);if(!m)return;el.textContent=m[1]+" ";var u=document.createElement("span");u.className="ml-about-unit";u.textContent=m[2];el.appendChild(u)})}
var t;new MutationObserver(function(){clearTimeout(t);t=setTimeout(wire,150)}).observe(document.documentElement,{childList:true,subtree:true});if(document.readyState!=="loading")wire();else document.addEventListener("DOMContentLoaded",wire)})();
;(function(){if(typeof document==="undefined")return;
// V1 footer logo: inline the classed SVG so shield, m, i, b and tagline can fade in one after another
var svg=null;
function wire(){var img=document.querySelector(".ml-footer-v1 .ml-footer-logo img");if(!img||img.dataset.anim)return;img.dataset.anim="1";
fetch("/static/brand/miblogo-dark-anim.svg").then(function(r){return r.text()}).then(function(t){var box=document.createElement("span");box.className="ml-logo-anim";box.setAttribute("aria-hidden","true");box.innerHTML=t;var s=box.querySelector("svg");s.removeAttribute("width");s.removeAttribute("height");img.after(box);
if(!("IntersectionObserver" in window)){box.classList.add("is-in");return}
new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle("is-in",e.isIntersecting)})},{threshold:.35}).observe(box)}).catch(function(){})}
var t;new MutationObserver(function(){clearTimeout(t);t=setTimeout(wire,200)}).observe(document.documentElement,{childList:true,subtree:true});if(document.readyState!=="loading")wire();else document.addEventListener("DOMContentLoaded",wire)})();
;(function(){if(typeof document==="undefined")return;
// V3 nav + footer logos (and V1 footer ink): inline the classed SVG so its parts fade in one after another
var txt=null,io="IntersectionObserver" in window?new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle("is-in",e.isIntersecting)})},{threshold:.3}):null;
function make(ink,extra){var b=document.createElement("span");b.className="ml-logo-anim"+(extra?" "+extra:"");b.setAttribute("aria-hidden","true");b.dataset.ink=ink;b.innerHTML=txt;var s=b.querySelector("svg");s.removeAttribute("width");s.removeAttribute("height");s.setAttribute("preserveAspectRatio","xMinYMid meet");if(io)io.observe(b);else b.classList.add("is-in");return b}
function wire(){if(!txt)return;
[].forEach.call(document.querySelectorAll(".ml-footer-v1 .ml-logo-anim:not([data-ink])"),function(b){b.dataset.ink="theme"});
[].forEach.call(document.querySelectorAll(".mib-v3-footer img[src*='miblogo']:not([data-anim])"),function(i){i.dataset.anim="1";i.style.display="none";i.after(make("white"))});
[].forEach.call(document.querySelectorAll("a > span:not([data-anim])"),function(sp){if(!/miblogo/.test(getComputedStyle(sp).backgroundImage))return;sp.dataset.anim="1";sp.style.backgroundImage="none";sp.appendChild(make("theme","in-span"))})}
fetch("/static/brand/miblogo-dark-anim.svg").then(function(r){return r.text()}).then(function(t){txt=t;wire()}).catch(function(){});
var t;new MutationObserver(function(){clearTimeout(t);t=setTimeout(wire,150)}).observe(document.documentElement,{childList:true,subtree:true})})();
;(function(){if(typeof document==="undefined")return;
// V3 desktop nav: line the (V2-style) mega menu up with the hovered pill, like V2 does via --mega-left
var pill=null;
function place(){var m=document.querySelector(".mib-topnav-desktop .mib-mega");if(!m||!pill)return;var op=m.offsetParent||m.parentElement;m.style.setProperty("--mega-left",(pill.getBoundingClientRect().left-op.getBoundingClientRect().left)+"px")}
document.addEventListener("pointerover",function(e){var a=e.target.closest&&e.target.closest(".mib-topnav-desktop a,.mib-topnav-desktop button");if(!a||!/^(PERSONAL|BUSINESS)$/i.test(a.textContent.trim()))return;pill=a;requestAnimationFrame(place)},true);
new MutationObserver(function(){if(pill)place()}).observe(document.documentElement,{childList:true,subtree:true})})();
;/* V1/V2 hero: cycle the family photos every 2s (V1: cutouts over the brokers slot; V2: full hero scenes) */(function(){if(typeof window==="undefined")return;var SETS=[{q:".ml-hero-v1 img.ml-cover[src$='people-business.webp']",srcs:["/static/landing/family-1.webp?v=16","/static/landing/people-business.webp","/static/landing/v1-riders.webp?v=5"]},{q:".ml-hero-v3 .ml-v3-hero-bg img.ml-cover[src$='v3-hero.webp']",srcs:["/static/landing/v2-hero-family-original.webp?v=3","/static/landing/v2-hero-people-b.webp?v=14","/static/landing/v2-hero-riders.webp?v=7"],layers:[["sh","/static/landing/v2-hero-shield.webp"],["bd","/static/landing/v2-hero-backdrop.webp"]]}];var groups=[];function setup(){SETS.forEach(function(s){var a=document.querySelector(s.q);if(!a||a.dataset.mlCycle)return;a.dataset.mlCycle="1";a.parentElement.classList.add("ml-cycle-wrap");a.classList.add("ml-cycle");var fr=s.srcs.map(function(src){var b=a.cloneNode();b.removeAttribute("data-ml-cycle");b.src=src;b.alt="A smiling family";b.classList.add("ml-cycle-alt");a.parentElement.insertBefore(b,a.nextSibling);return b});var on=function(el){requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add("is-on")})})};on(fr[0]);(s.layers||[]).forEach(function(l){var c=a.cloneNode();c.removeAttribute("data-ml-cycle");c.src=l[1];c.alt="";c.dataset.layer=l[0];c.classList.add("ml-cycle-alt");on(c);a.parentElement.insertBefore(c,a.nextSibling)});groups.push({all:fr,i:0})})}function start(){setup();new MutationObserver(setup).observe(document.body,{childList:true,subtree:true});function step(g){if(!g.all[0].isConnected)return;g.all[g.i].classList.remove("is-on");g.i=(g.i+1)%g.all.length;g.all[g.i].classList.add("is-on")}var iv=0;function run(){clearInterval(iv);iv=setInterval(function(){groups.forEach(step)},4000)}document.addEventListener("click",function(e){if(e.target.closest("a,button,input,select,textarea"))return;groups.forEach(function(g){var im=g.all[g.i];if(!im.isConnected)return;var r=im.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){step(g);run()}})});if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;run()}/* start as soon as React has hydrated the hero (inserting earlier causes hydration error #418), not after every image on the page; warm the cache meanwhile */SETS.forEach(function(s){s.srcs.concat((s.layers||[]).map(function(l){return l[1]})).forEach(function(u){new Image().src=u})});var go=0;function ready(){if(go)return;var a=document.querySelector(".ml-hero-v3 .ml-v3-hero-bg img, .ml-hero-v1 img.ml-cover");var react=document.querySelector("script[src*='/_next/']");/* plain static pages (no React) can start right away */if(document.readyState==="complete"||(a&&(!react||Object.keys(a).some(function(k){return k.indexOf("__reactFiber")===0})))){go=1;setTimeout(start,50)}else setTimeout(ready,50)}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready);else ready()})();;/* V2 hero parallax (like V1): the scene drifts with the pointer, eased */(function(){if(typeof window==="undefined"||matchMedia("(hover:none),(prefers-reduced-motion: reduce)").matches)return;var tx=0,ty=0,x=0,y=0,raf=0;function hero(){return document.querySelector(".ml-hero-v3")}function tick(){x+=(tx-x)*.08;y+=(ty-y)*.08;var h=hero();if(h){h.style.setProperty("--mx",x.toFixed(3));h.style.setProperty("--my",y.toFixed(3))}raf=Math.abs(tx-x)+Math.abs(ty-y)>.002?requestAnimationFrame(tick):0}addEventListener("pointermove",function(e){if(!hero()||scrollY>innerHeight)return;tx=e.clientX/innerWidth*2-1;ty=e.clientY/innerHeight*2-1;if(!raf)raf=requestAnimationFrame(tick)},{passive:true})})();;/* V2 hero scroll parallax: layers drift at different speeds while the hero is on screen */(function(){if(typeof window==="undefined"||matchMedia("(prefers-reduced-motion: reduce)").matches)return;var raf=0;function f(){raf=0;var h=document.querySelector(".ml-hero-v3");if(!h)return;var y=Math.min(scrollY,innerHeight*1.2);h.style.setProperty("--sy",y.toFixed(1))}addEventListener("scroll",function(){if(!raf)raf=requestAnimationFrame(f)},{passive:true})})();;/* V1/V2 desktop: fit the family photo so heads start partway down and the baby's chin lands at the fold (V2: at 86% of the window, clear of the bottom fade) (shared helper) */(function(){if(typeof window==="undefined")return;
var SETS=[{q:".ml-hero-v1 img.ml-cycle-alt[src*='family-1.webp']",box:[444,100,1555,1250],top:.3,cap:.42},{q:".ml-hero-v3 .ml-v3-hero-bg img.ml-cycle-alt[src*='v2-hero-people-1.webp']",box:[1260,540,2371,1690],top:.24,cap:.5,end:.86}];
function contentRect(im,b){var r=im.getBoundingClientRect(),c=getComputedStyle(im),iw=im.naturalWidth,ih=im.naturalHeight;if(!iw)return null;var fit=c.objectFit,k=fit==="cover"?Math.max(r.width/iw,r.height/ih):fit==="fill"?0:Math.min(r.width/iw,r.height/ih);var kx=k||r.width/iw,ky=k||r.height/ih;var pos=c.objectPosition.split(" ").map(function(v){return parseFloat(v)/100});var ox=r.left+(r.width-iw*kx)*(isNaN(pos[0])?.5:pos[0]),oy=r.top+(r.height-ih*ky)*(isNaN(pos[1])?.5:pos[1]);return{l:ox+b[0]*kx,t:oy+b[1]*ky,w:(b[2]-b[0])*kx,h:(b[3]-b[1])*ky,r:r}}
function fit(){SETS.forEach(function(s){var im=document.querySelector(s.q);if(!im)return;if((innerWidth<1101||innerWidth*5<=innerHeight*6)){im.style.transform="";im.dataset.fit=1;return}im.style.transform="none";var c=contentRect(im,s.box);if(!c)return;var fold=innerHeight*(s.end||1),top=innerHeight*s.top,SHOW=.84,k=(fold-top)/(c.h*SHOW),bottom;k=Math.min(k,innerWidth*s.cap/c.w);top=fold-k*c.h*SHOW;var cx=c.l+c.w/2,r=c.r;var ox=r.left,oy=r.top+scrollY,ct=c.t+scrollY;/* page coords, not viewport: fit re-runs as lazy images load mid-scroll */var tx=Math.min(cx,innerWidth-k*c.w/2-24);/* narrow desktop windows: keep the whole photo on screen */var dx=tx-(ox+k*(cx-ox)),dy=top-(oy+k*(ct-oy));im.style.transformOrigin="0 0";im.style.transform="translate("+dx.toFixed(1)+"px,"+dy.toFixed(1)+"px) scale("+k.toFixed(4)+")";im.dataset.fit=1})}
var t=0;function soon(){clearTimeout(t);t=setTimeout(fit,60)}addEventListener("resize",soon);addEventListener("load",function(){setTimeout(fit,500)});new MutationObserver(function(m){for(var i=0;i<m.length;i++)if(m[i].addedNodes.length){soon();break}}).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener("load",function(e){if(e.target.tagName==="IMG")soon()},true)})();
