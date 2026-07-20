# Changelog

## 1.2.1 — 2026-07-20

### 改进

- 图片导入改为保真策略：大图才下采样到 3840 px 工作上限，小图只做高质量格式转换，不再把 1456×720 之类的源图虚假放大后造成模糊。
- 用户自定义图片默认走运行时自动取色；`accent` / `secondary` / `highlight` 只作为显式覆盖，而不是普通导入路径的固定配色。
- 对话页从“整页洗白/压暗”改为“背景清晰 + 前景实色主题底板”：用户气泡、助手 markdown、附件卡片、状态卡、composer、侧栏和右侧环境面板各自获得主题色纯色或渐变承载面。
- 减弱 task 路由全局遮罩，让壁纸在卡片之间保持清晰氛围；文字区域靠局部实色底板凸显，不再靠文字阴影硬撑。
- 侧栏项目标题改为加粗主题底板，并为项目操作、顶部 Open in / 面板切换、环境新增等紧凑按钮补上主题色底与荧光边，避免控件压在图片上看不清。
- 将复杂背景图的前景策略从大面积实色块调整为 cinematic glass：正文、composer、顶栏、侧栏和环境面板使用半透明主题玻璃、局部模糊、细边框和柔和阴影；普通侧栏行降噪，hover / focus 用 accent 线和 glow 明确反馈。
- 增加 neo-cinematic depth：宽图任务页可进入暗玻璃模式，加入电影感暗角、环境霓虹、斜向玻璃高光和侧栏霓虹边线，避免复杂背景图皮肤退化成浅色办公面板。
- 补齐复杂背景图下的细节前景能力：composer 光标改为高对比 accent，主滚动容器恢复可见主题滚动条，`Show more` / `Show less` 保持可见 hover，Markdown 链接恢复 accent 高亮，截图/图片保留可见框架，文件编辑变更卡去除大面积浅色底，消息底部和工具区 `no-drag` 图标按钮增加最低可见底板与 hover glow。
- 增加复杂宽图性能防护：保留壁纸、暗玻璃前景和关键交互可见性，但在重复消息/卡片/面板/输入区上关闭高成本实时 `backdrop-filter`，任务页禁用 fixed background 与 blend mode，并把 renderer 的 DOM 变更刷新从近似逐帧合并为定时 debounce，目标是在相近资源消耗下完整展示皮肤且不卡顿。
- 修复 watcher 启动后可能自然退出或状态 stale 的问题：文件监听改为持久守护，启动脚本生成 state-local LaunchAgent plist，并用固定 `launchctl` job label 管理 resident injector，同时重新发现真实 bundled-node watcher PID；launchctl PID 读取改为不提前关闭输入，避免短命包装进程、starter shell 退出和 `ps | awk` 触发 SIGPIPE 噪声；页面内仍保持低频 debounce，避免一次性注入看似成功但路由切换后皮肤失守。
- 收紧 watcher PID 发现条件：必须同时匹配 Codex bundled node 路径与 injector 路径，避免诊断 shell 命令里包含 `injector.mjs --watch` 字样时被误写入 state。
- 降低常驻 watcher 的外层 CDP 扫描频率：已连接 Codex session 后改为 3 秒轮询，新 target 发现保持 1 秒级，页面内交互仍由 renderer debounce 处理，减少常开皮肤对 Renderer / GPU / WindowServer 的额外扰动。
- 将宽图 home/task 外层路由判断从全局 CSS `:has(main.main-surface...)` 改为 renderer 写入 `data-dream-route="home|task"`，降低流式对话和路由切换时的样式重算成本。

### 说明

- 视觉验收必须覆盖已有对话页的 no-reload CDP 截图；home route 验证通过不再等价于对话页前景/背景关系通过。验证截图优先输出到不含空格的路径，避免本地 Markdown 图片因路径解析退回纯文本。
- 复杂背景图发布前需要记录同一 Codex 窗口的皮肤暂停与皮肤启用资源样本；Renderer / GPU / WindowServer 相对增长超过约 30% 时，不应签收为常开皮肤。

## 1.2.0 — 2026-07-17

### 新增

- 自适应图像主题引擎：通过本地 Canvas 分析亮度、主色、视觉焦点、左右安全区和图像比例，为任意背景图生成协调的浅色/深色外观；图片不会上传到外部服务。
- 主题新增 `appearance: auto | light | dark` 与 `art.focusX/focusY`（`0..1`）、`art.safeArea: auto | left | right | center | none`、`art.taskMode: auto | ambient | banner | off` 配置；显式值优先于自动分析。
- 首页与任务页按图像比例采用不同呈现：超宽图在任务页使用横幅和纵向渐隐，普通比例图使用低噪环境背景，也可用 `taskMode=off` 关闭任务页图像。
- 内置「桥本有菜」实测精选预设与 5 套可复现的程序化抽象预设；安装后幂等播种到主题库，菜单栏或 `switch-theme-macos.sh` 可直接切换，且绝不覆盖 `custom-*` 用户主题。
- 新增中英文参考图生图指南：明确 `2560 × 1440`、Image 1/2/3 职责、裁切安全区、原创/已授权成年身份两套流程，以及“文案和小照片不烘焙进背景”的约束。

### 改进

- watcher 在文档壳层出现后立即注入，按 CSS/主题/图片内容哈希热刷新并复用静态 payload；同一主题切换不再重复启动守护进程，减少原生界面闪现和后台轮询。
- 主题切换先完整暂存图片，最后原子发布 `theme.json`；全新安装在没有活动主题时先启用通用的「午夜极光」，已有活动主题保持不变。
- `load-image-theme-macos.sh` 可通过 `--appearance`、`--focus-x`、`--focus-y`、`--safe-area`、`--task-mode` 精确调节构图；旧主题缺省时使用安全自适应值。

### 修复

- 保留 Codex 原生固定顶栏的定位与层级，避免打开任务侧边面板后开关被推出主区、导致面板无法关闭。
- 修复亮色背景图在 ChatGPT/Codex 暗色模式下错误生成浅色皮肤壳的问题。`appearance=auto` 现在跟随原生/系统外观，避免白字叠在浅色面板上导致界面不可读。
- 修复从“设置 > 外观”返回“已安排的任务”等无输入框路由后，验证器因找不到 composer 而拒绝合法 Codex 主界面的问题。
- 首页不再在原生标题栏注入主题名称和圆形伪按钮；watcher 为后续完整导航注册更早的注入并缩短目标探测间隔，以减少原生界面先闪现再换肤的时间。
- 超宽任务横幅不再让背景伪元素在固定高度直接结束；图片仍按原比例置顶，遮罩与渐隐延续到整页，减少明显的底部截断感。
- 修复普通宽屏图片被 `contain` 与 `cover` 双层重复绘制的问题；标准 16:9 现在始终使用一张 `cover` 整窗背景，并按安全区和焦点保留主体。
- 修复沉浸任务页侧栏原生缩放热区继承背景后向主区延伸 20px、形成明显竖向分割的问题；同时统一顶栏、侧栏与输入框的半透明材质，并为输入框补上不受原生边框宽度影响的内描边。
- 16:9 宽图现在在首页也使用单张整窗背景，不再把同一图片重复绘制成 hero 卡片；插件、已安排和 Pull Requests 等工具路由会清除原生整块黑底，并将搜索框和撰写器统一为单层表面。任务页同时移除独立顶栏底色和撰写器后的原生底部渐变，避免顶部、底部出现重叠面板。
- SwiftBar 菜单栏标题恢复调色板图标，并加入静态回归检查，避免升级后只剩 `Skin ON` 文本。
- 浅色模式撰写器改为更通透的珍珠白表面，并修复占位文字被原生双重透明度削弱的问题；暗色模式继续使用单层实色表面。
- 兼容 Codex Desktop 更名：官方桌面端在 26.707 从 `Codex.app` 更名为 `ChatGPT.app`（bundle id 仍是 com.openai.codex）。发现 / 启动流程现在两种名字都识别，且 `state.json` 缓存的旧 app 路径若已不存在则不再劫持启动——此前更新后会因指向旧 `Codex.app` 而启动失败
- 菜单栏与 `status-dream-skin-macos.sh` 不再依赖 `/usr/bin/python3`（macOS 12.3+ 默认不预装）读取主题名与运行状态，改用纯 shell 解析；此前在未装 Xcode 命令行工具的机器上，主题名会退化成 id、`--json` 状态直接失效

### 安全

- CDP 端点必须由已验证的官方 Codex 可执行文件或其子进程监听；WebSocket 还会校验 loopback、page ID、路径、无重定向，并安全处理畸形消息和发送异常。
- 主题配置与图片使用真实路径 containment，拒绝 symlink 越界、空文件、超过 16 MB、单边超过 16384 px 或超过 50 MP 的图片；主题展示文本拒绝换行和控制字符。
- AppleScript 动态内容全部通过 argv 传递；SwiftBar 过滤主题 ID、文件名和菜单文本，避免主题元数据改变菜单属性或命令参数。
- `config.toml` 只按严格 UTF-8 读取，拒绝 NUL、歧义多行 TOML、重复 `[desktop]`，通过用户级锁、原始字节核验和同目录原子替换保护中文配置与并发写入。
- 暂停和恢复会在 TERM/KILL 前后核验 watcher 的 PID、启动时间、Node 和 injector 路径；不匹配的进程绝不结束，已确认 watcher 若无法停止则保留 state 并中止，不再报告假成功。

### 测试

- 覆盖每套预设的可注入性与播种幂等、首页/任务 renderer、早期注入、主题原子切换、中文与 CRLF/BOM 配置往返、非法 UTF-8/NUL/TOML 拒绝、路径穿越、symlink 越界、控制字符和像素炸弹。

### 说明

- 「桥本有菜」源图、标准化背景和浅/暗实机截图分别归档；截图只作预览，不能当背景导入。用户提供的图像不自动获得 MIT 素材许可，公开再分发前仍需确认相应权利。

---

## 1.1.2 — 2026-07-16

### 修复

- 修正内置主题引用了未随仓库发布的背景文件，恢复使用 bundled abstract demo 素材
- 更新主题配置往返测试：安装只备份外观键，不再错误断言强制切换深色模式
- 恢复原本没有 `[desktop]` 配置段的用户设置时，不再额外写入空段
- 热切换读取运行状态时复用 Codex 内置 Node.js，不再依赖系统 `python3` 或执行 `eval`
- 显式传入的 `--theme-dir` 缺少 `theme.json` 时立即报错，不再静默回退到内置 demo 主题

---

## 1.1.1 — 2026-07-16

### 修复

- 不再用 `launchctl submit` 托管带调试口的 Codex：退出 SwiftBar / 关掉 Codex 后不应再被 launchd 自动拉起
- 暂停与完全恢复时清理 `com.openai.codex-dream-skin-studio.app` 作业

---

## 1.1.0 — 2026-07-16

### 新增

- SwiftBar 菜单栏入口（`Install Menu Bar.command`）：应用 / 暂停 / 换图 / 切换已保存主题 / 从图片文件夹加载 / 完全恢复
- 主题库（`themes/`）与图片投放目录（`images/`）动态加载，不再把 README 图库合成图当背景素材
- 按 Codex 应用浅色 / 深色自动切换皮肤壳（`data-dream-shell`）

### 改进

- CDP 已就绪时热切换主题（重启 injector + 短时注入），换图更快
- 注入校验放宽（项目选择器等可选），避免误杀已生效皮肤
- 注入守护优先 `nohup`；暂停状态与路径大小写下停止逻辑更稳
- 安装时不再强制 `appearanceTheme=dark`，只备份桌面外观相关键，便于恢复与自动适配

### 视觉

- 以原版暗色 portal CSS 为结构底，叠加 light 壳与更薄横幅遮罩，减轻「换图看不清」
- 示例纯横幅：`docs/images/banner-arina-hashimoto-pure-no-ui.png`（无人机 UI 合成）

### 说明

- `docs/images/gallery/` 仅为效果预览，不要当 `theme` 背景导入

---

## 1.0.0 — 2026-07-15

- 发布 macOS 通用主题制作器，而不是固定角色皮肤。
- 加入 Finder 选图、自动 JPEG 转换、主题命名和高级配色参数。
- 主页使用独立横幅，任务页使用背景与磨砂层，完整保留原生交互。
- 改为复用并验证 Codex 官方签名 Node.js，不再附带大型运行时或依赖全局 Node。
- 增加独立安装目录、桌面启动/定制/验证/恢复入口。
- 增加官方签名、CDP 端口归属、PID 身份、刷新重注入和真实 DOM 自检。
- 增加原子配置备份、精确恢复、静态测试、安装恢复循环和发布打包脚本。
- 清理固定角色内部命名；传送门主题仅作为可替换示例素材。
- 开源树：示例横幅改为无角色抽象几何图；验收截图不入库；补充 NOTICE / README 商标与安全边界说明。
