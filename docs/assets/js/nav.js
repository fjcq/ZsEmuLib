/* 帮助系统左侧导航：分区渲染、分组折叠、目录筛选（独立成文件以控制单文件行数） */

var Nav = (function () {
  'use strict';

  var KEY = 'ls-help-nav-collapsed';
  var SEC_PREFIX = 's:';  // 分区折叠记录的键前缀，避免与分组名重名
  var collapsed = null;   // 折叠记录；null 表示用户尚未操作过，按默认规则折叠
  var NAV = [];           // 导航树，由主程序 App 构建后传入

  /** 读取用户保存的折叠记录 */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) collapsed = JSON.parse(raw) || {};
    } catch (e) { /* 忽略读取失败 */ }
  }

  /** 保存折叠记录 */
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(collapsed || {})); } catch (e) { /* 忽略写入失败 */ }
  }

  /** 按导航顺序取出分区名（用于折叠记录与筛选时的对应关系） */
  function sections() {
    var list = [];
    NAV.forEach(function (n) { if (list.indexOf(n.section) < 0) list.push(n.section); });
    return list;
  }

  /** 把当前折叠状态固化成记录（用户首次操作分区或分组时调用） */
  function snapshot() {
    var map = {};
    sections().forEach(function (sec) { if (isSecOff(sec)) map[SEC_PREFIX + sec] = 1; });
    NAV.forEach(function (n) { if (isCollapsed(n)) map[n.group] = 1; });
    collapsed = map;
  }

  /** 分组默认折叠规则：接口程序集分组默认收起，其余（入门 / 参考资料 / 例程等）默认展开 */
  function isCollapsed(n) {
    if (collapsed) return !!collapsed[n.group];
    return n.items.some(function (it) { return it.id.indexOf('api:') === 0; });
  }

  /** 分区默认展开；记录中标记为 1 表示用户已收起该分区 */
  function isSecOff(sec) {
    if (!collapsed) return false;
    return !!collapsed[SEC_PREFIX + sec];
  }

  /** 切换单个分组的折叠状态，并同步箭头与提示文字 */
  function setCollapsed(box, off) {
    box.classList.toggle('collapsed', off);
    var caret = box.querySelector('.caret');
    if (caret) caret.textContent = off ? '▸' : '▾';
    box.querySelector('h4').setAttribute('title', '点击' + (off ? '展开' : '折叠'));
  }

  /** 切换整个分区的收起 / 展开，并同步箭头与提示文字 */
  function setSecOff(box, off) {
    box.classList.toggle('collapsed', off);
    var sec = box.querySelector('.nav-sec');
    if (!sec) return;
    var caret = sec.querySelector('.caret');
    if (caret) caret.textContent = off ? '▸' : '▾';
    sec.setAttribute('title', '点击' + (off ? '展开' : '收起'));
  }

  /** 渲染左侧导航（分区 -> 分组 -> 条目，分区与分组均可折叠） */
  function render() {
    var html = '', lastSec = '', open = false;
    NAV.forEach(function (n) {
      if (n.section !== lastSec) {
        if (open) html += '</div>';
        var sof = isSecOff(n.section);
        html += '<div class="nav-secbox' + (sof ? ' collapsed' : '') + '" data-sec="' +
          EPL.esc(n.section) + '">';
        html += '<div class="nav-sec" title="点击' + (sof ? '展开' : '收起') + '">' +
          EPL.esc(n.section) + '<span class="caret">' + (sof ? '▸' : '▾') + '</span></div>';
        lastSec = n.section;
        open = true;
      }
      var off = isCollapsed(n);
      html += '<div class="nav-group' + (off ? ' collapsed' : '') + '" data-group="' +
        EPL.esc(n.group) + '">';
      html += '<h4 title="点击' + (off ? '展开' : '折叠') + '">' + EPL.esc(n.group) +
        '<span class="caret">' + (off ? '▸' : '▾') + '</span></h4>';
      n.items.forEach(function (it) {
        html += '<a class="nav-item" data-page="' + EPL.esc(it.id) + '" href="#/' +
          encodeURIComponent(it.id) + '">' + EPL.esc(it.title) +
          (it.count ? '<span class="cnt">' + it.count + '</span>' : '') + '</a>';
      });
      html += '</div>';
    });
    if (open) html += '</div>';
    document.getElementById('navTree').innerHTML = html;
  }

  /** 高亮当前导航项；autoOpen 为真时自动展开条目所在的分区与分组，并记住该状态 */
  function mark(id, autoOpen) {
    var list = document.querySelectorAll('.nav-item');
    for (var i = 0; i < list.length; i++) {
      var on = list[i].getAttribute('data-page') === id;
      list[i].classList.toggle('active', on);
      if (!on) continue;
      var box = list[i].parentNode;
      var secbox = box.parentNode;
      if (autoOpen) {
        if (!collapsed) snapshot();
        var changed = false;
        if (secbox.classList.contains('collapsed')) {
          delete collapsed[SEC_PREFIX + secbox.getAttribute('data-sec')];
          setSecOff(secbox, false);
          changed = true;
        }
        if (box.classList.contains('collapsed')) {
          delete collapsed[box.getAttribute('data-group')];
          setCollapsed(box, false);
          changed = true;
        }
        if (changed) save();
      }
      if (!box.classList.contains('collapsed') && !secbox.classList.contains('collapsed')) {
        list[i].scrollIntoView({ block: 'nearest' });
      }
    }
  }

  /** 绑定目录筛选框与分区 / 分组标题的折叠交互 */
  function bind() {
    /* 目录筛选：命中条目名或分组名；筛选期间自动展开分区与分组，清空后恢复原折叠状态 */
    document.getElementById('navFilter').addEventListener('input', function () {
      var q = this.value.trim().toLowerCase();
      var groups = document.querySelectorAll('#navTree .nav-group');
      for (var j = 0; j < groups.length; j++) {
        var byGroup = !!q && (groups[j].getAttribute('data-group') || '').toLowerCase().indexOf(q) >= 0;
        var items = groups[j].querySelectorAll('.nav-item');
        var shown = 0;
        for (var i = 0; i < items.length; i++) {
          var hit = !q || byGroup || items[i].textContent.toLowerCase().indexOf(q) >= 0;
          items[i].style.display = hit ? '' : 'none';
          if (hit) shown++;
        }
        groups[j].style.display = shown ? '' : 'none';
        setCollapsed(groups[j], !q && isCollapsed(NAV[j]));
      }
      /* 分区：一个分组都没命中时整块隐藏；筛选期间展开，清空后按记录恢复 */
      var secs = document.querySelectorAll('#navTree .nav-secbox');
      var names = sections();
      for (var k = 0; k < secs.length; k++) {
        var hitItems = secs[k].querySelectorAll('.nav-item:not([style*="display: none"])');
        secs[k].style.display = hitItems.length ? '' : 'none';
        setSecOff(secs[k], !q && isSecOff(names[k]));
      }
    });

    /* 点击分区标题收起 / 展开整个分区，点击分组标题折叠 / 展开该分组，并记住状态 */
    document.getElementById('navTree').addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var sec = e.target.closest('.nav-secbox > .nav-sec');
      if (sec) {
        var sbox = sec.parentNode;
        var soff = !sbox.classList.contains('collapsed');
        if (!collapsed) snapshot();
        if (soff) collapsed[SEC_PREFIX + sbox.getAttribute('data-sec')] = 1;
        else delete collapsed[SEC_PREFIX + sbox.getAttribute('data-sec')];
        setSecOff(sbox, soff);
        save();
        return;
      }
      var h = e.target.closest('.nav-group > h4');
      if (!h) return;
      var box = h.parentNode;
      var off = !box.classList.contains('collapsed');
      if (!collapsed) snapshot();
      if (off) collapsed[box.getAttribute('data-group')] = 1;
      else delete collapsed[box.getAttribute('data-group')];
      setCollapsed(box, off);
      save();
    });
  }

  /** 记录导航树（App 构建完成后调用），并读取上次折叠状态 */
  function init(nav) {
    NAV = nav || [];
    load();
  }

  return { init: init, render: render, mark: mark, bind: bind };
})();