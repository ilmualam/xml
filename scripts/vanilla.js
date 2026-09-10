/*!
 * ilmualam.com - site scripts (vanilla JS, no jQuery)
 * Replaces jquery.min.js + the ProBlogger Templates theme script.
 * Depends on the `pbt` and `options` globals defined by inline <script> blocks
 * earlier in the page, and on Blogger's templated markup/classes.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // DOM helpers
  // ---------------------------------------------------------------------
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function scrollY() {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }

  function offsetTop(el) {
    return el.getBoundingClientRect().top + scrollY();
  }

  function animateScrollTo(targetY, duration) {
    var startY = scrollY();
    var distance = targetY - startY;
    var startTime = null;

    function easeSwing(t) {
      return 0.5 - Math.cos(t * Math.PI) / 2;
    }

    function step(timestamp) {
      if (startTime === null) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = duration <= 0 ? 1 : Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY + distance * easeSwing(progress));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Minimal slideDown/slideUp/slideToggle - jQuery's .slideToggle() has no
  // native equivalent, this animates height/margin/padding the same way.
  function slideUp(el, duration) {
    el.style.overflow = 'hidden';
    el.style.height = el.offsetHeight + 'px';
    el.getBoundingClientRect();
    el.style.transitionProperty = 'height, margin, padding';
    el.style.transitionDuration = duration + 'ms';
    requestAnimationFrame(function () {
      el.style.height = '0px';
      el.style.paddingTop = '0px';
      el.style.paddingBottom = '0px';
      el.style.marginTop = '0px';
      el.style.marginBottom = '0px';
    });
    window.setTimeout(function () {
      el.style.display = 'none';
      ['height', 'padding-top', 'padding-bottom', 'margin-top', 'margin-bottom', 'overflow', 'transition-duration', 'transition-property']
        .forEach(function (prop) { el.style.removeProperty(prop); });
    }, duration);
  }

  function slideDown(el, duration) {
    el.style.removeProperty('display');
    var display = getComputedStyle(el).display;
    if (display === 'none') display = 'block';
    el.style.display = display;
    var height = el.offsetHeight;
    el.style.overflow = 'hidden';
    el.style.height = '0px';
    el.style.paddingTop = '0px';
    el.style.paddingBottom = '0px';
    el.style.marginTop = '0px';
    el.style.marginBottom = '0px';
    el.getBoundingClientRect();
    el.style.transitionProperty = 'height, margin, padding';
    el.style.transitionDuration = duration + 'ms';
    requestAnimationFrame(function () {
      el.style.height = height + 'px';
      ['padding-top', 'padding-bottom', 'margin-top', 'margin-bottom'].forEach(function (prop) {
        el.style.removeProperty(prop);
      });
    });
    window.setTimeout(function () {
      ['height', 'overflow', 'transition-duration', 'transition-property'].forEach(function (prop) {
        el.style.removeProperty(prop);
      });
    }, duration);
  }

  function slideToggle(el, duration) {
    if (getComputedStyle(el).display === 'none') slideDown(el, duration);
    else slideUp(el, duration);
  }

  // ---------------------------------------------------------------------
  // Cookies (tiny js-cookie-compatible subset - only get/set are used)
  // ---------------------------------------------------------------------
  var Cookies = {
    get: function (name) {
      var escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1');
      var match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : undefined;
    },
    set: function (name, value, opts) {
      opts = opts || {};
      var str = name + '=' + encodeURIComponent(value);
      if (opts.expires) {
        var d = new Date();
        d.setTime(d.getTime() + opts.expires * 864e5);
        str += '; expires=' + d.toUTCString();
      }
      str += '; path=' + (opts.path || '/');
      document.cookie = str;
    }
  };

  var LOADER_HTML = '<div class="loader"><svg viewBox="0 0 50 50"><circle stroke-width="2.8" cx="25" cy="25" fill="none" r="20" stroke="currentColor" stroke-linecap="round"></circle></svg></div>';

  // ---------------------------------------------------------------------
  // Theme plugins (pbtMenu / pbtToc / pbtLazy / replaceText)
  // ---------------------------------------------------------------------

  // Builds up to 2 levels of dropdown submenus from a flat <a> list where
  // sub-items are marked with a leading "_" (Blogger List-widget convention).
  function pbtMenu(root) {
    var links = qsa('a', root);
    var count = links.length;

    function buildLevel(level) {
      var parentLi = null;
      for (var idx = 0; idx < count; idx++) {
        var link = links[idx];
        var text = link.textContent;
        var next = links[idx + 1];
        if (text.charAt(0) !== '_' && next && next.textContent.charAt(0) === '_') {
          parentLi = link.parentElement;
          parentLi.insertAdjacentHTML('beforeend', '<ul class="ul sub sm-' + level + '"></ul>');
        }
        if (text.charAt(0) === '_') {
          link.textContent = text.replace('_', '');
          var container = parentLi && parentLi.querySelector('.sm-' + level);
          if (container) container.appendChild(link.parentElement);
        }
      }
    }

    buildLevel(1);
    buildLevel(2);

    qsa('.sub', root).forEach(function (sub) {
      if (sub.parentElement && sub.parentElement.tagName === 'LI') {
        sub.parentElement.classList.add('has-sub');
      }
    });
    Array.prototype.forEach.call(root.children, function (child) {
      if (child.classList.contains('widget')) child.classList.add('is-ready');
    });
  }

  function slugifyHeading(text) {
    if (!text.length) text = '?';
    var base = text.replace(/[^a-zA-Z ]/g, '').replace(/\s+/g, '_');
    var suffix = '';
    var n = 1;
    while (document.getElementById(base + suffix)) suffix = '_' + n++;
    return base + suffix;
  }

  function pbtToc(rootEl, opts) {
    opts = Object.assign({ content: 'body', headings: 'h1,h2,h3' }, opts);
    var levels = opts.headings.split(',');
    var contentRoot = qs(opts.content) || document.body;
    var headings = qsa(opts.headings, contentRoot);

    headings.forEach(function (h) {
      if (!h.id) h.id = slugifyHeading(h.textContent);
    });

    var tagName = rootEl.tagName;
    var stack = [rootEl];
    var prevLevel = 0;

    headings.forEach(function (h) {
      var text = h.textContent.trim();
      if (!text) return;
      var level = levels.findIndex(function (sel) { return h.matches(sel); });
      if (level > prevLevel) {
        var lastLi = stack[0].querySelector(':scope > li:last-child');
        if (lastLi) {
          var newList = document.createElement(tagName);
          lastLi.appendChild(newList);
          stack.unshift(newList);
        }
      } else {
        stack.splice(0, Math.min(prevLevel - level, Math.max(stack.length - 1, 0)));
      }
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.textContent = text;
      a.setAttribute('href', '#' + h.id);
      li.appendChild(a);
      stack[0].appendChild(li);
      prevLevel = level;
    });
  }

  function pbtLazy(el, opts) {
    opts = Object.assign({ onScroll: true }, opts);
    var width = el.offsetWidth >= 1 ? el.offsetWidth : 1;
    var height = el.offsetHeight >= 1 ? el.offsetHeight : 1;
    var sizeSuffix = 'w' + Math.round(width + width / 10) + '-h' + Math.round(height + height / 10) + '-p-k-no-nu-rw';
    var src = el.dataset.src;
    if (!src) return;

    if (src.indexOf('resources.blogblog.com') > -1) {
      src = typeof noThumbnail !== 'undefined' ? noThumbnail : pbt.noThumb;
    }
    if (src.indexOf('/img/a') > -1 || src.indexOf('/blogger_img_proxy') > -1) {
      var base = src.indexOf('=') > -1 ? src.split('=')[0] : src;
      src = base + '=w72-h72-p-k-no-nu';
    }
    if (src.indexOf('/blogger_img_proxy') > -1 && src.indexOf('testonly') > -1) {
      src = src.replace('-testonly.', '.');
    }
    var finalSrc = src.indexOf('w72-h72-p-k-no-nu') > -1
      ? (src.indexOf('=') > -1 ? src.replace('=w72-h72-p-k-no-nu', '=' + sizeSuffix) : src.replace('/w72-h72-p-k-no-nu', '/' + sizeSuffix))
      : src;

    function load() {
      var img = new Image();
      img.onload = function () {
        el.style.backgroundImage = "url('" + this.src + "')";
        el.classList.add('pbt-lazy');
      };
      img.onerror = function () {
        if (finalSrc !== pbt.noThumb) {
          finalSrc = pbt.noThumb;
          img.src = finalSrc;
        } else {
          el.classList.add('pbt-lazy');
        }
      };
      img.src = finalSrc;
    }

    if (opts.onScroll) {
      var handler = function () {
        if (scrollY() + window.innerHeight >= offsetTop(el)) {
          window.removeEventListener('scroll', handler);
          window.removeEventListener('resize', handler);
          window.removeEventListener('load', handler);
          load();
        }
      };
      window.addEventListener('load', handler);
      window.addEventListener('resize', handler);
      window.addEventListener('scroll', handler);
      handler();
    } else {
      load();
    }
  }

  // Regex/string search-and-replace across an element's direct text nodes,
  // mirroring the old jQuery replaceText plugin (used for post shortcodes).
  function replaceText(el, pattern, replacement, htmlSafe) {
    var node = el.firstChild;
    var toRemove = [];
    while (node) {
      if (node.nodeType === 3) {
        var oldVal = node.nodeValue;
        var newVal = oldVal.replace(pattern, replacement);
        if (newVal !== oldVal) {
          if (!htmlSafe && /</.test(newVal)) {
            var wrapper = document.createElement('span');
            wrapper.innerHTML = newVal;
            while (wrapper.firstChild) node.parentNode.insertBefore(wrapper.firstChild, node);
            toRemove.push(node);
          } else {
            node.nodeValue = newVal;
          }
        }
      }
      node = node.nextSibling;
    }
    toRemove.forEach(function (n) { n.remove(); });
  }

  // ---------------------------------------------------------------------
  // Shortcode / misc helpers
  // ---------------------------------------------------------------------

  // Parses "{shortcode key=value$key2={val with spaces}}"-style attributes.
  function getAttr(str, key) {
    var parts = str.split('$');
    var pattern = /([^{}]+(?=}))/g;
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split('=');
      if (kv[0].trim() === key) {
        var val = kv[1];
        if (val && val.match(pattern) != null) return String(val.match(pattern)).trim();
        break;
      }
    }
    return false;
  }

  function darkModeLogo(isDark) {
    qsa('[data-dark-src]').forEach(function (img) {
      img.setAttribute('src', isDark === 'true' ? img.dataset.darkSrc : img.dataset.src);
    });
  }

  function openSearch() {
    localStorage.search_term = '';
    document.body.classList.remove('share-on');
    document.body.classList.add('search-on');
    setTimeout(function () {
      var input = qs('.main-search input');
      if (input) input.focus();
    }, 250);
  }

  function cleanSearch() {
    setTimeout(function () {
      var input = qs('.main-search input');
      if (input) { input.blur(); input.value = ''; }
      var results = qs('.search-results');
      if (results) {
        results.innerHTML = '';
        results.classList.remove('scroll');
        if (results.parentElement) results.parentElement.classList.remove('visible');
      }
    }, 250);
  }

  function closeSearch() {
    qsa('.main-search .close, .search-on .overlay-bg').forEach(function (el) {
      el.addEventListener('click', function () {
        document.body.classList.remove('search-on');
        cleanSearch();
      });
    });
    window.addEventListener('keydown', function (e) {
      if (e.keyCode === 27) {
        document.body.classList.remove('search-on');
        cleanSearch();
      }
    });
  }

  function pAd(sourceSelector, targetEl) {
    var source = qs(sourceSelector);
    if (!source) return;
    qsa('noscript', source).forEach(function (ns) {
      targetEl.innerHTML = '<div class="widget">' + ns.textContent + '</div>';
    });
  }

  function openShare() {
    cleanSearch();
    document.body.classList.remove('search-on');
    document.body.classList.add('share-on');
  }

  function navShortcuts(selector) {
    qsa(selector).forEach(function (el) {
      var href = el.getAttribute('href');
      if (href) window.open(href, '_self');
    });
  }

  function msgError(type) {
    return '<span class="error-msg">' + (type !== 'search' ? '<b>Error:</b>&nbsp;' : '') + pbt.noResults + '</span>';
  }

  function getFeedUrl(num, label) {
    return label === 'recent'
      ? '/search/?by-date=true&max-results=' + num + '&view=json'
      : '/search/label/' + encodeURIComponent(label) + '?by-date=true&max-results=' + num + '&view=json';
  }

  function getPostTitle(ctx, opts) {
    var targetAttr = ctx.target ? ' target="' + ctx.target + '"' : '';
    var inner = opts.link !== 'false'
      ? '<a href="' + ctx.post.link + '"' + targetAttr + '>' + ctx.post.title + '</a>'
      : ctx.post.title;
    return '<h2 class="entry-title">' + inner + '</h2>';
  }

  function getPostMeta(ctx, opts) {
    var labelHtml = ctx.post.author.label ? '<span class="label">' + ctx.post.author.label + '</span>' : '';
    var avatarHtml = '<div class="entry-avatar"><div class="avatar" data-src="' + ctx.post.author.avatar + '"></div></div>';
    var authorHtml = pbt.postAuthor && opts.author !== 'false'
      ? '<div class="entry-author">' + labelHtml + avatarHtml + '<span class="author-name">' + ctx.post.author.name + '</span></div>' : '';
    var dateHtml = pbt.postDate === true && opts.date !== 'false'
      ? '<div class="entry-time"><time class="published" datetime="' + ctx.post.published.datetime + '">' + ctx.post.published.date + '</time></div>' : '';
    return (authorHtml || dateHtml) ? '<div class="entry-meta">' + authorHtml + dateHtml + '</div>' : '';
  }

  function getPostImage(ctx, opts) {
    var showIcon = opts.icon !== 'false' && ctx.post.thumbnail.source === 'youtube';
    var iconHtml = showIcon ? '<span class="yt-img' + (opts.size ? ':x' + opts.size : '') + '"></span>' : '';
    var categoryHtml = opts.category === 'true' ? getPostTag(ctx) : '';
    var thumbHtml = '<div class="thumbnail" data-src="' + ctx.post.thumbnail.src + '"></div>';
    var targetAttr = ctx.target ? ' target="' + ctx.target + '"' : '';
    return opts.link !== 'false'
      ? '<a class="entry-thumbnail" href="' + ctx.post.link + '"' + targetAttr + '>' + categoryHtml + thumbHtml + iconHtml + '</a>'
      : '<div class="entry-thumbnail">' + categoryHtml + thumbHtml + iconHtml + '</div>';
  }

  function getPostTag(ctx) {
    return ctx.post.category ? '<span class="entry-tag">' + ctx.post.category + '</span>' : '';
  }

  function getPostSummary(ctx) {
    return pbt.postSummary && ctx.post.summary ? '<span class="entry-excerpt excerpt">' + ctx.post.summary + '</span>' : '';
  }

  function getPostContent(ctx) {
    var type = ctx.type, index = ctx.index, post = ctx.post, num = ctx.num,
      headline = ctx.headline, target = ctx.target, link = post.link;
    var img = function (o) { return getPostImage({ type: type, post: post, target: target }, o || {}); };
    var tag = function (o) { return getPostTag({ post: post }, o || {}); };
    var title = function (o) { return getPostTitle({ post: post, target: target }, o || {}); };
    var summary = function (o) { return getPostSummary({ post: post }, o || {}); };
    var meta = function (o) { return getPostMeta({ post: post }, o || {}); };
    var html = '';

    switch (type) {
      case 'mega':
      case 'megatabs':
        html = '<div class="post fadeInDown" style="animation-delay:' + (0.1 * index).toFixed(1) + 's;">' + img({ size: '2' }) + '<div class="entry-header">' + title() + meta({ author: 'false' }) + '</div></div>';
        break;
      case 'search':
        html = index !== num ? '<div class="post fadeInDown" style="animation-delay:' + (0.1 * index).toFixed(1) + 's;">' + img({ size: '4' }) + '<div class="entry-header">' + title() + meta({ author: 'false' }) + '</div></div>' : '';
        break;
      case 'featured':
        html = index === 0
          ? '<div class="row-0 post first"><a class="entry-inner flex-c" href="' + link + '"><div class="container">' + img({ icon: 'false', link: 'false', category: 'true' }) + '<div class="entry-header">' + title({ link: 'false' }) + meta() + '</div></div></a></div>'
          : (index === 1 ? '<div class="row-1 flex-c"><div class="container"><div class="grid">' : '') + '<div class="post">' + img({ size: '4', category: 'true' }) + '<div class="entry-header">' + title() + meta({ author: 'false' }) + '</div></div>';
        break;
      case 'card':
        html = img({ size: '2' }) + '<div class="entry-header">' + headline + title() + meta() + '</div>';
        break;
      case 'related':
        html = index !== num - 1 ? '<div class="post">' + img({ size: '2', category: 'true' }) + '<div class="entry-header">' + title() + meta({ author: 'false' }) + '</div></div>' : '';
        break;
      case 'side':
        html = '<div class="post">' + img({ size: '3' }) + '<div class="entry-header">' + title() + meta({ author: 'false' }) + '</div></div>';
        break;
    }
    return html;
  }

  // Synchronous fallback fetch (mirrors the old async:false jQuery call) -
  // callers rely on the fallback post list being available immediately.
  function getRecentPostsData(num) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', getFeedUrl(num, 'recent'), false);
    xhr.send(null);
    var doc = new DOMParser().parseFromString(xhr.responseText, 'text/html');
    var dataEl = doc.getElementById('data');
    var parsed = JSON.parse(dataEl ? dataEl.textContent : '{}');
    return parsed.posts;
  }

  function getPosts(opts) {
    var target = opts.t;
    var type = opts.type;
    var num = opts.num;
    var label = opts.label || 'recent';
    var id = opts.id;
    var link = opts.link;
    var headline = opts.headline;
    var pageTarget = opts.target;
    var url = (type !== 'card' && type !== 'search') ? getFeedUrl(num, label) : link;

    switch (type) {
      case 'mega':
      case 'megatabs':
      case 'card':
      case 'related':
        target.innerHTML = LOADER_HTML;
        break;
      case 'search':
        target.classList.remove('scroll');
        target.parentElement.parentElement.classList.add('loading');
        break;
      default:
        target.innerHTML = LOADER_HTML;
        target.parentElement.classList.add('type-' + type);
    }

    fetch(url, { credentials: 'same-origin' })
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var out = '';
        var count = 0;
        var isError = false;

        switch (type) {
          case 'mega':
          case 'megatabs':
            out = '<div class="mega-items">';
            break;
          case 'featured':
            out = '<div class="featured-items cs">';
            break;
          case 'card':
            out = '<div class="post">';
            break;
          default:
            out = '<div class="' + type + '-items">';
        }

        var doc = new DOMParser().parseFromString(html, 'text/html');
        var dataEl = doc.getElementById('data');
        if (dataEl) {
          var parsed = JSON.parse(dataEl.textContent);
          var posts = type !== 'card' ? parsed.posts : parsed.postData;
          if (posts) {
            if (type === 'related') {
              if (posts.length === 1 && label !== 'recent') posts = getRecentPostsData(num);
              var total = posts.length;
              for (var m = 0; m < total; m++) {
                if (posts.length !== 1 && parsed.posts[m].id === id) { posts.splice(m, 1); break; }
              }
            }
            for (var v = 0; v < posts.length; v++) {
              out += getPostContent({ type: type, index: v, post: posts[v], num: num, headline: headline, target: pageTarget });
            }
            count = posts.length;
          } else isError = true;
        } else isError = true;

        out += '</div>';
        out = isError ? msgError(type) : out;

        switch (type) {
          case 'search': {
            target.innerHTML = out;
            target.parentElement.classList.add('visible');
            target.parentElement.parentElement.classList.remove('loading');
            var viewAll = target.parentElement.querySelector('.view-all');
            if (num < count) {
              var searchUrl = '/search?q=' + encodeURIComponent(label) + '&by-date=true';
              if (viewAll) {
                viewAll.querySelector('a').setAttribute('href', searchUrl);
              } else {
                target.parentElement.insertAdjacentHTML('beforeend', '<div class="view-all"><a class="btn" href="' + searchUrl + '">' + pbt.viewAll + '</a></div>');
              }
            } else if (viewAll) viewAll.remove();
            setTimeout(function () { target.classList.add('scroll'); }, 500);
            break;
          }
          case 'featured':
            out = isError ? out : out + '</div></div></div>';
            target.innerHTML = out;
            break;
          default:
            target.innerHTML = out;
        }

        var thumbs = qsa('.thumbnail', target);
        switch (type) {
          case 'mega':
          case 'megatabs':
          case 'search':
            thumbs.forEach(function (t) { pbtLazy(t, { onScroll: false }); });
            break;
          default:
            thumbs.forEach(function (t) { pbtLazy(t); });
        }
      })
      .catch(function () {
        target.innerHTML = msgError(type);
      });
  }

  function megaTabs(navItemEl, labels) {
    var nav = '', tabsHtml = '';
    var count = Math.min(labels.length, 5);
    for (var r = 0; r < count; r++) {
      if (!labels[r]) continue;
      var activeAttr = r === 0 ? ' class="active"' : '';
      nav += '<a href="/search/label/' + labels[r] + '"' + activeAttr + '>' + labels[r] + '</a>';
      tabsHtml += '<div data-tab="' + labels[r] + '"' + activeAttr + '></div>';
    }
    var markup = '<div class="mega-tabs"><div class="nav">' + nav + '</div><div class="tabs">' + tabsHtml + '</div></div>';

    navItemEl.classList.add('type-tabs');
    var directLink = navItemEl.querySelector(':scope > a');
    if (directLink) {
      directLink.removeAttribute('data-shortcode');
      directLink.addEventListener('click', function (ev) { ev.preventDefault(); });
    }
    var container = navItemEl.parentElement.querySelector('.container');
    if (container) container.innerHTML = markup;

    var navLinks = qsa('.nav a', navItemEl);
    var tabPanels = qsa('[data-tab]', navItemEl);

    navItemEl.addEventListener('mouseenter', function () {
      var active = tabPanels.find(function (p) { return p.classList.contains('active'); });
      if (active && !active.classList.contains('loaded')) {
        active.classList.add('loaded');
        getPosts({ t: active, type: 'megatabs', num: 5, label: active.dataset.tab });
      }
    });

    navLinks.forEach(function (link, idx) {
      link.addEventListener('mouseenter', function () {
        var panel = tabPanels[idx];
        navLinks.forEach(function (l) { l.removeAttribute('class'); });
        link.classList.add('active');
        tabPanels.forEach(function (p) { p.classList.remove('active'); });
        panel.classList.add('active');
        if (!panel.classList.contains('loaded')) {
          panel.classList.add('loaded');
          getPosts({ t: panel, type: 'megatabs', num: 5, label: panel.dataset.tab });
        }
      });
    });
  }

  function getSearch(inputEl, resultsEl) {
    var value = inputEl.value.trim();
    if (value !== '' && value !== localStorage.search_term) {
      localStorage.search_term = value;
      getPosts({ t: resultsEl, type: 'search', num: 15, label: value, link: '/search/?q=' + encodeURIComponent(value) + '&max-results=16&view=json' });
    }
  }

  function getPostCard() {
    qsa('.post-card').forEach(function (el) {
      var url = el.dataset.url;
      var title = el.dataset.title;
      var target = el.dataset.target;
      var headline = title ? '<span class="entry-headline">' + title + '</span>' : '';
      if (url) {
        var handler = function () {
          if (scrollY() + window.innerHeight >= offsetTop(el)) {
            window.removeEventListener('load', handler);
            window.removeEventListener('resize', handler);
            window.removeEventListener('scroll', handler);
            getPosts({ t: el, type: 'card', link: url, headline: headline, target: target });
          }
        };
        window.addEventListener('load', handler);
        window.addEventListener('resize', handler);
        window.addEventListener('scroll', handler);
        handler();
        el.removeAttribute('data-url');
        el.removeAttribute('data-title');
        el.removeAttribute('data-target');
      } else {
        el.innerHTML = msgError();
      }
    });
  }

  function disqusComments(shortname) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://' + shortname + '.disqus.com/blogger_item.js';
    head.appendChild(script);
  }

  function beautiAvatar(selector) {
    var placeholder = '//blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiCxxt0n6b048h4UEHf-L5T22U8xCk-IsG2qbfVUMBMKdt2t3ijO6qz--5UBg63qH4V_6z8uIBe7z6VNnueFbF3XKIWkCJPmFQqfm3Rmx3tpBOk74LGDZrUEgGnJF2-VDrzlkZSVyJs2sYjtiCytrEjsw23o88dqy5mdjw0KPwNuySVA7iYfdHWYpgsuQ/s35/avatar.webp';
    qsa(selector).forEach(function (img) {
      var src = img.getAttribute('src') || '';
      src = src
        .replace('//resources.blogblog.com/img/blank.gif', placeholder)
        .replace('//lh3.googleusercontent.com/zFdxGE77vvD2w5xHy6jkVuElKv-U9_9qLkRYK8OnbDeJPtjSZ82UPq5w6hJ-SA=s35', placeholder)
        .replace('/s35', '/s44-rw')
        .replace('=s35', '=s44-rw');
      img.setAttribute('src', src);
      img.setAttribute('alt', 'User Avatar');
    });
  }

  // ---------------------------------------------------------------------
  // Init - runs immediately (script tag sits at the end of <body>)
  // ---------------------------------------------------------------------

  var mainMenu = qs('#main-menu');
  if (mainMenu) pbtMenu(mainMenu);

  qsa('.dark-logo').forEach(function () {
    if (pbt.isDark === true) darkModeLogo('true');
  });

  qsa('html').forEach(function (htmlEl) {
    var darkMode = localStorage.dark_mode;
    if (pbt.isDark !== true && pbt.userDarkMode !== false) {
      if (darkMode === 'true') {
        htmlEl.classList.add('is-dark');
        darkModeLogo(darkMode);
      }
      qsa('.darkmode-toggle').forEach(function (toggle) {
        toggle.addEventListener('click', function () {
          if (toggle.classList.contains('dark-on')) {
            toggle.classList.remove('dark-on');
            toggle.classList.add('dark-off');
          } else {
            toggle.classList.remove('dark-off');
            toggle.classList.add('dark-on');
          }
          htmlEl.classList.toggle('is-dark');
          darkMode = darkMode !== 'true' ? 'true' : 'false';
          localStorage.dark_mode = darkMode;
          darkModeLogo(darkMode);
        });
      });
    }
  });

  qsa('.search-toggle').forEach(function (el) {
    el.addEventListener('click', function () {
      openSearch();
      closeSearch();
    });
  });
  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.keyCode === 75) {
      e.preventDefault();
      openSearch();
      closeSearch();
    }
  });

  qsa('.sidebar .social a').forEach(function (a) {
    var href = a.getAttribute('href');
    var parts = href.split('#');
    var showText = a.dataset.text === 'true';
    if (parts[1] && showText) {
      var label = parts[1].trim();
      if (label !== '') a.insertAdjacentHTML('beforeend', '<span class="text">' + label + '</span>');
    }
    a.setAttribute('href', parts[0].trim());
  });

  qsa('.MailChimp').forEach(function (el) {
    if (typeof options !== 'undefined' && options.subscribeFormUrl) {
      var form = el.querySelector('.mailchimp-form');
      if (options.subscribeMessage) {
        var textEl = el.querySelector('.mailchimp-text');
        if (textEl) textEl.innerHTML = options.subscribeMessage;
      }
      if (form) {
        form.setAttribute('action', options.subscribeFormUrl);
        form.setAttribute('onsubmit', "window.open('" + options.subscribeFormUrl + "', 'popupwindow', 'scrollbars=yes,width=550,height=520'); return true");
        var submitBtn = form.querySelector('.mailchimp-submit');
        if (submitBtn) submitBtn.removeAttribute('disabled');
      }
    }
  });

  qsa('.post-body a').forEach(function (a) {
    var text = a.textContent;
    var buttonText = getAttr(text, 'text');

    if (text.indexOf('getButton') > -1 && buttonText) {
      replaceText(a, /([^{}]+(?=}))/g, '<em>$1</em>');
      qsa('em', a).forEach(function (em) { replaceText(em, '$', '%s'); });

      var t2 = a.textContent;
      var btnText = getAttr(t2, 'text');
      var icon = getAttr(t2, 'icon');
      var color = getAttr(t2, 'color');
      var size = getAttr(t2, 'size');
      var info = getAttr(t2, 'info');
      var idAttr = getAttr(t2, 'id');
      var parentStyle = a.parentElement.getAttribute('style');

      a.classList.add.apply(a.classList, (size ? 'button btn x2' : 'button btn').split(' '));
      a.textContent = btnText.replace('%s', '$');
      if (idAttr) a.setAttribute('href', a.getAttribute('href') + '#gd=' + btoa(idAttr));
      if (icon !== false) a.classList.add(icon);
      if (color) { a.classList.add('color'); a.setAttribute('style', 'background:' + color + ';'); }
      if (parentStyle && parentStyle.indexOf('center') > -1) a.classList.add('is-c');
      if (info) {
        a.classList.add.apply(a.classList, (icon ? 'x2 ' + icon : 'x2').split(' '));
        a.insertAdjacentHTML('beforeend', '<span class="btn-info">' + info.replace('%s', '$') + '</span>');
      }
    }

    if (text.indexOf('getCard') > -1) {
      var cardType = getAttr(text, 'type');
      var cardTitle = getAttr(text, 'title');
      var href = a.getAttribute('href');
      var target = a.getAttribute('target');
      switch (cardType) {
        case 'download':
        case 'product':
        case 'custom': {
          replaceText(a, /([^{}]+(?=}))/g, '<em>$1</em>');
          qsa('em', a).forEach(function (em) { replaceText(em, '$', '%s'); });
          var ct2 = a.textContent;
          var btnLabel = getAttr(ct2, 'button');
          var cardIcon = getAttr(ct2, 'icon');
          var cardTitle2 = getAttr(ct2, 'title');
          var cardInfo = getAttr(ct2, 'info');
          var cardId = getAttr(ct2, 'id');
          var infoHtml = cardInfo ? '<span class="card-meta">' + cardInfo.replace('%s', '$') + '</span>' : '';
          var iconGlyph = cardIcon || (cardType === 'download' ? '&#xF295;' : cardType === 'product' ? '&#xF242;' : '&#xF4B1;');
          var hrefOut = href ? (cardType === 'download' && cardId ? href + '#gd=' + btoa(cardId) : href) : '#';
          a.outerHTML = '<div class="cta-card ' + cardType + '"><div class="card-header"><div class="card-icon"><i class="bi" data-icon="' + iconGlyph + '"></i></div><div class="card-info"><span class="card-title">' + (cardTitle2 || pbt.noTitle) + '</span>' + infoHtml + '</div></div><a class="card-btn btn" href="' + hrefOut + '" target="' + (target || '_self') + '">' + (btnLabel || '<i class="bi bi-box-arrow-up-right"></i>') + '</a></div>';
          break;
        }
        default:
          a.outerHTML = '<div class="post-card" data-url="' + href + '" data-title="' + cardTitle + '" data-target="' + (target || '_self') + '"></div>';
      }
    }
  });

  qsa('.post-body blockquote').forEach(function (el) {
    var shortcodes = [
      { shc: '{alertSuccess}', cls: 'success' },
      { shc: '{alertInfo}', cls: 'info' },
      { shc: '{alertWarning}', cls: 'warning' },
      { shc: '{alertError}', cls: 'error' },
      { shc: '{codeBox}', cls: 'code' }
    ];
    var text = el.textContent;
    var html = el.innerHTML;
    shortcodes.forEach(function (item) {
      if (text.trim().indexOf(item.shc) > -1) {
        html = html.replace(item.shc, '');
        el.outerHTML = item.cls !== 'code'
          ? '<div class="alert-message alert-' + item.cls + '">' + html + '</div>'
          : '<pre class="code-box">' + html + '</pre>';
      }
    });
  });

  qsa('.post-body b').forEach(function (el) {
    var text = el.textContent;
    function has(pattern) { return text.trim().match(pattern); }

    if (has('{inAds}') || has('{ads}') || has(/\$ads=\{1\}/g) || has(/\$ads=\{2\}/g)) {
      el.outerHTML = '<div class="article-ads"></div>';
    }
    if (has('{showAds}')) el.outerHTML = '';
    if (has('{nextPage}')) el.outerHTML = '<!-- nextpage -->';

    if (has('{getToc}')) {
      var tocTitle = getAttr(text, 'title') || 'Table of Contents';
      var tocCount = getAttr(text, 'count');
      var tocExpanded = getAttr(text, 'expanded');
      el.outerHTML = '<div class="pbt-toc-wrap"><div class="pbt-toc-inner"><button class="pbt-toc-title" aria-label="' + tocTitle + '"><span class="pbt-toc-title-text">' + tocTitle + '</span></button><ol id="pbt-toc" data-count="' + (tocCount || 'true') + '"></ol></div></div>';
      var tocList = qs('#pbt-toc');
      var tocTitleBtn = qs('.pbt-toc-title');
      if (tocExpanded === 'true') {
        if (tocTitleBtn) tocTitleBtn.classList.toggle('is-expanded');
        if (tocList) tocList.style.display = '';
      }
      if (tocTitleBtn) {
        tocTitleBtn.addEventListener('click', function () {
          tocTitleBtn.classList.toggle('is-expanded');
          if (tocList) slideToggle(tocList, 170);
        });
      }
      if (tocList) {
        pbtToc(tocList, { content: '#post-body', headings: 'h2,h3,h4' });
        qsa('a', tocList).forEach(function (link) {
          link.addEventListener('click', function (ev) {
            ev.preventDefault();
            var dest = qs(link.getAttribute('href'));
            if (dest) animateScrollTo(offsetTop(dest) - 20, 500);
          });
        });
      }
    }

    function applyLayoutShortcode(shc, cls) {
      if (has(shc)) {
        var bodyClass = document.body.getAttribute('class') || '';
        if (!/is-left|is-right|no-sidebar/.test(bodyClass)) {
          document.body.classList.add(cls);
          if (cls === 'is-right') document.body.classList.remove('is-left');
        }
        el.remove();
      }
    }

    if (has('{contactForm}')) {
      el.outerHTML = '<div class="contact-form-widget"></div>';
      var contactWidget = qs('.post-body .contact-form-widget');
      var contactForm = qs('#ContactForm1 form');
      if (contactWidget && contactForm) contactWidget.appendChild(contactForm);
    }

    [
      { shc: '{leftSidebar}', cls: 'is-left' },
      { shc: '{rightSidebar}', cls: 'is-right' },
      { shc: '{noSidebar}', cls: 'no-sidebar' },
      { shc: '{fullWidth}', cls: 'no-sidebar' }
    ].forEach(function (item) { applyLayoutShortcode(item.shc, item.cls); });

    if (has('{getLink}')) {
      var glSeconds = getAttr(text, 'seconds');
      var glBefore = getAttr(text, 'before');
      var glAfter = getAttr(text, 'after');
      var glMessage = getAttr(text, 'message');
      var glSize = getAttr(text, 'size');
      el.outerHTML = '<div class="flex-c"><div class="gd-link"><div class="gd-countdown"><span class="gd-seconds">' + (glSeconds || '15') + '</span><span class="gd-message">' + (glMessage || 'Please wait...') + '</span></div><button class="get-link button btn link' + (glSize ? ' x2' : '') + '" disabled>' + (glBefore || 'Generate Link') + '</button><button class="goto-link button btn link' + (glSize ? ' x2' : '') + '">' + (glAfter || 'Go to Link') + '</button></div></div>';

      qsa('.gd-link').forEach(function (linkEl) {
        var getBtn = linkEl.querySelector('.get-link');
        var gotoBtn = linkEl.querySelector('.goto-link');
        var secondsEl = linkEl.querySelector('.gd-seconds');
        var href = window.location.href;
        var sep = href.indexOf('?') > -1 ? '&' : '?';
        var url = new URL(href.replace('#', sep));
        var params = new URLSearchParams(url.search);
        var gdParam = params.get('gd');
        var goParam = params.get('go');
        var countdown = glSeconds ? Number(glSeconds) - 1 : 14;

        localStorage.gd_key = gdParam || 0;
        localStorage.go_key = goParam || 0;

        if (gdParam || goParam) {
          getBtn.removeAttribute('disabled');
          getBtn.addEventListener('click', function () {
            if (!getBtn.hasAttribute('disabled')) {
              linkEl.classList.add('loading');
              var timer = setInterval(function () {
                if (countdown === 0) {
                  clearInterval(timer);
                  linkEl.classList.add('loaded');
                  linkEl.classList.remove('loading');
                  qsa('.gd-btn').forEach(function (b) { b.removeAttribute('disabled'); });
                } else {
                  secondsEl.textContent = countdown;
                  countdown--;
                }
              }, 1000);
            }
          });
        }
        gotoBtn.addEventListener('click', function () {
          var btn = qs('.gd-btn');
          if (btn) animateScrollTo(offsetTop(btn) - window.innerHeight / 2 + btn.offsetHeight / 2, 500);
        });
      });
    }

    if (has('{getDownload}')) {
      var gdButton = getAttr(text, 'button');
      var gdSize = getAttr(text, 'size');
      el.outerHTML = '<div class="flex-c"><button class="gd-btn button btn download has-loader' + (gdSize ? ' x2' : '') + '" disabled>' + LOADER_HTML + (gdButton || 'Download') + '</button></div>';
      qsa('.gd-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!btn.hasAttribute('disabled')) {
            var gdKey = localStorage.gd_key;
            var goKey = localStorage.go_key;
            var dl = gdKey && gdKey !== '0' ? 'https://drive.google.com/uc?id=' + atob(gdKey) + '&export=download' : (goKey && goKey !== '0' ? atob(goKey) : null);
            if (dl) {
              btn.classList.add('loading');
              setTimeout(function () {
                window.open(dl, '_self');
                btn.classList.remove('loading');
              }, 2000);
            }
          }
        });
      });
    }

    if (has('{getContinue}')) {
      var gcButton = getAttr(text, 'button');
      var gcSize = getAttr(text, 'size');
      el.outerHTML = '<div class="flex-c"><button class="go-btn button btn continue has-loader' + (gcSize === '1' ? ' x1' : ' x2') + '" disabled>' + LOADER_HTML + (gcButton || 'Continue') + '</button></div>';
      qsa('.go-btn').forEach(function (btn) {
        var href = window.location.href;
        var sep = href.indexOf('?') > -1 ? '&' : '?';
        var url = new URL(href.replace('#', sep));
        var params = new URLSearchParams(url.search);
        var goParam = params.get('go');
        var dest = goParam ? atob(goParam) : false;
        if (dest) {
          btn.removeAttribute('disabled');
          btn.addEventListener('click', function () {
            if (!btn.hasAttribute('disabled')) {
              btn.classList.add('loading');
              setTimeout(function () {
                window.open(dest, '_self');
                btn.classList.remove('loading');
              }, 2000);
            }
          });
        }
      });
    }
  });

  qsa('.before-ads').forEach(function (el) { if (qs('#post-ads-1')) pAd('#post-ads-1', el); });
  qsa('.after-ads').forEach(function (el) { if (qs('#post-ads-2')) pAd('#post-ads-2', el); });
  qsa('.article-ads').forEach(function (el) { if (qs('#post-ads-3')) pAd('#post-ads-3', el); });
  qsa('.post-footer-ads').forEach(function (el) { if (qs('#post-ads-4')) pAd('#post-ads-4', el); });

  qsa('.blog-post article').forEach(function (articleEl) {
    var postBody = articleEl.querySelector('.post-body');
    var pagination = articleEl.querySelector('.pagination');
    if (!postBody) return;
    var pages = postBody.innerHTML.split(/<!--\s*nextpage\s*-->/i);
    var pageCount = pages.length;
    var current = 0;

    if (pageCount > 1) {
      var renderPageInfo = function (idx) {
        var pageOf = (typeof options !== 'undefined' && options.pageOf) || 'Page {page} of {pages}';
        var prevLabel = (typeof options !== 'undefined' && options.prevPage) || 'Previous';
        var nextLabel = (typeof options !== 'undefined' && options.nextPage) || 'Next';
        var pageNum = idx + 1;
        var prevLink = pageNum > 1 ? '<a href="#page=' + idx + '" class="prev btn">' + prevLabel + '</a>' : '';
        var nextLink = pageNum < pageCount ? '<a href="#page=' + (idx + 2) + '" class="next btn">' + nextLabel + '</a>' : '';
        var infoText = pageOf.replace('{page}', pageNum > pageCount ? pageCount : pageNum).replace('{pages}', pageCount);
        if (pagination) {
          pagination.innerHTML = prevLink + '<span class="info">' + infoText + '</span>' + nextLink;
          pagination.classList.add('visible');
        }
      };
      var renderPage = function () {
        var href = window.location.href;
        var sep = href.indexOf('?') > -1 ? '&' : '?';
        var url = new URL(href.replace('#', sep));
        var params = new URLSearchParams(url.search);
        var pageParam = params.get('page');
        var n = Number(!pageParam || pageParam < 0 ? 1 : pageParam || 1) - 1;
        current = n >= pageCount ? pageCount - 1 : n;
        postBody.innerHTML = pages[current];
        renderPageInfo(current);
        if (pagination) {
          qsa('.btn', pagination).forEach(function (btn) {
            btn.addEventListener('click', function () { animateScrollTo(0, 500); });
          });
        }
        getPostCard();
      };
      window.addEventListener('hashchange', renderPage);
      renderPage();
    }
  });

  qsa('.window-open').forEach(function (el) {
    el.addEventListener('click', function (ev) {
      ev.preventDefault();
      var href = el.getAttribute('href');
      var win = window.open(href, '_blank', 'scrollbars=yes,resizable=yes,toolbar=0,width=860,height=540,top=50,left=50');
      if (win) win.focus();
    });
  });

  window.addEventListener('keydown', function (e) {
    if (pbt.isPost && e.ctrlKey && e.keyCode === 83) {
      e.preventDefault();
      openShare();
    }
  });
  qsa('.post-share .show-more button, .share-toggle').forEach(function (el) {
    el.addEventListener('click', function () { openShare(); });
  });

  qsa('.copy-link').forEach(function (el) {
    var input = el.querySelector('input');
    var button = el.querySelector('button');
    if (input) input.addEventListener('click', function () { input.select(); });
    if (button) {
      button.addEventListener('click', function () {
        if (input) navigator.clipboard.writeText(input.value);
        el.classList.remove('copied-off');
        el.classList.add('copied');
        setTimeout(function () {
          el.classList.remove('copied');
          el.classList.add('copied-off');
        }, 3000);
      });
    }
  });

  qsa('.about-author .author-text').forEach(function (el) {
    var links = qsa('a', el);
    if (links.length) {
      links.forEach(function (a) {
        var label = a.textContent.trim();
        var href = a.getAttribute('href');
        var type = label === 'external-link' ? 'website' : label;
        a.outerHTML = '<li class="' + type + '"><a class="bi-' + type + '" href="' + href + '" title="' + type + '" rel="nofollow noopener" target="_blank"></a></li>';
      });
      var parent = el.parentElement;
      parent.insertAdjacentHTML('beforeend', '<ul class="author-links social color"></ul>');
      var socialList = parent.querySelector('.author-links');
      qsa('li', el).forEach(function (li) { socialList.appendChild(li); });
    }
  });

  window.addEventListener('keydown', function (e) {
    if (!pbt.isPost) return;
    if (e.ctrlKey && e.keyCode === 37) {
      e.preventDefault();
      navShortcuts(pbt.isRTL ? '.post-nav-older-link' : '.post-nav-newer-link');
    } else if (e.ctrlKey && e.keyCode === 39) {
      e.preventDefault();
      navShortcuts(pbt.isRTL ? '.post-nav-newer-link' : '.post-nav-older-link');
    }
  });

  qsa('.main-nav .has-mega').forEach(function (navEl) {
    var link = navEl.querySelector('a');
    var shortcode = link ? link.dataset.shortcode : undefined;
    var label = getAttr(shortcode, 'label') || 'recent';
    var parts = label.split('/');
    var mode = (label.indexOf('/') > -1 && parts[0]) ? 'tabs' : (label.indexOf('/') === -1 ? 'mega' : false);

    if (mode === 'mega') {
      var href = label === 'recent' ? '/search' : '/search/label/' + label;
      navEl.classList.add('type-mega');
      navEl.addEventListener('mouseenter', function () {
        if (!navEl.classList.contains('loaded')) {
          navEl.classList.add('loaded');
          var container = navEl.querySelector('.container');
          getPosts({ t: container, type: 'mega', num: 5, label: label });
        }
      });
      if (link) {
        link.setAttribute('href', href);
        link.removeAttribute('data-shortcode');
      }
    } else if (mode === 'tabs') {
      megaTabs(navEl, parts);
    } else {
      navEl.classList.add('loaded');
      var container2 = navEl.querySelector('.container');
      if (container2) container2.innerHTML = msgError();
    }
  });

  qsa('.main-search').forEach(function (el) {
    var input = el.querySelector('input');
    var results = el.querySelector('.search-results');
    var timer;
    if (input) {
      input.addEventListener('input', function (ev) {
        ev.preventDefault();
        clearTimeout(timer);
        timer = setTimeout(function () { getSearch(input, results); }, 500);
      });
    }
  });

  qsa('.featured .getPosts').forEach(function (el) {
    var target = el.querySelector('.widget-content');
    if (!target) return;
    var shortcode = target.dataset.shortcode;
    if (shortcode) {
      var label = getAttr(shortcode, 'label');
      var handler = function () {
        if (scrollY() + window.innerHeight >= offsetTop(target)) {
          window.removeEventListener('load', handler);
          window.removeEventListener('resize', handler);
          window.removeEventListener('scroll', handler);
          getPosts({ t: target, type: 'featured', num: 4, label: label });
        }
      };
      window.addEventListener('load', handler);
      window.addEventListener('resize', handler);
      window.addEventListener('scroll', handler);
      handler();
      target.removeAttribute('data-shortcode');
    }
  });

  qsa('.sidebar .getPosts, .footer .getPosts').forEach(function (el) {
    var target = el.querySelector('.widget-content');
    if (!target) return;
    var shortcode = target.dataset.shortcode;
    if (shortcode) {
      var results = getAttr(shortcode, 'results') || 4;
      var label = getAttr(shortcode, 'label');
      var handler = function () {
        if (scrollY() + window.innerHeight >= offsetTop(target)) {
          window.removeEventListener('load', handler);
          window.removeEventListener('resize', handler);
          window.removeEventListener('scroll', handler);
          getPosts({ t: target, type: 'side', num: results, label: label });
        }
      };
      window.addEventListener('load', handler);
      window.addEventListener('resize', handler);
      window.addEventListener('scroll', handler);
      handler();
      target.removeAttribute('data-shortcode');
    }
  });

  getPostCard();

  qsa('#related-posts .HTML').forEach(function (el) {
    var shortcode = el.dataset.shortcode;
    if (!shortcode) return;
    qsa('.related-wrap').forEach(function (wrap) {
      var tagEl = wrap.querySelector('.related-tag');
      var postId = tagEl ? tagEl.dataset.id : undefined;
      var currentLabel = tagEl ? tagEl.dataset.label : undefined;
      var target = wrap.querySelector('.widget-content');
      if (!target) return;
      var results = getAttr(shortcode, 'results');
      var num = results ? Number(results) + 1 : 4;
      var label = getAttr(shortcode, 'label');
      var finalLabel = (label && label !== currentLabel && label !== 'related') ? label : currentLabel;

      if (label && label !== currentLabel && label !== 'related') {
        var titleLink = target.parentElement.querySelector('.title-link');
        if (titleLink) titleLink.setAttribute('href', '/search/label/' + finalLabel);
      }

      var handler = function () {
        if (scrollY() + window.innerHeight >= offsetTop(target)) {
          window.removeEventListener('load', handler);
          window.removeEventListener('resize', handler);
          window.removeEventListener('scroll', handler);
          getPosts({ t: target, type: 'related', num: num, label: finalLabel, id: postId });
          el.parentElement.remove();
        }
      };
      window.addEventListener('load', handler);
      window.addEventListener('resize', handler);
      window.addEventListener('scroll', handler);
      handler();
    });
  });

  qsa('.blog-post-comments').forEach(function (el) {
    var shortcode = el.dataset.shortcode;
    var type = getAttr(shortcode, 'type');
    var typeClass = type + '-comments';

    switch (type) {
      case 'disqus': {
        var shortname = getAttr(shortcode, 'shortname');
        if (shortname !== false) window.disqus_shortname = shortname;
        disqusComments(window.disqus_shortname);
        el.classList.add(typeClass, 'visible');
        break;
      }
      case 'facebook': {
        var lang = getAttr(shortcode, 'lang');
        var sdkUrl = lang !== false
          ? 'https://connect.facebook.net/' + lang + '/all.js#xfbml=1&version=v14.0'
          : 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v14.0';
        var fbScript = document.createElement('script');
        fbScript.async = true;
        fbScript.defer = true;
        fbScript.crossOrigin = 'anonymous';
        fbScript.src = sdkUrl;
        document.head.appendChild(fbScript);
        el.classList.add(typeClass);
        var commentsEl = el.querySelector('#comments');
        if (commentsEl) {
          commentsEl.innerHTML = '<div class="fb-comments" data-width="100%" data-href="' + window.disqus_blogger_current_url + '" order_by="time" data-numposts="5" data-lazy="true"></div>';
        }
        el.classList.add('visible');
        break;
      }
      default:
        el.classList.add('blogger-comments', 'visible');
        var replyBtn = el.querySelector('#top-continue .comment-reply');
        if (replyBtn) replyBtn.classList.add('btn');
        beautiAvatar('.avatar-image-container img');
    }

    var replyLinks = qsa('.comments .comment-reply', el);
    var topContinue = el.querySelector('.comments #top-continue');
    var showCf = el.querySelector('.show-cf');

    replyLinks.forEach(function (link) {
      link.addEventListener('click', function (ev) {
        ev.preventDefault();
        el.classList.add('cf-on');
        if (topContinue) topContinue.style.display = '';
        if (showCf) showCf.remove();
      });
    });
    if (topContinue) {
      topContinue.addEventListener('click', function (ev) {
        ev.preventDefault();
        topContinue.style.display = 'none';
      });
    }
    if (showCf) {
      showCf.addEventListener('click', function () {
        el.classList.add('cf-on');
        showCf.remove();
      });
    }
  });

  // ---------------------------------------------------------------------
  // Init - runs once the DOM is fully ready
  // ---------------------------------------------------------------------
  ready(function () {
    qsa('.entry-thumbnail .thumbnail, .entry-avatar .avatar').forEach(function (el) {
      if (!el.classList.contains('pbt-lazy')) pbtLazy(el);
    });

    qsa('.header-inner').forEach(function (headerEl) {
      if (pbt.stickyMenu !== true) return;
      var lastScroll = scrollY();
      var initialTop = offsetTop(headerEl);
      var threshold = initialTop + 2 * headerEl.offsetHeight;
      var mainHeader = qs('.main-header');

      window.addEventListener('scroll', function () {
        var currentScroll = scrollY();
        var top = offsetTop(headerEl);
        var mainHeaderTop = mainHeader ? offsetTop(mainHeader) + 1 : 1;

        if (currentScroll > threshold) {
          headerEl.classList.add('is-fixed');
        } else if (top <= mainHeaderTop) {
          headerEl.classList.remove('is-fixed');
          headerEl.classList.remove('show');
        }

        if (currentScroll < lastScroll) {
          setTimeout(function () {
            if (top >= mainHeaderTop) headerEl.classList.add('show');
          }, 250);
        } else {
          setTimeout(function () { headerEl.classList.remove('show'); }, 250);
        }
        lastScroll = currentScroll;
      });
    });

    qsa('.mobile-logo').forEach(function (el) {
      var source = qs('.main-logo a');
      if (!source) return;
      var clone = source.cloneNode(true);
      var h1 = clone.querySelector('h1');
      if (h1) h1.remove();
      el.appendChild(clone);
    });

    qsa('.mobile-menu').forEach(function (el) {
      var mainNav = qs('.main-nav');
      if (!mainNav) return;
      var clone = mainNav.cloneNode(true);
      clone.setAttribute('class', 'mobile-nav');
      qsa('.sub', clone).forEach(function (sub) { sub.setAttribute('class', 'sub'); });

      qsa('.type-mega', clone).forEach(function (mega) {
        mega.removeAttribute('class');
        var ul = mega.querySelector('.ul');
        if (ul) ul.remove();
      });

      qsa('.type-tabs .nav a', clone).forEach(function (a) {
        a.removeAttribute('class');
        var li = document.createElement('li');
        a.parentNode.insertBefore(li, a);
        li.appendChild(a);
      });

      qsa('.type-tabs', clone).forEach(function (tabs) {
        tabs.setAttribute('class', 'has-sub');
        qsa('.ul', tabs).forEach(function (ul) {
          var nav = ul.querySelector('.nav');
          var navHtml = nav ? nav.innerHTML : '';
          ul.outerHTML = '<ul class="sub">' + navHtml + '</ul>';
        });
      });

      el.appendChild(clone);

      qsa('.menu-toggle, .hide-mobile-menu').forEach(function (toggle) {
        toggle.addEventListener('click', function () {
          document.body.classList.toggle('menu-on');
          var overlay = qs('.menu-on .overlay-bg');
          if (overlay) {
            overlay.addEventListener('click', function () {
              document.body.classList.remove('menu-on');
            });
          }
        });
      });

      qsa('.mobile-menu .has-sub > a').forEach(function (a) {
        a.addEventListener('click', function (ev) {
          ev.preventDefault();
          var li = a.parentElement;
          var sub = li.querySelector(':scope > .sub');
          if (li.classList.contains('expanded')) {
            li.classList.remove('expanded');
          } else {
            li.classList.add('expanded');
          }
          if (sub) slideToggle(sub, 170);
        });
      });
    });

    qsa('.mm-footer').forEach(function (el) {
      var social = qs('.footer-info .social');
      var menu = qs('.footer-menu ul');

      if (social) {
        var socialClone = social.cloneNode(true);
        socialClone.setAttribute('class', 'social color');
        var textEl = socialClone.querySelector('.text');
        if (textEl) textEl.remove();
        el.appendChild(socialClone);
      }
      if (menu) {
        var menuClone = menu.cloneNode(true);
        menuClone.setAttribute('class', 'links');
        el.appendChild(menuClone);
      }
    });

    qsa('#load-more').forEach(function (btn) {
      var loading = qs('.blog-pager .loading');
      var url = btn.dataset.url;

      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        btn.classList.remove('visible');
        if (loading) loading.classList.add('visible');

        fetch(url)
          .then(function (res) { return res.text(); })
          .then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var newPosts = doc.querySelector('.blog-posts');
            var blogPosts = qs('.blog-posts');
            if (newPosts) {
              qsa('.post', newPosts).forEach(function (post, idx) {
                post.classList.add('fadeInUp');
                post.setAttribute('style', 'animation-delay:' + (0.1 * idx).toFixed(1) + 's;');
              });
              if (blogPosts) blogPosts.insertAdjacentHTML('beforeend', newPosts.innerHTML);
            }
            var nextLoadMore = doc.querySelector('#load-more');
            url = nextLoadMore ? nextLoadMore.dataset.url : undefined;
            if (url) {
              btn.classList.add('visible');
            } else {
              btn.classList.remove('visible');
              var noMore = qs('.blog-pager .no-more');
              if (noMore) noMore.classList.add('visible');
            }
          })
          .finally(function () {
            if (loading) loading.classList.remove('visible');
            qsa('.blog-posts .thumbnail').forEach(function (thumb) {
              if (!thumb.classList.contains('pbt-lazy')) pbtLazy(thumb);
            });
          });
      });
    });

    qsa('p.comment-content').forEach(function (el) {
      replaceText(el, /\{image\}([^}]*)\{\/image\}/g, '<img class="comment-image" src="$1" alt="Comment Image" loading="lazy"/>');
      replaceText(el, /\{video\}([^}]*)\{\/video\}/g, '<span class="comment-video-url">$1</span>');

      qsa('.comment-video-url', el).forEach(function (span) {
        var urlStr = span.textContent;
        var parsed = new URL(urlStr);
        var params = new URLSearchParams(parsed.search);
        var videoId = (urlStr.indexOf('youtube.com') > -1 && params.get('v')) ||
          (urlStr.indexOf('youtu.be') > -1 && parsed.pathname.replace('/', ''));
        span.outerHTML = videoId
          ? '<div class="comment-video" data-id="' + videoId + '"><img width="100%" height="315" src="https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg" alt="YouTube Video Cover" loading="lazy"/><span class="yt-img"></span></div>'
          : 'Error: ' + pbt.noResults;
      });

      qsa('.comment-video', el).forEach(function (div) {
        var videoId = div.dataset.id;
        div.addEventListener('click', function () {
          div.outerHTML = '<iframe width="100%" height="315" src="https://www.youtube.com/embed/' + videoId + '" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
        });
      });
    });

    qsa('.cookie-consent').forEach(function (el) {
      var button = el.querySelector('.consent-button');
      if (Cookies.get('cookie_consent') !== 'true') {
        el.style.display = 'block';
        window.addEventListener('load', function () { el.classList.add('visible'); });
      }
      if (button) {
        button.addEventListener('click', function (ev) {
          ev.stopPropagation();
          Cookies.set('cookie_consent', 'true', { expires: 7, path: '/' });
          el.classList.remove('visible');
          setTimeout(function () { el.style.display = 'none'; }, 500);
        });
      }
    });

    qsa('.to-top').forEach(function (el) {
      var footer = qs('.site-footer');
      window.addEventListener('scroll', function () {
        if (scrollY() >= 100) el.classList.add('show'); else el.classList.remove('show');
        if (footer && offsetTop(el) >= offsetTop(footer) - 36) el.classList.add('on-footer'); else el.classList.remove('on-footer');
      });
      el.addEventListener('click', function () { animateScrollTo(0, 500); });
    });
  });

  if (typeof pbt !== 'undefined' && pbt.hasCookie) window.cookieChoices = {};
})();
