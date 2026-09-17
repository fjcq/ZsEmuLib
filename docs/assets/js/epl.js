/* 易语言（EPL）语法高亮与代码块组件 */

var EPL = (function () {
  'use strict';

  /* 易语言系统命令（以点号开头的指令） */
  var SYSTEM = {};

  ['.版本', '.程序集', '.子程序', '.参数', '.局部变量', '.程序集变量', '.全局变量',
    '.常量', '.数据类型', '.成员', '.DLL命令', '.支持库', '.库命令',
    '.如果', '.如果真', '.否则', '.如果结束', '.如果真结束',
    '.判断开始', '.判断', '.默认', '.判断结束',
    '.计次循环首', '.计次循环尾', '.变量循环首', '.变量循环尾',
    '.判断循环首', '.判断循环尾', '.循环判断首', '.循环判断尾',
    '.到循环尾', '.返回', '.结束', '.跳出循环'].forEach(function (k) { SYSTEM[k] = 1; });

  /* 易语言数据类型 */
  var TYPES = {};

  ['文本型', '整数型', '短整数型', '长整数型', '小数型', '双精度小数型', '逻辑型',
    '字节型', '字节集', '日期时间型', '子程序指针', '通用型', '数组', '参考', '可空',
    '公开', '静态'].forEach(function (k) { TYPES[k] = 1; });

  /* 常用核心库命令与模块辅助命令 */
  var BUILTINS = {};

  ['到文本', '到数值', '到整数', '到小数', '到双精度小数', '到逻辑型', '到字节集', '到字节',
    '取文本长度', '取文本中间', '取文本左边', '取文本右边', '寻找文本', '倒找文本',
    '替换文本', '分割文本', '取数组成员数', '加入成员', '插入成员', '删除成员',
    '清除数组', '重定义数组', '复制数组', '取数组下标', '取运行目录', '取运行时间',
    '取现行时间', '取启动时间', '延时', '处理事件', '是否为空', '选择', '多项选择',
    '取绝对值', '取整', '取随机数', '取反', '信息框', '输出调试文本', '调试输出',
    '读入文件', '写到文件', '打开文件', '关闭文件', '取文件长度', '取窗口句柄',
    '取窗口矩形', '移动窗口', '启动线程', '线程等待', '进入许可区', '退出许可区',
    '创建进入许可证', '删除进入许可证', '取变量地址', '取变量数据地址', '到字节集',
    '输出调试', '延时_', '取文本左边s', '取文本右边s', '寻找文本s', '分割文本_ASM',
    '到文本s_整数型', '文件_是否存在', '文件_复制', '文件_删除', '取窗口矩形_',
    '移动窗口_', '取运行时间_', '生成_通讯录文本'].forEach(function (k) { BUILTINS[k] = 1; });

  var TOKEN = new RegExp(
    "('(?:[^\\n]*))" +                    // 1 注释
    '|(“(?:[^”\\n]*)”)' +                 // 2 全角引号字符串
    '|("(?:[^"\\n]*)\")' +                // 3 半角引号字符串
    '|(\\.[\\u4e00-\\u9fa5A-Za-z_][\\u4e00-\\u9fa5A-Za-z0-9_]*)' +  // 4 系统命令
    '|(#(?:[\\u4e00-\\u9fa5A-Za-z0-9_]+|“[^”\\n]*”))' +           // 5 常量
    '|(\\d+(?:\\.\\d+)?)' +               // 6 数值
    '|([\\u4e00-\\u9fa5A-Za-z_][\\u4e00-\\u9fa5A-Za-z0-9_]*)',     // 7 标识符
    'g');

  var seq = 0;
  var registry = {};

  /** 转义 HTML 特殊字符 */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /** 判断标识符应使用的高亮样式 */
  function clsOf(word) {
    if (TYPES[word]) return 't';
    if (BUILTINS[word]) return 'f';
    if (word === '真' || word === '假') return 'k';
    return '';
  }

  /** 对易语言源码做语法高亮，返回 HTML 片段 */
  function highlight(code) {
    var out = '', last = 0, m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(code)) !== null) {
      out += esc(code.slice(last, m.index));
      var text = m[0], cls = '';
      if (m[1]) cls = 'c';
      else if (m[2] || m[3]) cls = 's';
      else if (m[4]) cls = 'k';
      else if (m[5] || m[6]) cls = 'n';
      else cls = clsOf(m[7]);
      out += cls ? '<span class="' + cls + '">' + esc(text) + '</span>' : esc(text);
      last = m.index + text.length;
      if (m.index === TOKEN.lastIndex) TOKEN.lastIndex++;
    }
    out += esc(code.slice(last));
    return out;
  }

  /** 生成带标题与复制按钮的代码块 HTML */
  function block(code, title) {
    var id = 'code' + (++seq);
    registry[id] = code;
    return '<div class="code-block">' +
      '<div class="code-head"><span class="code-title">' + esc(title || '易语言示例代码') + '</span>' +
      '<button class="copy-btn" type="button" data-copy="' + id + '">复制代码</button></div>' +
      '<pre><code>' + highlight(code) + '</code></pre></div>';
  }

  /** 复制指定代码块的源码到剪贴板 */
  function copy(id, button) {
    var code = registry[id];
    if (typeof code !== 'string') return;
    var done = function () {
      if (!button) return;
      var old = button.textContent;
      button.textContent = '已复制';
      button.classList.add('done');
      setTimeout(function () {
        button.textContent = old;
        button.classList.remove('done');
      }, 1400);
    };
    if (navigator.clipboard && window.isSecureContext !== false) {
      navigator.clipboard.writeText(code).then(done, function () { fallback(code, done); });
    } else {
      fallback(code, done);
    }
  }

  /** 剪贴板降级方案（file:// 场景） */
  function fallback(code, done) {
    var ta = document.createElement('textarea');
    ta.value = code;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* 忽略复制失败 */ }
    document.body.removeChild(ta);
  }

  /** 行内代码样式（用于正文中的短引用） */
  function inline(text) {
    return '<code class="inline">' + esc(text) + '</code>';
  }

  return { esc: esc, highlight: highlight, block: block, copy: copy, inline: inline };
})();
