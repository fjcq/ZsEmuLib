/* 帮助系统正文：模块概述 */

window.LS_DOC = window.LS_DOC || [];
window.LS_DOC.push({
  id: 'overview',
  title: '模块概述',
  keys: '模块概述 简介 功能介绍 适用范围 兼容性 术语 返回值约定 索引 序号 版本 环境要求 安装引入 894',
  html: [
    '<h1>模块概述</h1>',
    '<p class="lead">雷神_模拟器操作模块是一个面向易语言的安卓模拟器统一操作模块。' +
    '虽然名称保留“雷神”字样，但它同时兼容<b>雷电模拟器</b>、<b>雷神模拟器</b>与 <b>MuMu 模拟器</b>，' +
    '用同一套类接口完成模拟器的启动、配置、应用管理、文件传输、触控与截图等操作。</p>',

    '<div class="stat-row">',
    '<div class="stat"><b>894</b><span>公开接口（本次统计）</span></div>',
    '<div class="stat"><b>25</b><span>对外可见的程序集 / 类</span></div>',
    '<div class="stat"><b>66</b><span>自定义数据类型</span></div>',
    '<div class="stat"><b>558</b><span>公开常量</span></div>',
    '</div>',

    '<h2>一、功能介绍</h2>',
    '<p>模块把所有能力按“由外到内”分成四层，使用时按需选择，不必全部引入：</p>',

    '<h3>1. 四大核心操作类</h3>',
    '<table>',
    '<tr><th style="width:20%">类名</th><th style="width:30%">适用对象</th><th>核心能力</th></tr>',
    '<tr><td><code>雷神adb操作</code></td><td>所有安卓设备（模拟器 + 安卓真机）</td>' +
    '<td>完整的 ADB 命令封装：应用安装/卸载/启停、文件上传下载、设备信息读写、' +
    '控件枚举与查找、截屏、代理与网络、数据库操作、多用户与应用分身等</td></tr>',
    '<tr><td><code>雷神lsconsole操作</code></td><td>雷电 2.0+（含雷电 14）、雷神模拟器</td>' +
    '<td>模拟器实例管理：启动/关闭/新建/克隆/删除、配置修改、窗口与分辨率、' +
    '备份还原、按键与摇一摇等动作，以及 lsconsole 内置的 adb/shell 通道</td></tr>',
    '<tr><td><code>雷神ls操作</code></td><td>雷电 2.0+（含雷电 14）、雷神模拟器</td>' +
    '<td>通过 <code>ls.exe</code>/<code>ld.exe</code> 命令行的轻量操作：应用管理、文件读写、' +
    '属性读写、截图等，命令面比 lsconsole 更精简</td></tr>',
    '<tr><td><code>MuMu管理器</code></td><td>MuMu 12（4.0.0+）、MuMu 5（5.0.0+）</td>' +
    '<td>实例管理、应用管理、配置读写、分辨率/GPU/性能策略、触控输入，' +
    '以及“增强_”系列渲染层直连接口（截图、文本输入、多点触控）</td></tr>',
    '</table>',

    '<h3>2. 模块顶层命令（程序集）</h3>',
    '<table>',
    '<tr><th style="width:20%">程序集</th><th>作用</th></tr>',
    '<tr><td><code>雷神专用</code></td><td>安装目录探测、配置文件（leidian.config）读写、' +
    '窗口位置尺寸、ROOT / System 可写开关、模拟器进程与端口清理等模块级工具命令</td></tr>',
    '<tr><td><code>MuMu专用</code></td><td>MuMu 安装目录与工作目录探测、adb 端口获取、' +
    '窗口句柄与虚拟机进程、共享目录、机型配置等偏底层的 <code>M_</code> 系列命令</td></tr>',
    '<tr><td><code>地图功能</code></td><td>WGS84 / GCJ02 / BD09 三套坐标系互转、' +
    '地址解析与逆解析、地区与地点搜索、IP 定位</td></tr>',
    '<tr><td><code>雷神_配置项</code></td><td>通用的“配置项”容器类，支持文本/逻辑/整数/双精度值，' +
    '可从文件或文本载入并保存</td></tr>',
    '</table>',

    '<h3>3. 工具类库</h3>',
    '<p>这些类可以独立使用，也可以配合核心类完成高性能场景：</p>',
    '<table>',
    '<tr><th style="width:22%">类 / 程序集</th><th>说明</th></tr>',
    '<tr><td><code>类_命名管道</code></td><td>命名管道 + 异步 I/O 的进程管理类，' +
    'stdout 与 stderr 独立分流，支持超时控制与 UTF-8/ANSI 编码自动检测（v1.77 新增）</td></tr>',
    '<tr><td><code>类_匿名管道</code></td><td>匿名管道 + PeekNamedPipe 轮询的进程管理类，' +
    '停止时通过 Job Object 终止整个进程树</td></tr>',
    '<tr><td><code>程序集_终端操作</code></td><td>取终端路径、取终端返回（文本型/字节集）、' +
    '终端全局设置等，是模块内所有命令行调用的统一入口</td></tr>',
    '<tr><td><code>类_哈希表</code></td><td>高性能哈希表，支持有序模式、枚举、序列化与合并</td></tr>',
    '<tr><td><code>类_数组</code></td><td>动态数组封装，支持文本型与字节集型元素</td></tr>',
    '<tr><td><code>类_队列</code> / <code>类_计时</code></td><td>队列容器与高精度计时器</td></tr>',
    '<tr><td><code>类_编码转换</code></td><td>ANSI / UTF-8 / UTF-16（宽文本）互转</td></tr>',
    '<tr><td><code>类_高性能读写锁</code></td><td>多读单写锁，用于多线程下保护共享资源</td></tr>',
    '<tr><td><code>正则表达式类</code></td><td>正则匹配、替换与取子匹配（需自行初始化 COM）</td></tr>',
    '</table>',

    '<h3>4. 内部程序集</h3>',
    '<p>如 <code>程序集_常用程序</code>、<code>程序集_内部调用</code>、<code>程序集_图像处理</code>、' +
    '<code>程序集_解压缩</code>、<code>程序集_XML解析</code>、<code>程序集_文本操作</code>、' +
    '<code>程序集_指针操作</code>、<code>程序集_数值转换</code> 等，主要供模块内部调用。' +
    '在接口文档中它们归入“内部程序集”分组，不保证长期稳定，不建议业务代码直接依赖。</p>',

    '<h2>二、适用范围</h2>',
    '<table>',
    '<tr><th style="width:26%">模拟器</th><th style="width:16%">最低版本</th>' +
    '<th>推荐使用的类</th></tr>',
    '<tr><td>雷电模拟器</td><td>2.0 及以上（含雷电 14）</td>' +
    '<td><code>雷神lsconsole操作</code>（实例管理） + <code>雷神adb操作</code>（设备操作）</td></tr>',
    '<tr><td>雷神模拟器</td><td>1.0.8 及以上</td>' +
    '<td><code>雷神lsconsole操作</code> + <code>雷神adb操作</code></td></tr>',
    '<tr><td>MuMu 模拟器 12</td><td>4.0.0 及以上</td>' +
    '<td><code>MuMu管理器</code>；如需 ADB 层操作可配合 <code>雷神adb操作</code></td></tr>',
    '<tr><td>MuMu 模拟器 5</td><td>5.0.0 及以上</td><td><code>MuMu管理器</code></td></tr>',
    '<tr><td>安卓真机 / 其他模拟器</td><td>具备 adb 连接能力即可</td>' +
    '<td>仅 <code>雷神adb操作</code>（通过 <code>远程连接()</code> 或 <code>置连接端口()</code>）</td></tr>',
    '</table>',

    '<div class="tip"><b>选型建议：</b>如果你的程序需要同时支持雷电、雷神与 MuMu，' +
    '推荐用 <code class="inline">雷神adb操作</code> 承担绝大部分设备操作（它对三者都可用），' +
    '仅把“启动/关闭/配置”这类实例管理功能分别交给 <code class="inline">雷神lsconsole操作</code> 和 ' +
    '<code class="inline">MuMu管理器</code>。</div>',

    '<h2>三、运行环境与引入方式</h2>',
    '<ul>',
    '<li><b>易语言版本：</b>易语言 5.x（.版本 2 源码格式）。</li>',
    '<li><b>操作系统：</b>Windows 7 / 10 / 11，部分命令（如 <code class="inline">雷神_取PID</code>、' +
    '结束虚拟机进程）需要<b>以管理员权限运行</b>。</li>',
    '<li><b>依赖：</b>模块已内置 adb 命令行调用、7z 解压、哈希表等实现，' +
    '无需另外引入 zyJson 等第三方支持库；但 <code class="inline">正则表达式类</code> 需要' +
    '系统已注册 COM 组件（Windows 自带）。</li>',
    '<li><b>引入：</b>在易语言“程序”菜单中打开模块引用表，加入 <code class="inline">雷神_模拟器操作模块.ec</code>；' +
    '随后在程序集变量中声明需要的类即可，例如 ' +
    '<code class="inline">.程序集变量 adb, 雷神adb操作</code>。</li>',
    '</ul>',

    '<h2>四、术语与书写约定</h2>',
    '<table>',
    '<tr><th style="width:20%">术语</th><th>含义</th></tr>',
    '<tr><td><b>索引</b></td><td>模拟器在多开器中的序号，<b>从 0 开始</b>。' +
    '第一个模拟器索引为 0，第二个为 1，以此类推。</td></tr>',
    '<tr><td><b>序号</b></td><td>MuMu 官方文档对“索引”的称呼，含义相同，同样从 0 开始。' +
    'MuMu 类接口的参数名统一为“索引”，取值支持 <code class="inline">"2"</code>、' +
    '<code class="inline">"0,2,4"</code>（批量）与 <code class="inline">"all"</code>（全部）三种写法。</td></tr>',
    '<tr><td><b>可空参数</b></td><td>文档中标注“可空”的参数可以留空不填，' +
    '易语言中写作两个连续逗号，例如 <code class="inline">启动模拟器 (0, , 120)</code>。</td></tr>',
    '<tr><td><b>终端 / DOS</b></td><td>指模块执行命令行时所用的 cmd.exe / powershell.exe。' +
    'v1.77 起“DOS 系列”统一更名为“终端系列”，旧名保留为兼容跳转命令。</td></tr>',
    '<tr><td><b>增强_ 系列</b></td><td>MuMu 管理器中专有的渲染层直连接口，需先调用 ' +
    '<code class="inline">增强_连接()</code> 取得连接句柄，用完必须 ' +
    '<code class="inline">增强_断开()</code>。</td></tr>',
    '</table>',

    '<h2>五、返回值约定（重要）</h2>',
    '<p>模块的返回值语义<b>不统一</b>，使用前请务必对照接口文档中的“返回：”一栏。常见四类：</p>',
    '<table>',
    '<tr><th style="width:16%">返回类型</th><th>约定</th></tr>',
    '<tr><td>文本型</td><td><b>返回空文本 <code class="inline">“”</code> 表示执行成功</b>，' +
    '返回非空文本表示失败，内容即错误信息。这是模块中最常见的约定。</td></tr>',
    '<tr><td>逻辑型</td><td>成功返回 <code class="inline">真</code>，失败返回 ' +
    '<code class="inline">假</code>。</td></tr>',
    '<tr><td>整数型</td><td>通常返回“数量”；<b>失败时多为 -1 或 0</b>（具体见各接口说明）。</td></tr>',
    '<tr><td>无返回值</td><td>命令只做动作，不反馈结果，例如 <code class="inline">雷神_结束进程()</code>。</td></tr>',
    '</table>',
    '<div class="danger"><b>易错点：</b>把“返回空文本”当成失败是最常见的使用错误。' +
    '判断成功请写成 <code class="inline">.如果 (返回文本 ＝ “”)</code>，而不是 ' +
    '<code class="inline">.如果 (返回文本 ≠ “”)</code>。</div>',

    '<h2>六、模块信息</h2>',
    '<table>',
    '<tr><th style="width:20%">项目</th><th>内容</th></tr>',
    '<tr><td>当前版本</td><td>v1.77.0.0（2026-07-20）</td></tr>',
    '<tr><td>作者</td><td>止水</td></tr>',
    '<tr><td>项目主页</td><td><a href="https://gitee.com/fjcq/ZsEmuLib" target="_blank" rel="noopener">' +
    'gitee.com/fjcq/ZsEmuLib</a></td></tr>',
    '<tr><td>技术交流</td><td>QQ 群 168746446</td></tr>',
    '<tr><td>授权协议</td><td>MIT</td></tr>',
    '</table>',
    '<div class="tip"><b>下一步：</b>直接阅读 <a href="#/quickstart">快速入门</a> ' +
    '即可跑通第一个可运行示例；接口细节请到左侧“接口文档”中按程序集查阅。</div>'
  ].join('\n')
});
