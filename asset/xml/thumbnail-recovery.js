/* IlmuAlam thumbnail recovery v1.0.0
 * Recovers real post thumbnails only when Blogger featuredImage metadata is missing.
 * Designed for related posts, sidebar, search, mega/trending and other .thumbnail cards.
 * No dependency; same-origin fetch only; session-cached; mutation-safe.
 */
(function(){
  'use strict';

  var inflight = new Map();
  var processed = new WeakSet();
  var queue = [];
  var active = 0;
  var MAX_CONCURRENT = 3;
  var BLANK_RE = /(?:resources\.blogblog\.com\/img\/blank\.gif|ptb-nth\.webp)/i;

  function isRealImage(url){
    return !!url && !BLANK_RE.test(url) && !/^data:/i.test(url) && !/avatar|profile|favicon|logo/i.test(url);
  }

  function postUrlFor(el){
    var post = el.closest('.post');
    if(!post) return '';
    var link = post.querySelector('.entry-thumbnail[href],.entry-inner[href],.entry-title a[href]');
    if(!link || !link.href) return '';
    try {
      var u = new URL(link.href, location.href);
      return u.origin === location.origin ? u.href : '';
    } catch(e){
      return '';
    }
  }

  function normaliseBloggerImage(url){
    if(!url) return '';
    try {
      var u = new URL(url, location.href);
      if(!/blogger\.googleusercontent\.com$/i.test(u.hostname) && !/googleusercontent\.com$/i.test(u.hostname)) return u.href;
      u.pathname = u.pathname
        .replace(/\/s\d+(?:-c)?\//i,'/w320-h180-p-k-no-nu-rw/')
        .replace(/\/w\d+(?:-h\d+)?(?:-[^/]+)?\//i,'/w320-h180-p-k-no-nu-rw/');
      u.search = u.search
        .replace(/=s\d+(?:-c)?/i,'=w320-h180-p-k-no-nu-rw')
        .replace(/=w\d+(?:-h\d+)?(?:-[^&]+)?/i,'=w320-h180-p-k-no-nu-rw');
      return u.href;
    } catch(e){
      return url;
    }
  }

  function extractImage(html){
    var doc = new DOMParser().parseFromString(html,'text/html');
    var selectors = [
      '.post-body img[src]',
      'article img[src]',
      'main img[src]',
      'meta[property="og:image"]',
      'meta[name="twitter:image"]'
    ];
    for(var i=0;i<selectors.length;i++){
      var nodes = doc.querySelectorAll(selectors[i]);
      for(var j=0;j<nodes.length;j++){
        var node = nodes[j];
        var src = node.tagName === 'META' ? node.content : (node.currentSrc || node.src || node.getAttribute('data-src') || '');
        if(isRealImage(src)) return normaliseBloggerImage(src);
      }
    }
    return '';
  }

  function cacheKey(url){
    return 'ia_thumb_v1:' + url;
  }

  function cached(url){
    try { return sessionStorage.getItem(cacheKey(url)) || ''; } catch(e){ return ''; }
  }

  function saveCache(url,src){
    try { if(src) sessionStorage.setItem(cacheKey(url),src); } catch(e){}
  }

  function recover(url){
    var hit = cached(url);
    if(hit) return Promise.resolve(hit);
    if(inflight.has(url)) return inflight.get(url);
    var p = fetch(url,{credentials:'same-origin',cache:'force-cache'})
      .then(function(r){ return r.ok ? r.text() : ''; })
      .then(function(html){
        var src = html ? extractImage(html) : '';
        saveCache(url,src);
        return src;
      })
      .catch(function(){ return ''; })
      .finally(function(){ inflight.delete(url); });
    inflight.set(url,p);
    return p;
  }

  function apply(el,src){
    if(!isRealImage(src)) return;
    el.setAttribute('data-src',src);
    el.style.backgroundImage = "url('" + src.replace(/'/g,"%27") + "')";
    el.classList.add('pbt-lazy','ia-thumb-recovered');
  }

  function runTask(task){
    active++;
    recover(task.url).then(function(src){ apply(task.el,src); }).finally(function(){
      active--;
      pump();
    });
  }

  function pump(){
    while(active < MAX_CONCURRENT && queue.length) runTask(queue.shift());
  }

  function enqueue(el){
    if(processed.has(el)) return;
    processed.add(el);
    var current = el.getAttribute('data-src') || '';
    if(isRealImage(current)) return;
    var url = postUrlFor(el);
    if(!url) return;
    queue.push({el:el,url:url});
    pump();
  }

  function scan(root){
    if(!root) root = document;
    if(root.nodeType === 1 && root.matches && root.matches('.thumbnail')) enqueue(root);
    var thumbs = root.querySelectorAll ? root.querySelectorAll('.thumbnail') : [];
    for(var i=0;i<thumbs.length;i++) enqueue(thumbs[i]);
  }

  function start(){
    scan(document);
    var observer = new MutationObserver(function(mutations){
      for(var i=0;i<mutations.length;i++){
        for(var j=0;j<mutations[i].addedNodes.length;j++){
          var node = mutations[i].addedNodes[j];
          if(node.nodeType === 1) scan(node);
        }
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
