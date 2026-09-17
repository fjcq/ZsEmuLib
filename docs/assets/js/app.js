/* 帮助系统主程序：导航构建、页面渲染与路由 */

var App = (function () {
  'use strict';

  /* 导航顶部分区：文档区（讲解 + 接口手册）与例程区（常用场景例程） */
  var SEC_DOC = '文档区';
  var SEC_RECIPE = '例程区';
  var SEC_ORDER = {};
  SEC_ORDER[SEC_DOC] = 0;
  SEC_ORDER[SEC_RECIPE] = 1;

  /* 程序集 -> 导航分组 的归类表 */
  var ASM_GROUP = {
    '雷神adb操作': '模拟器操作类',
    '雷神lsconsole操作': '模拟器操作类',
    '雷神ls操作': '模拟器操作类',
    'MuMu管理器': '模拟器操作类',
    '雷神专用': '模块顶层命令',
    'MuMu专用': '模块顶层命令',
    '地图功能': '模块顶层命令',
    '雷神_配置项': '模块顶层命令',
    '类_哈希表': '工具类库',
    '类_数组': '工具类库',
    '类_编码转换': '工具类库',
    '类_队列': '工具类库',
    '类_高性能读写锁': '工具类库',
    '类_计时': '工具类库',
    '正则表达式类': '工具类库',
    '类_命名管道': '工具类库',
    '类_匿名管道': '工具类库',
    '程序集_终端操作': '工具类库'
  };

  var DEFAULT_GROUP = '内部程序集';

  /* 固定章节（内容由 content/*.js 提供） */
  var FIXED = [
    { group: '开始使用', id: 'overview', title: '模块概述' },
    { group: '开始使用', id: 'quickstart', title: '快速入门' },
    { group: '开始使用', id: 'advanced', title: '高级应用技巧' },
    { group: '开始使用', id: 'faq', title: '常见问题解答' },
    { group: '参考资料', id: 'types', title: '数据类型' },
    { group: '参考资料', id: 'constants', title: '常量速查表' }
  ];

  var ASM_SUBS = {};     // 程序集名 -> 接口数组
  var NAV = [];          // 导航树（渲染与折叠交互由 nav.js 负责）
  var current = '';
  var booted = false;    // 是否已过首屏渲染：只有首屏之后的跳转才自动展开收起的分组

  /** 汇总所有数据文件中的接口，按程序集分组 */
  function collectApi() {
    var parts = (window.LS_API || []).slice();
    for (var i = 0; i < parts.length; i++) {
      var subs = parts[i].subs || [];
      for (var j = 0; j < subs.length; j++) {
        var s = subs[j];
        if (!ASM_SUBS[s.a]) ASM_SUBS[s.a] = [];
        ASM_SUBS[s.a].push(s);
      }
    }
  }

  /** 把多个例程文件中的分组归并为一个列表（同名分组会自动合并） */
  function recipeGroups() {
    var map = {}, order = [];
    (window.LS_RECIPES || []).forEach(function (g) {
      if (!map[g.group]) { map[g.group] = []; order.push(g.group); }
      map[g.group] = map[g.group].concat(g.items || []);
    });
    return order.map(function (name) { return { group: name, items: map[name] }; });
  }

  /** 构建导航树（分区 -> 分组 -> 导航项） */
  function buildNav() {
    var map = {}, keys = [];
    var push = function (section, group, item) {
      var key = section + '\u0000' + group;
      if (!map[key]) { map[key] = { section: section, group: group, items: [] }; keys.push(key); }
      map[key].items.push(item);
    };
    FIXED.forEach(function (f) { push(SEC_DOC, f.group, f); });
    Object.keys(ASM_SUBS).forEach(function (asm) {
      push(SEC_DOC, ASM_GROUP[asm] || DEFAULT_GROUP, {
        id: 'api:' + asm, title: asm, count: ASM_SUBS[asm].length
      });
    });
    recipeGroups().forEach(function (g) {
      push(SEC_RECIPE, g.group, {
        id: 'recipe:' + g.group, title: g.group, count: g.items.length
      });
    });
    /* 只按分区排序，同分区内保持插入顺序（V8 的 sort 为稳定排序） */
    keys.sort(function (a, b) {
      return SEC_ORDER[map[a].section] - SEC_ORDER[map[b].section];
    });
    NAV = keys.map(function (k) {
      var n = map[k];
      n.items.sort(function (a, b) {
        if (a.count && b.count) return b.count - a.count;
        return 0;
      });
      return n;
    });
  }

  /** 渲染接口文档页 */
  function renderApi(asm) {
    var subs = ASM_SUBS[asm] || [];
    var meta = (window.LS_ASM || {})[asm] || {};
    var ex = window.LS_EXAMPLES || {};
    var h = '<div class="doc">';
    h += '<h1>' + EPL.esc(asm) + '</h1>';
    h += '<p class="lead">' + (meta.desc ? EPL.esc(meta.desc) : '本程序集共 ' + subs.length + ' 个公开接口。') + '</p>';
    h += '<div class="stat-row">' +
      '<div class="stat"><b>' + subs.length + '</b><span>公开接口</span></div>' +
      '<div class="stat"><b>' + (meta.base ? EPL.esc(meta.base) : '—') + '</b><span>基类</span></div>' +
      '<div class="stat"><b>' + (meta.pub ? '是' : '否') + '</b><span>模块外可直接访问</span></div>' +
      '</div>';
    if (!meta.pub) {
      h += '<div class="warn"><b>注意：</b>本程序集未标记“公开”，通常仅供模块内部调用。' +
        '若在模块外部无法直接引用，请改用文档中标注为公开的类（如 <code class="inline">雷神adb操作</code>）。</div>';
    }
    h += '<div class="tip">本页共 ' + subs.length + ' 个接口。可用下方输入框按<b>接口名 / 说明 / 参数</b>实时过滤。</div>';
    h += '<p><input id="apiFilter" class="api-filter" type="search" placeholder="过滤本页接口…" ' +
      'style="width:100%;height:32px;padding:0 10px;border:1px solid var(--border);' +
      'border-radius:6px;background:var(--panel-2);color:var(--text);outline:none"></p>';
    h += '<div id="apiList">';
    subs.forEach(function (s) {
      h += apiCard(asm, s, ex[asm + '|' + s.n]);
    });
    h += '</div><p id="apiEmpty" class="sr-empty" hidden>没有匹配的接口。</p></div>';
    return h;
  }

  /** 渲染单个接口卡片 */
  function apiCard(asm, s, example) {
    var id = anchorOf(asm, s.n);
    var h = '<div class="api" id="' + id + '" data-key="' +
      EPL.esc((s.n + ' ' + (s.d || '') + ' ' + (s.p || []).map(function (p) {
        return p[0] + ' ' + p[3];
      }).join(' ')).toLowerCase()) + '">';
    h += '<div class="api-head"><span class="api-name">' + EPL.esc(s.n) + '</span>' +
      '<span class="api-ret">返回：' + EPL.esc(s.r || '无返回值') + '</span>' +
      '<span class="api-clock" data-anchor="' + id + '" title="复制定位链接">#</span></div>';
    h += '<div class="api-body">';
    if (s.d) h += '<p class="api-desc">' + EPL.esc(s.d) + '</p>';
    var p = s.p || [];
    if (p.length) {
      h += '<div class="api-sec">参数（' + p.length + ' 个）</div><table>' +
        '<tr><th style="width:22%">参数名</th><th style="width:16%">类型</th><th>说明</th></tr>';
      p.forEach(function (it) {
        h += '<tr><td class="pname">' + EPL.esc(it[0]) +
          (it[2] ? '<span class="opt">可空</span>' : '') + '</td>' +
          '<td class="ptype">' + EPL.esc(it[1] || '—') + '</td>' +
          '<td>' + (it[3] ? EPL.esc(it[3]) : '—') + '</td></tr>';
      });
      h += '</table>';
    } else {
      h += '<div class="api-sec">参数</div><p>无参数。</p>';
    }
    h += '<div class="api-sec">返回值</div><p>' + EPL.esc(s.r ? s.r : '本命令无返回值。') +
      (s.r && /文本型/.test(s.r) ? '　<b>（约定：返回空文本表示执行成功，返回非空文本为错误信息）</b>' : '') + '</p>';
    if (example) {
      h += '<div class="api-sec">调用示例</div>' + EPL.block(example, s.n + ' 调用示例');
    }
    h += '</div></div>';
    return h;
  }

  /** 生成接口锚点名称 */
  function anchorOf(asm, name) {
    return 'i-' + encodeURIComponent(asm + '.' + name).replace(/%/g, '_');
  }

  /** 渲染数据类型页 */
  function renderTypes() {
    var list = [];
    (window.LS_TYPES || []).forEach(function (t) { list = list.concat(t); });
    var pub = list.filter(function (t) { return t.pub; });
    var h = '<div class="doc"><h1>数据类型</h1>';
    h += '<p class="lead">模块内部定义的自定义数据类型。标注“公开”的类型可直接在模块外声明使用；' +
      '其余为模块内部结构，仅作参考。</p>';
    h += '<div class="stat-row"><div class="stat"><b>' + list.length +
      '</b><span>类型总数</span></div><div class="stat"><b>' + pub.length +
      '</b><span>公开类型</span></div></div>';
    h += '<p><input id="apiFilter" type="search" placeholder="过滤类型 / 成员…" ' +
      'style="width:100%;height:32px;padding:0 10px;border:1px solid var(--border);' +
      'border-radius:6px;background:var(--panel-2);color:var(--text);outline:none"></p>';
    h += '<div id="apiList">';
    list.sort(function (a, b) { return (b.pub ? 1 : 0) - (a.pub ? 1 : 0); });
    list.forEach(function (t) {
      var key = (t.n + ' ' + (t.d || '') + ' ' + (t.m || []).map(function (m) {
        return m.n + ' ' + m.d;
      }).join(' ')).toLowerCase();
      h += '<div class="api" id="t-' + encodeURIComponent(t.n).replace(/%/g, '_') +
        '" data-key="' + EPL.esc(key) + '">';
      h += '<div class="api-head"><span class="api-name">' + EPL.esc(t.n) + '</span>' +
        '<span class="api-ret">' + (t.pub ? '公开类型' : '内部类型') + '</span></div>';
      h += '<div class="api-body">';
      if (t.d) h += '<p class="api-desc">' + EPL.esc(t.d) + '</p>';
      h += '<table><tr><th style="width:22%">成员名</th><th style="width:18%">类型</th><th>说明</th></tr>';
      (t.m || []).forEach(function (m) {
        var ty = m.t + (m.dim ? ' [' + m.dim + ']' : '');
        h += '<tr><td class="pname">' + EPL.esc(m.n) + '</td><td class="ptype">' +
          EPL.esc(ty) + '</td><td>' + EPL.esc(m.d || (m.def ? '默认值：' + m.def : '') || '—') +
          '</td></tr>';
      });
      h += '</table></div></div>';
    });
    h += '</div><p id="apiEmpty" class="sr-empty" hidden>没有匹配的类型。</p></div>';
    return h;
  }

  /** 渲染常量速查表 */
  function renderConsts() {
    var groups = [], map = {};
    (window.LS_CONSTS || []).forEach(function (p) {
      (p.c || []).forEach(function (c) {
        if (!map[p.g]) { map[p.g] = []; groups.push(p.g); }
        map[p.g].push(c);
      });
    });
    var total = 0;
    groups.forEach(function (g) { total += map[g].length; });
    var h = '<div class="doc"><h1>常量速查表</h1>';
    h += '<p class="lead">模块公开常量。在易语言中通过 <code class="inline">#常量名</code> 引用，' +
      '例如 <code class="inline">#版本_雷电9</code>、<code class="inline">#配置项_ROOT权限</code>。</p>';
    h += '<div class="stat-row"><div class="stat"><b>' + total +
      '</b><span>常量总数</span></div><div class="stat"><b>' + groups.length +
      '</b><span>分组</span></div></div>';
    h += '<p><input id="apiFilter" type="search" placeholder="过滤常量名 / 值 / 说明…" ' +
      'style="width:100%;height:32px;padding:0 10px;border:1px solid var(--border);' +
      'border-radius:6px;background:var(--panel-2);color:var(--text);outline:none"></p>';
    h += '<div id="apiList">';
    groups.forEach(function (g) {
      h += '<div class="api" data-key="' + EPL.esc((g + ' ' + map[g].map(function (c) {
        return c.n + ' ' + c.v + ' ' + c.d;
      }).join(' ')).toLowerCase()) + '">';
      h += '<div class="api-head"><span class="api-name">' + EPL.esc(g) + '</span>' +
        '<span class="api-ret">' + map[g].length + ' 个</span></div><div class="api-body">';
      h += '<table><tr><th style="width:34%">常量名</th><th style="width:32%">取值</th><th>说明</th></tr>';
      map[g].forEach(function (c) {
        var v = c.v.length > 160 ? c.v.slice(0, 160) + '…' : c.v;
        h += '<tr><td class="pname">#' + EPL.esc(c.n) + '</td><td class="ptype">' +
          EPL.esc(v) + '</td><td>' + EPL.esc(c.d || '—') + '</td></tr>';
      });
      h += '</table></div></div>';
    });
    h += '</div><p id="apiEmpty" class="sr-empty" hidden>没有匹配的常量。</p></div>';
    return h;
  }

  /** 渲染固定章节（内容来自 content/*.js） */
  function renderDoc(id) {
    var docs = window.LS_DOC || [];
    for (var i = 0; i < docs.length; i++) {
      if (docs[i].id === id) {
        return '<div class="doc" data-key="' + EPL.esc((docs[i].title + ' ' +
          (docs[i].keys || '')).toLowerCase()) + '">' + docs[i].html + '</div>';
      }
    }
    return '<div class="doc"><h1>内容缺失</h1><p>未找到章节：' + EPL.esc(id) + '</p></div>';
  }

  /** 难度标签的样式名 */
  function levelCls(level) {
    return level === '入门' ? 'easy' : (level === '实战' ? 'hard' : 'mid');
  }

  /** 渲染例程分组页（常用场景例程） */
  function renderRecipe(group) {
    var found = null;
    recipeGroups().forEach(function (g) {
      if (g.group === group) found = g;
    });
    var items = (found && found.items) || [];
    var entry = items.filter(function (it) { return it.level === '入门'; }).length;
    var h = '<div class="doc">';
    h += '<h1>例程 · ' + EPL.esc(group) + '</h1>';
    h += '<p class="lead">本组共 ' + items.length + ' 个常用场景例程。每条例程都是可直接复制使用的' +
      '完整子程序（含参数、循环与错误处理），而不是单个接口的调用演示；' +
      '单个接口的用法请查阅“文档区 · 接口文档”中的对应页面。</p>';
    h += '<div class="stat-row"><div class="stat"><b>' + items.length +
      '</b><span>场景例程</span></div><div class="stat"><b>' + entry +
      '</b><span>入门</span></div><div class="stat"><b>' + (items.length - entry) +
      '</b><span>进阶 / 实战</span></div></div>';
    if (items.length) {
      h += '<div class="tip"><b>本页例程：</b>' + items.map(function (it) {
        return '<a href="#/' + encodeURIComponent('recipe:' + group) + '#r-' + it.id + '">' +
          EPL.esc(it.title) + '</a>';
      }).join('　·　') + '</div>';
    }
    items.forEach(function (it) {
      h += '<div class="recipe" id="r-' + EPL.esc(it.id) + '">';
      h += '<h2>' + EPL.esc(it.title) + (it.level ?
        '<span class="lv lv-' + levelCls(it.level) + '">' + EPL.esc(it.level) + '</span>' : '') + '</h2>';
      if (it.desc) h += '<p class="lead">' + EPL.esc(it.desc) + '</p>';
      if (it.scene && it.scene.length) {
        h += '<div class="rc-block rc-scene"><b>适用场景</b><ul>' + it.scene.map(function (s) {
          return '<li>' + EPL.esc(s) + '</li>';
        }).join('') + '</ul></div>';
      }
      h += EPL.block(it.code, it.title);
      if (it.notes && it.notes.length) {
        h += '<div class="warn rc-block"><b>注意事项</b><ul>' + it.notes.map(function (n) {
          return '<li>' + EPL.esc(n) + '</li>';
        }).join('') + '</ul></div>';
      }
      if (it.apis && it.apis.length) {
        h += '<div class="rc-block rc-apis"><b>涉及接口</b>' + it.apis.map(function (a) {
          return '<a href="#/' + encodeURIComponent('api:' + a[0]) + '#' + anchorOf(a[0], a[1]) +
            '" title="跳到接口文档">' + EPL.esc(a[0] + '.' + a[1]) + '</a>';
        }).join('') + '</div>';
      }
      h += '</div>';
    });
    h += '</div>';
    return h;
  }

  /** 为章节标题生成锚点 ID（供搜索定位） */
  function secId(text) {
    return 's-' + encodeURIComponent(String(text).replace(/[\s\u3000]+/g, '')).replace(/%/g, '_');
  }

  /** 给正文中的二、三级标题补上锚点，便于搜索跳转 */
  function assignHeadingIds(host) {
    var hs = host.querySelectorAll('.doc h2, .doc h3');
    for (var i = 0; i < hs.length; i++) {
      if (!hs[i].id) hs[i].id = secId(hs[i].textContent);
    }
  }

  /** 定位到某个页面（并可选滚动到锚点） */
  function goto(id, anchor) { location.hash = '#/' + encodeURIComponent(id) + (anchor ? '#' + anchor : ''); }

  /** 根据当前 hash 渲染页面 */
  function route() {
    var raw = decodeURIComponent((location.hash || '').replace(/^#\/?/, ''));
    var parts = raw.split('#');
    var id = parts[0] || 'overview';
    var anchor = parts[1] || '';
    current = id;
    var host = document.getElementById('content');
    var html;
    if (id.indexOf('api:') === 0) html = renderApi(id.slice(4));
    else if (id.indexOf('recipe:') === 0) html = renderRecipe(id.slice(7));
    else if (id === 'types') html = renderTypes();
    else if (id === 'constants') html = renderConsts();
    else html = renderDoc(id);
    host.innerHTML = html + '<button class="top-link" id="topLink" type="button">回到顶部</button>';
    assignHeadingIds(host);
    Nav.mark(id, booted);
    booted = true;
    bindPage(host);
    if (anchor) {
      var el = document.getElementById(anchor);
      if (el) { el.scrollIntoView({ block: 'start' }); return; }
    }
    host.scrollTop = 0;
  }

  /** 绑定页内交互（过滤、锚点复制、回到顶部） */
  function bindPage(host) {
    var filter = host.querySelector('#apiFilter');
    if (filter) {
      var cards = host.querySelectorAll('#apiList > .api');
      var empty = host.querySelector('#apiEmpty');
      filter.addEventListener('input', function () {
        var q = filter.value.trim().toLowerCase();
        var shown = 0;
        for (var i = 0; i < cards.length; i++) {
          var ok = !q || (cards[i].getAttribute('data-key') || '').indexOf(q) >= 0;
          cards[i].hidden = !ok;
          if (ok) shown++;
        }
        if (empty) empty.hidden = shown > 0;
      });
    }
    var tops = host.querySelectorAll('#topLink');
    for (var i = 0; i < tops.length; i++) {
      tops[i].addEventListener('click', function () { host.scrollTop = 0; });
    }
    host.addEventListener('click', function (e) {
      var clock = e.target.closest ? e.target.closest('.api-clock') : null;
      if (!clock) return;
      var url = location.href.split('#')[0] + '#/' + encodeURIComponent(current) +
        '#' + clock.getAttribute('data-anchor');
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('链接已复制'); });
    });
  }

  /** 顶部轻提示 */
  function toast(text) {
    var el = document.getElementById('toast');
    el.textContent = text;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.hidden = true; }, 1600);
  }

  /** 初始化：收集数据、渲染导航、绑定全局事件 */
  function init() {
    collectApi();
    buildNav();
    Nav.init(NAV);
    Nav.render();
    Nav.bind();

    var ver = window.LS_META && window.LS_META.version;
    if (ver) document.getElementById('brandVer').textContent = '使用帮助 · v' + ver;

    /* 用户主动跳转（点击导航 / 搜索结果）时才允许自动展开收起的分组 */
    window.addEventListener('hashchange', function () { booted = true; route(); });

    document.getElementById('btnNav').addEventListener('click', function () {
      document.getElementById('sidebar').classList.toggle('open');
    });

    document.getElementById('btnTheme').addEventListener('click', function () {
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
      try { localStorage.setItem('ls-help-theme', dark ? 'light' : 'dark'); } catch (e) { /* 忽略 */ }
    });

    try {
      var saved = localStorage.getItem('ls-help-theme');
      if (saved) document.documentElement.setAttribute('data-theme', saved);
    } catch (e) { /* 忽略 */ }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-copy]') : null;
      if (btn) EPL.copy(btn.getAttribute('data-copy'), btn);
      if (e.target.closest && e.target.closest('.nav-item') && window.innerWidth <= 900) {
        document.getElementById('sidebar').classList.remove('open');
      }
    });

    /* 初始地址不带 hash 时补默认页，用 replaceState 以免触发多余的 hashchange 而重复渲染 */
    if (!location.hash) history.replaceState(null, '', '#/overview');
    route();
    Search.init(ASM_SUBS);
  }

  return {
    init: init, goto: goto, toast: toast, anchorOf: anchorOf,
    getApi: function () { return ASM_SUBS; }
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
