/* 帮助系统全局搜索：索引文档、例程、接口、类型与常量，支持键盘导航 */

var Search = (function () {
  'use strict';

  var INDEX = [];
  var results = [];
  var active = -1;
  var box, panel, body, stat;

  /** 生成与正文标题一致的锚点 ID */
  function secId(text) {
    return 's-' + encodeURIComponent(String(text).replace(/[\s\u3000]+/g, '')).replace(/%/g, '_');
  }

  /** 把 HTML 片段拆成以二级标题为界的检索段落 */
  function splitDoc(doc) {
    var box2 = document.createElement('div');
    box2.innerHTML = doc.html || '';
    var secs = [{ title: doc.title, id: '', text: '' }];
    var nodes = box2.children;
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var tag = el.tagName;
      if (tag === 'H2' || tag === 'H3') {
        secs.push({ title: el.textContent, id: secId(el.textContent), text: '' });
      } else {
        secs[secs.length - 1].text += ' ' + (el.textContent || '');
      }
    }
    return secs;
  }

  /** 建立检索索引 */
  function build(asmSubs) {
    (window.LS_DOC || []).forEach(function (doc) {
      splitDoc(doc).forEach(function (s) {
        INDEX.push({
          type: '文档', page: doc.id, anchor: s.id,
          title: s.title, extra: doc.title, text: (s.text || '').slice(0, 4000)
        });
      });
    });

    Object.keys(asmSubs).forEach(function (asm) {
      asmSubs[asm].forEach(function (s) {
        var ptext = (s.p || []).map(function (p) { return p[0] + ' ' + p[1] + ' ' + p[3]; }).join(' ');
        INDEX.push({
          type: '接口', page: 'api:' + asm,
          anchor: 'i-' + encodeURIComponent(asm + '.' + s.n).replace(/%/g, '_'),
          title: s.n, extra: asm, text: (s.d || '') + ' ' + ptext
        });
      });
    });

    (window.LS_TYPES || []).forEach(function (part) {
      /* 数据文件既可能是“每个分片一个数组”，也可能直接是类型对象，这里统一成数组处理 */
      (Array.isArray(part) ? part : [part]).forEach(function (t) {
        var mtext = (t.m || []).map(function (m) { return m.n + ' ' + m.t + ' ' + m.d; }).join(' ');
        INDEX.push({
          type: '数据类型', page: 'types',
          anchor: 't-' + encodeURIComponent(t.n).replace(/%/g, '_'),
          title: t.n, extra: t.pub ? '公开类型' : '内部类型', text: (t.d || '') + ' ' + mtext
        });
      });
    });

    (window.LS_CONSTS || []).forEach(function (part) {
      (part.c || []).forEach(function (c) {
        INDEX.push({
          type: '常量', page: 'constants', anchor: '',
          title: '#' + c.n, extra: part.g, text: c.v + ' ' + (c.d || '')
        });
      });
    });

    /* 例程区：整条例程作为一个检索项，锚点指向页面内的例程小节 */
    (window.LS_RECIPES || []).forEach(function (g) {
      (g.items || []).forEach(function (it) {
        INDEX.push({
          type: '例程', page: 'recipe:' + g.group, anchor: 'r-' + it.id,
          title: it.title, extra: g.group + (it.level ? ' · ' + it.level : ''),
          text: [it.desc].concat(it.scene || [], it.notes || []).join(' ')
        });
      });
    });
  }

  /** 执行搜索并返回命中项 */
  function query(q) {
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    var out = [];
    for (var i = 0; i < INDEX.length; i++) {
      var it = INDEX[i];
      var hay = (it.title + ' ' + it.extra + ' ' + it.text).toLowerCase();
      var score = 0, ok = true;
      for (var w = 0; w < words.length; w++) {
        var at = hay.indexOf(words[w]);
        if (at < 0) { ok = false; break; }
        if (it.title.toLowerCase().indexOf(words[w]) >= 0) score += 60;
        else if (it.extra.toLowerCase().indexOf(words[w]) >= 0) score += 25;
        else score += Math.max(1, 20 - Math.floor(at / 60));
      }
      if (!ok) continue;
      out.push({ it: it, score: score });
    }
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, 80).map(function (x) { return x.it; });
  }

  /** 生成带高亮的摘要文本 */
  function snippet(text, q) {
    var plain = String(text || '').replace(/\s+/g, ' ').trim();
    if (!plain) return '';
    var lower = plain.toLowerCase(), words = q.toLowerCase().split(/\s+/).filter(Boolean);
    var at = -1;
    for (var i = 0; i < words.length && at < 0; i++) at = lower.indexOf(words[i]);
    var start = Math.max(0, (at < 0 ? 0 : at) - 30);
    var cut = plain.slice(start, start + 130);
    var html = EPL.esc((start > 0 ? '…' : '') + cut + (start + 130 < plain.length ? '…' : ''));
    words.forEach(function (w) {
      if (w.length < 1) return;
      html = html.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'),
        '<mark>$1</mark>');
    });
    return html;
  }

  /** 渲染搜索结果列表 */
  function render(q) {
    results = query(q);
    active = results.length ? 0 : -1;
    if (!results.length) {
      body.innerHTML = '<div class="sr-empty">没有找到与“' + EPL.esc(q) + '”相关的内容。</div>';
      stat.textContent = '无匹配结果';
      return;
    }
    var html = '', lastType = '';
    results.forEach(function (it, i) {
      if (it.type !== lastType) {
        html += '<div class="sr-group">' + it.type + '</div>';
        lastType = it.type;
      }
      html += '<a class="sr-item' + (i === 0 ? ' active' : '') + '" data-i="' + i + '" href="#">' +
        '<div class="sr-t">' + EPL.esc(it.title) +
        (it.extra ? ' <span style="color:var(--text-3);font-weight:400">· ' + EPL.esc(it.extra) + '</span>' : '') +
        '</div><div class="sr-d">' + snippet(it.text, q) + '</div></a>';
    });
    body.innerHTML = html;
    stat.textContent = '共 ' + results.length + ' 条结果';
  }

  /** 打开当前选中的搜索结果 */
  function open(i) {
    var it = results[i];
    if (!it) return;
    hide();
    location.hash = '#/' + encodeURIComponent(it.page) + (it.anchor ? '#' + it.anchor : '');
  }

  /** 高亮结果项的键盘选中态 */
  function markActive() {
    var items = body.querySelectorAll('.sr-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', i === active);
      if (i === active) items[i].scrollIntoView({ block: 'nearest' });
    }
  }

  function show() { panel.hidden = false; }
  function hide() { panel.hidden = true; }

  /** 初始化搜索相关事件 */
  function init(asmSubs) {
    box = document.getElementById('search');
    panel = document.getElementById('searchPanel');
    body = document.getElementById('searchResults');
    stat = document.getElementById('searchStat');
    build(asmSubs || {});

    var timer = null;
    box.addEventListener('input', function () {
      clearTimeout(timer);
      var q = box.value.trim();
      timer = setTimeout(function () {
        if (!q) { hide(); document.getElementById('searchTip').textContent = ''; return; }
        render(q);
        show();
        document.getElementById('searchTip').textContent =
          INDEX.length + ' 项已索引';
      }, 120);
    });

    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (panel.hidden || !results.length) return;
        e.preventDefault();
        active = (active + (e.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length;
        markActive();
      } else if (e.key === 'Enter') {
        if (!panel.hidden && active >= 0) { e.preventDefault(); open(active); }
      } else if (e.key === 'Escape') {
        hide(); box.blur();
      }
    });

    document.getElementById('searchClose').addEventListener('click', hide);
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== box &&
        !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
        e.preventDefault();
        box.focus();
        box.select();
      }
    });
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !panel.contains(e.target) && e.target !== box) hide();
    });
    body.addEventListener('click', function (e) {
      var item = e.target.closest ? e.target.closest('.sr-item') : null;
      if (item) { e.preventDefault(); open(parseInt(item.getAttribute('data-i'), 10)); }
    });
  }

  return { init: init };
})();
