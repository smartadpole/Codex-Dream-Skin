import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const macosRoot = path.resolve(here, "..");
const template = await fs.readFile(path.join(macosRoot, "assets", "renderer-inject.js"), "utf8");
const css = await fs.readFile(path.join(macosRoot, "assets", "dream-skin.css"), "utf8");
const injectorScript = await fs.readFile(path.join(macosRoot, "scripts", "injector.mjs"), "utf8");
const commonScript = await fs.readFile(path.join(macosRoot, "scripts", "common-macos.sh"), "utf8");

assert.doesNotMatch(
  css,
  /main\.main-surface\s*>\s*header\.app-header-tint\s*\{[^}]*\b(?:position|z-index)\s*:/,
  "The skin must preserve Codex's native fixed header so the side-panel toggle remains reachable.",
);
assert.doesNotMatch(
  css,
  /main\.main-surface:not\(\.dream-skin-home-shell\)\s*>\s*\*\s*\{[^}]*\bposition\s*:/,
  "Task-route child layering must not overwrite the native header position.",
);

assert.doesNotMatch(
  css,
  /background-image:\s*var\(--dream-skin-art\),\s*var\(--dream-skin-art\)/,
  "The home hero must not stack duplicate copies of the selected image.",
);
assert.match(
  css,
  /data-dream-art-safe="left"[\s\S]{0,140}--ds-art-position:\s*100% var\(--ds-focus-y\);/,
  "A left text-safe image must preserve its right-side subject on narrower windows.",
);
assert.doesNotMatch(
  css,
  /background-size:\s*auto 100% !important;/,
  "Wide home artwork must not leave an unpainted half-card by fitting only to height.",
);
assert.doesNotMatch(
  css,
  /background-size:\s*100% 100%,\s*100% 100%,\s*100% auto;/,
  "Wide task artwork must cover the full route instead of ending above the composer.",
);
assert.match(
  css,
  /data-dream-art-task-mode="ambient"[\s\S]{0,500}body\s*\{[\s\S]{0,500}background-image:\s*var\(--dream-skin-art\) !important;[\s\S]{0,200}background-size:\s*cover !important;/,
  "Wide ambient task artwork should cover the full application window.",
);
assert.match(
  css,
  /data-dream-task-mode="banner"[\s\S]{0,900}body\s*\{[\s\S]{0,500}background-image:\s*var\(--dream-skin-art\) !important;[\s\S]{0,200}background-size:\s*cover !important;/,
  "Wide banner task artwork should use the same full-window wallpaper contract as ambient routes.",
);
assert.match(
  css,
  /data-dream-art-wide="true"\]\[data-dream-route="home"\]\s+body\s*\{[\s\S]{0,700}background-image:\s*var\(--dream-skin-art\) !important;/,
  "Wide home artwork should use the same full-window image as utility routes.",
);
assert.match(
  css,
  /data-dream-art-wide="true"\]\[data-dream-route="home"\]\s+body\s*\{[\s\S]{0,700}background-position:\s*var\(--ds-art-position\) !important;/,
  "Wide home artwork must honor the configured focal point instead of forcing a centered crop.",
);
assert.match(
  css,
  /data-dream-art-task-mode="ambient"[\s\S]{0,260}data-dream-art-wide="true"\]\[data-dream-route="task"\]\s+body\s*\{[\s\S]{0,260}background-position:\s*var\(--ds-art-position\) !important;/,
  "Wide task artwork must retain the same focal point as the home route.",
);
assert.match(
  template,
  /setAttribute\(root,\s*"data-dream-route",\s*home \? "home" : "task"\);/,
  "Renderer should publish route state so CSS does not need global route :has selectors.",
);
assert.ok(
  template.includes('const cssClassSelector = (className) => `.${globalThis.CSS?.escape?.(className) || className.replace(/\\//g, "\\\\/")}`;'),
  "Renderer should build slash-bearing class selectors with CSS.escape instead of hand-written querySelector literals.",
);
assert.ok(
  template.includes('candidate.querySelector(cssClassSelector("group/home-suggestions"))') &&
    template.includes('candidate.querySelector(cssClassSelector("group/project-selector"))'),
  "Renderer should identify the home route even when the current Codex build omits home suggestion cards.",
);
assert.doesNotMatch(
  template,
  /querySelector\('\.group\\*\/home-suggestions'\)/,
  "Renderer must not hand-write group/home-suggestions selector literals.",
);
assert.ok(
  injectorScript.includes("const cssClassSelector = (className) => \\`.\\${CSS.escape(className)}\\`;") &&
    injectorScript.includes("document.querySelector(cssClassSelector('group/home-suggestions'))") &&
    injectorScript.includes("document.querySelector(cssClassSelector('group/project-selector'))"),
  "Injector verification should build slash-bearing class selectors with CSS.escape.",
);
assert.doesNotMatch(
  injectorScript,
  /querySelector\('\.group\\*\/home-suggestions'\)/,
  "Injector verification must not hand-write group/home-suggestions selector literals.",
);
assert.match(
  css,
  /data-dream-art-wide="true"\]\s+\.composer-surface-chrome\s*\{[\s\S]{0,180}border:\s*1px solid rgb\(var\(--ds-neon-rgb\) \/ \.32\) !important;[\s\S]{0,420}backdrop-filter:\s*var\(--ds-readable-filter\) !important;/,
  "Wide artwork should use one uniform, readable cinematic glass composer surface.",
);
assert.match(
  css,
  /data-dream-art-wide="true"\]\s*\{[\s\S]{0,120}--ds-readable-filter:\s*none !important;/,
  "Wide complex-image skins should default to a low-compositor-cost glass surface.",
);
assert.match(
  css,
  /--ds-message-gradient:\s*linear-gradient\(135deg,[\s\S]{0,220}rgb\(var\(--ds-panel-rgb\) \/ \.42\)/,
  "Task messages must use a lighter dedicated glass layer instead of the general readable surface.",
);
assert.doesNotMatch(
  css,
  /data-dream-route="task"[\s\S]{0,260}background:\s*rgb\(var\(--ds-panel-rgb\) \/ \.88\) !important;/,
  "Task-route messages must not regress to an opaque dark panel.",
);
assert.match(
  css,
  /--ds-link:\s*#ffebb3 !important;/,
  "Wide artwork links should be visibly distinct from ordinary message text.",
);
assert.match(
  css,
  /background-size:\s*100% 48%,\s*100% 2px !important;/,
  "Inline links should keep a visible underline/highlight in their resting state.",
);
assert.match(
  css,
  /--ds-selection-bg-rgb:\s*255 212 105 !important;[\s\S]{0,140}--ds-selection-text-rgb:\s*6 10 14 !important;[\s\S]{0,80}--ds-selection-alpha:\s*\.88 !important;/,
  "Wide artwork text selection should use a deliberate inverse warm marker instead of native blue.",
);
assert.match(
  css,
  /html\.codex-dream-skin ::selection,[\s\S]{0,360}background-color:\s*rgb\(var\(--ds-selection-bg-rgb\) \/ var\(--ds-selection-alpha, \.86\)\) !important;[\s\S]{0,80}text-shadow:\s*none !important;/,
  "Global selection styling must override native selection color and remove text shadow.",
);
assert.match(
  css,
  /data-dream-art-wide="true"\] \.main-surface:not\(\.dream-skin-home-shell\)[\s\S]{0,220}::selection,[\s\S]{0,360}-webkit-text-fill-color:\s*rgb\(var\(--ds-selection-text-rgb\) \/ 1\) !important;[\s\S]{0,180}text-shadow:\s*none !important;/,
  "Wide task markdown, code, and composer selections must render as true inverse text.",
);
assert.match(
  css,
  /\.dream-skin-pointer-focus\s*\{[\s\S]{0,900}radial-gradient\(circle 170px at var\(--ds-pointer-x, 50vw\) var\(--ds-pointer-y, 50vh\)[\s\S]{0,900}will-change:\s*background, opacity;/,
  "Pointer focus should be a single fixed radial light field driven by CSS variables.",
);
assert.match(
  css,
  /data-dream-pointer="active"\] \.dream-skin-pointer-focus\s*\{[\s\S]{0,80}opacity:\s*1;/,
  "Pointer focus must remain idle until the mouse enters the window.",
);
assert.match(
  css,
  /data-dream-route="task"\] \.dream-skin-pointer-focus\s*\{[\s\S]{0,500}radial-gradient\(circle 150px at var\(--ds-pointer-x, 50vw\) var\(--ds-pointer-y, 50vh\)/,
  "Task routes should use the restrained pointer focus profile.",
);
assert.match(
  css,
  /\.dream-skin-panel-focus\s*\{[\s\S]{0,1800}left:\s*var\(--ds-panel-focus-x, -9999px\);[\s\S]{0,1800}will-change:\s*left, top, width, height, opacity;/,
  "Hovered panels should use a single fixed focus frame driven by CSS variables.",
);
assert.match(
  css,
  /data-dream-panel-focus="active"\] \.dream-skin-panel-focus\s*\{[\s\S]{0,80}opacity:\s*1;/,
  "Panel focus must stay idle until the pointer enters a focusable block.",
);
assert.match(
  css,
  /data-dream-route="task"\] \.dream-skin-panel-focus\s*\{[\s\S]{0,500}0 0 32px rgb\(var\(--ds-link-rgb\) \/ \.22\)/,
  "Task panel focus should use a restrained but visible focus glow.",
);
const performanceGuardIndex = css.indexOf("/* Performance guard for complex full-window art.");
const bodyAttachmentGuardIndex = css.indexOf(
  'html.codex-dream-skin[data-dream-art-wide="true"] body,',
  performanceGuardIndex,
);
const bodyAttachmentScrollIndex = css.indexOf(
  "background-attachment: scroll !important;",
  bodyAttachmentGuardIndex,
);
assert.ok(
  performanceGuardIndex >= 0 &&
    bodyAttachmentGuardIndex > performanceGuardIndex &&
    bodyAttachmentScrollIndex > bodyAttachmentGuardIndex &&
    bodyAttachmentScrollIndex - bodyAttachmentGuardIndex < 1200,
  "Wide task wallpaper must avoid fixed background repaint costs.",
);
assert.match(
  css,
  /\.app-shell-left-panel \[class\*="group\/folder-row"\]\[aria-label\],[\s\S]{0,1600}backdrop-filter:\s*none !important;/,
  "Wide complex-image skins should keep sidebar project rows off live backdrop filters.",
);
assert.match(
  css,
  /\.main-surface button\[class\*="cursor-interaction"\],[\s\S]{0,900}backdrop-filter:\s*none !important;/,
  "Wide complex-image skins should keep high-frequency action buttons off live backdrop filters.",
);
assert.match(
  css,
  /\.main-surface:not\(\.dream-skin-home-shell\)::after\s*\{[\s\S]{0,80}mix-blend-mode:\s*normal !important;/,
  "Wide task vignette must avoid compositor-heavy blend modes.",
);
assert.match(
  template,
  /const delay = layout \? 160 : 240;[\s\S]{0,80}scheduler\.timeout = setTimeout\(flushScheduledEnsure, delay\);/,
  "Renderer ensure passes should be timer-debounced instead of rAF-frequency during streaming.",
);
assert.match(
  template,
  /setInterval\(\(\) => ensure\(\), 15000\)/,
  "The safety ensure interval should stay low frequency for performance.",
);
assert.match(
  template,
  /const observer = new MutationObserver\(\(records\) => \{[\s\S]{0,180}mutationsTouchRouteState\(records\)[\s\S]{0,120}scheduleScrollBottomSync\(\)/,
  "Streaming message mutations should avoid a full route/sidebar sync when only the thread body changes.",
);
assert.doesNotMatch(
  template,
  /if \(!item\.querySelector\('\[class~="bg-token-list-hover-background"\]'\)\) return false;/,
  "New-chat routing must not infer the current thread from transient native hover classes.",
);
assert.match(
  template,
  /const sidebarProjectFromEvent = \(event\) => \{[\s\S]{0,360}Start new chat in[\s\S]{0,160}return project && action \? project : null;/,
  "Starting a new chat from a project should mark the project row, not a stale conversation.",
);
assert.match(
  template,
  /const isSidebarProjectItem = \(item\) => Boolean\(item\?\.matches\?\.\('\[role="listitem"\]'\)[\s\S]{0,160}item\.querySelector\?\.\('\[class\*="group\/folder-row"\]'\)\);/,
  "Sidebar project containers must be detected separately from leaf thread rows.",
);
assert.match(
  template,
  /const isSidebarThreadItem = \(item\) => \{[\s\S]{0,240}if \(isSidebarProjectItem\(item\)\) return false;/,
  "Current-thread sync must never mark an entire project container as the active thread.",
);
assert.match(
  template,
  /const sidebarProjectItemForThread = \(threadItem\) => \{[\s\S]{0,360}isSidebarProjectItem\(node\)/,
  "Leaf thread rows should still resolve their owning project for project-title highlighting.",
);
assert.match(
  injectorScript,
  /watchFs\(directory,\s*\{\s*persistent:\s*true\s*\}/,
  "The watcher must stay resident after startup so route changes and hot reloads remain covered.",
);
assert.match(
  commonScript,
  /launchctl bootstrap "gui\/\$\(\/usr\/bin\/id -u\)" "\$INJECTOR_PLIST"/,
  "The watcher must be managed outside the starter shell so it remains alive after startup.",
);
assert.match(
  commonScript,
  /const args = \[nodePath, injectorPath, "--watch", "--port", port, "--theme-dir", themeDir\]/,
  "The generated LaunchAgent must launch the injector watcher with explicit tokenized arguments.",
);
assert.match(
  commonScript,
  /index\(\$0, node\)[\s\S]{0,180}index\(\$0, inj\)[\s\S]{0,180}index\(\$0, "--watch"\)[\s\S]{0,180}index\(\$0, "--port " port " --theme-dir "\)/,
  "Watcher state must be written from the real node/injector/port process, not a wrapper PID.",
);
assert.match(
  commonScript,
  /pid=\$3; found=1 \} END \{ if \(found\) print pid \}/,
  "launchctl PID discovery must not close its input early under pipefail.",
);
assert.match(
  injectorScript,
  /const pollDelay = sessions\.size \? 3000 : \(targets\.length \? 1000 : 500\);/,
  "The outer watcher should not poll CDP at sub-second cadence once a Codex session is active.",
);
assert.match(
  css,
  /--ds-immersive-composer-solid:\s*rgb\(var\(--ds-panel-rgb\) \/ \.74\);/,
  "The light composer should retain enough transparency to reveal the selected artwork.",
);
assert.match(
  css,
  /data-dream-shell="light"\]\[data-dream-art-wide="true"\][\s\S]{0,100}\.composer-surface-chrome\s*\{[\s\S]{0,400}backdrop-filter:\s*blur\(8px\) saturate\(102%\) !important;/,
  "The translucent light composer should softly separate text from detailed artwork.",
);
assert.match(
  template,
  /\[class\*="_homeUtilityBar_"\][\s\S]{0,500}dream-skin-home-utility/,
  "The renderer should give the current native home utility bar a stable theme class.",
);
assert.match(
  css,
  /\.dream-skin-home:has\(\.dream-skin-home-utility\)[\s\S]{0,120}\.composer-surface-chrome\s*\{[\s\S]{0,180}border-radius:\s*0 0 22px 22px !important;/,
  "The home utility bar and composer should render as one continuous control.",
);
assert.match(
  css,
  /\.composer-surface-chrome button:not\(\[class~="bg-token-foreground"\]\)[\s\S]{0,100}color:\s*var\(--ds-muted\) !important;/,
  "Composer controls must remain readable when Codex native tokens lag behind a forced dark appearance.",
);
assert.match(
  css,
  /\.composer-surface-chrome[\s\S]{0,160}:is\(\.ProseMirror, \[contenteditable="true"\], textarea, input\)[\s\S]{0,120}caret-color:\s*rgb\(var\(--ds-caret-rgb, var\(--ds-neon-rgb\)\) \/ 1\) !important;/,
  "Composer inputs must use an explicit high-contrast caret over image skins.",
);
assert.match(
  css,
  /\.composer-surface-chrome button:not\(\[class~="bg-token-foreground"\]\) \*\s*\{[\s\S]{0,80}color:\s*currentColor !important;/,
  "Nested labels inside composer controls must inherit the corrected theme color.",
);
assert.match(
  css,
  /\.composer-surface-chrome p\.placeholder::after\s*\{[\s\S]{0,120}color:\s*rgb\(var\(--ds-text-rgb\) \/ \.74\) !important;[\s\S]{0,80}opacity:\s*1 !important;/,
  "Composer placeholder text must not inherit a stale native color with double opacity.",
);
assert.match(
  css,
  /\.thread-scroll-container\s*\{[\s\S]{0,120}--thread-scroll-padding-bottom:\s*220px !important;/,
  "Task routes must reserve bottom scroll padding so the composer does not cover the last response.",
);
assert.match(
  css,
  /data-dream-art-wide="true"\]\[data-dream-route="task"\][\s\S]{0,120}\.thread-scroll-container\s*\{[\s\S]{0,80}scroll-padding-bottom:\s*220px !important;/,
  "The scroll container must expose a computed bottom scroll padding, not just a CSS variable.",
);
assert.match(
  css,
  /> div > \[class\*="pb-8"\]\s*\{[\s\S]{0,80}padding-bottom:\s*220px !important;/,
  "The thread content column must keep a real bottom spacer behind the sticky composer.",
);
assert.match(
  css,
  /data-dream-art-wide="true"\]\[data-dream-route="task"\][\s\S]{0,140}\.composer-surface-chrome\s*\{[\s\S]{0,160}border:\s*1px solid rgb\(var\(--ds-neon-rgb\) \/ \.34\) !important;[\s\S]{0,260}background-image:\s*var\(--ds-glass-sheen\), var\(--ds-composer-gradient,/,
  "Task composer final override must keep the input surface readable above complex artwork.",
);
assert.match(
  css,
  /\.thread-scroll-container \.composer-surface-chrome\[class\*="bg-token-input-background"\]\s*\{[\s\S]{0,260}rgb\(var\(--ds-panel-rgb\) \/ \.84\),[\s\S]{0,120}rgb\(var\(--ds-panel-2-rgb\) \/ \.72\)/,
  "Task composer must include a hard readable gradient when native input tokens win over variables.",
);
assert.match(
  css,
  /header\.app-header-tint\s*\{[\s\S]{0,180}background:\s*transparent !important;/,
  "Wide artwork should not paint a separate opaque header band.",
);
assert.match(
  css,
  /\.thread-scroll-container \.bg-gradient-to-t\.from-token-main-surface-primary\s*\{[\s\S]{0,100}background:\s*transparent !important;/,
  "Wide artwork should remove the native opaque fade behind the sticky composer.",
);
assert.match(
  css,
  /\.thread-scroll-container[\s\S]{0,180}scrollbar-color:\s*var\(--ds-scrollbar-thumb\) var\(--ds-scrollbar-track\) !important;/,
  "Thread scroll containers must expose a visible themed scrollbar.",
);
assert.doesNotMatch(
  css,
  /:is\([^)]*\.app-shell-left-panel \[class\*="overflow-y-auto"\][^)]*\)[\s\S]{0,120}scrollbar-color:\s*var\(--ds-scrollbar-thumb\)/,
  "Sidebar project lists must not inherit the prominent themed content scrollbar.",
);
assert.match(
  css,
  /\.app-shell-left-panel \[class\*="overflow-y-auto"\][\s\S]{0,120}scrollbar-width:\s*none !important;/,
  "Sidebar project lists should hide their scrollbar while preserving native scrolling.",
);
assert.match(
  css,
  /button\[aria-label="Show less"\][\s\S]{0,620}div\[class~="py-1"\] > button\[class~="no-drag"\][\s\S]{0,180}opacity:\s*1 !important;/,
  "Sidebar Show more/Show less controls must remain visible instead of inheriting placeholder opacity.",
);
assert.match(
  css,
  /button\[class~="no-drag"\]\[class\*="!text-token-input-placeholder-foreground"\][\s\S]{0,160}-webkit-text-fill-color:\s*var\(--ds-text\) !important;[\s\S]{0,80}opacity:\s*1 !important;/,
  "Sidebar fold controls must override Codex's forced placeholder text class.",
);
assert.match(
  css,
  /:is\(button\.no-drag, button\[class~="no-drag"\], \[role="button"\]\[class~="no-drag"\], button\[aria-label="Scroll to bottom"\]\)[\s\S]{0,260}background:\s*var\(--ds-control-solid\) !important;[\s\S]{0,120}color:\s*var\(--ds-text\) !important;/,
  "Native no-drag buttons, including message actions, must keep a visible fill and icon color.",
);
assert.match(
  css,
  /\.app-shell-left-panel[\s\S]{0,180}:is\(button\.no-drag, button\[class~="no-drag"\], \[role="button"\]\[class~="no-drag"\]\):not\(\[class\*="group\/folder-row"\]\)[\s\S]{0,240}background:\s*transparent !important;[\s\S]{0,120}box-shadow:\s*none !important;/,
  "Sidebar no-drag icon buttons should stay quiet until hover or focus.",
);
assert.match(
  css,
  /\.dream-skin-current-project \[class\*="group\/folder-row"\]\[aria-label\][\s\S]{0,220}border-color:\s*rgb\(var\(--ds-neon-rgb\) \/ \.36\) !important;/,
  "The current project title should be visible without becoming a warning-style block.",
);
assert.doesNotMatch(
  css,
  /\.dream-skin-current-thread\s+:is\(span,\s*div,\s*p,\s*svg\)[\s\S]{0,180}opacity:\s*1 !important;/,
  "Current thread styling must not force action-rail wrapper divs visible before hover.",
);
assert.doesNotMatch(
  css,
  /\.app-shell-left-panel[\s\S]{0,180}:is\(button\.no-drag, button\[class~="no-drag"\], \[role="button"\]\[class~="no-drag"\]\):not\(\[class\*="group\/folder-row"\]\)[\s\S]{0,240}background:\s*rgb\(var\(--ds-panel-rgb\) \/ \.46\) !important;[\s\S]{0,80}color:\s*var\(--ds-accent\) !important;/,
  "Sidebar no-drag icon buttons must not render as pre-hover highlighted controls.",
);
assert.match(
  css,
  /data-dream-route="task"[\s\S]{0,320}\.thread-scroll-container \.group\.flex\.min-w-0\.flex-col:hover\s*\{[\s\S]{0,420}border-color:\s*rgb\(var\(--ds-neon-rgb\) \/ \.48\) !important;[\s\S]{0,520}0 0 18px rgb\(var\(--ds-neon-rgb\) \/ \.14\) !important;/,
  "Task message hover should use a cheap direct selector with a readable highlight.",
);
assert.doesNotMatch(
  css,
  /:has\(> \[class\*="_markdownContent"\]\):hover/,
  "Task message hover must not use structural :has matching on streamed message nodes.",
);
assert.match(
  css,
  /button\[aria-label="Scroll to bottom"\][\s\S]{0,160}background:\s*var\(--ds-control-solid\) !important;/,
  "The floating scroll-to-bottom button must use the themed button surface.",
);
assert.match(
  css,
  /:is\(a\[href\], \[role="link"\],[\s\S]{0,1400}color:\s*var\(--ds-link\) !important;[\s\S]{0,320}text-decoration-line:\s*none !important;[\s\S]{0,520}background-size:\s*100% 48%, 100% 2px !important;[\s\S]{0,360}text-shadow:[\s\S]{0,160}rgb\(var\(--ds-link-rgb\) \/ \.18\) !important;/,
  "Markdown links should use a visible resting marker and readable glow without becoming a hover-selected block.",
);
assert.match(
  css,
  /:is\(a\[href\], \[role="link"\],[\s\S]{0,2200}:hover[\s\S]{0,220}color:\s*var\(--ds-link-hover\) !important;[\s\S]{0,320}linear-gradient\(135deg,[\s\S]{0,620}text-shadow:\s*none !important;/,
  "Markdown link hover should keep text readable with a filled marker surface and no glow blur.",
);
assert.match(
  css,
  /:is\(img, picture, video, canvas\)[\s\S]{0,180}max-width:\s*min\(100%, 760px\) !important;[\s\S]{0,220}border:\s*1px solid var\(--ds-readable-border\) !important;/,
  "Rendered screenshots/images should remain visible as framed media.",
);
assert.match(
  css,
  /\[class\*="bg-token-main-surface-secondary"\][\s\S]{0,700}background-image:\s*var\(--ds-glass-sheen\), var\(--ds-readable-gradient\) !important;/,
  "Edited-file and attachment cards should inherit the dark glass surface instead of pale native slabs.",
);
assert.match(
  css,
  /\[class\*="bg-token-main-surface-primary"\],[\s\S]{0,180}\[class\*="bg-token-input-background"\]\):has\(button\)[\s\S]{0,260}background-image:\s*var\(--ds-glass-sheen\), var\(--ds-readable-deep-gradient, var\(--ds-readable-gradient\)\) !important;/,
  "Attachment and input-adjacent cards should use a deeper readable glass surface.",
);
assert.match(
  css,
  /text-token-conversation-body[\s\S]{0,220}text-token-input-placeholder-foreground[\s\S]{0,260}-webkit-text-fill-color:\s*rgb\(var\(--ds-text-rgb\) \/ \.88\) !important;/,
  "Activity, command, and muted conversation tokens must stay readable on image backgrounds.",
);
assert.match(
  css,
  /\.vertical-scroll-fade-mask\s*\{[\s\S]{0,260}background-image:\s*linear-gradient\(90deg,[\s\S]{0,260}color:\s*rgb\(var\(--ds-text-rgb\) \/ \.88\) !important;/,
  "Running command summaries should render on a visible command surface.",
);
assert.match(
  css,
  /div\.sticky:has\(input\[type="text"\]\)[\s\S]{0,100}background:\s*transparent !important;/,
  "Search routes should not retain the native opaque sticky band.",
);
assert.match(
  css,
  /\[class~="bg-token-main-surface-primary"\]\[class~="h-full"\]\[class~="w-full"\][\s\S]{0,100}background:\s*transparent !important;/,
  "Full-size utility route wrappers should not hide the selected artwork.",
);
assert.match(
  css,
  /\[class~="relative"\]\[class~="flex"\]\[class~="max-h-full"\]\[class~="min-h-0"\]\[class~="flex-col"\]\[class~="overflow-hidden"\]\[class\*="bg-token-dropdown-background"\][\s\S]{0,220}border-radius:\s*18px !important;[\s\S]{0,520}background-image:\s*linear-gradient\(/,
  "The floating environment and side-chat panel should use one restrained dark glass surface.",
);
assert.match(
  css,
  /section > header\[class\*="bg-token-dropdown-background"\][\s\S]{0,260}background-color:\s*rgb\(var\(--ds-panel-rgb\) \/ \.18\) !important;/,
  "Floating panel section headers must not retain native white dropdown slabs.",
);
assert.match(
  css,
  /\[class~="relative"\]\[class~="flex"\]\[class~="max-h-full"\]\[class~="min-h-0"\]\[class~="flex-col"\]\[class~="overflow-hidden"\]\[class\*="bg-token-dropdown-background"\][\s\S]{0,520}:is\(\[class\*="text-token-foreground"\],[\s\S]{0,220}-webkit-text-fill-color:\s*rgb\(var\(--ds-text-rgb\) \/ \.96\) !important;/,
  "Floating panel foreground tokens must stay readable on the dark glass surface.",
);
assert.match(
  css,
  /\[class\*="text-token-git-decoration-added"[\s\S]{0,220}color:\s*var\(--ds-diff-add\) !important;[\s\S]{0,180}font-weight:\s*650 !important;/,
  "Git added counts should keep a high-contrast green treatment.",
);
assert.match(
  css,
  /\[class\*="text-token-git-decoration-deleted"[\s\S]{0,220}color:\s*var\(--ds-diff-delete\) !important;[\s\S]{0,180}font-weight:\s*650 !important;/,
  "Git deleted counts should keep a high-contrast red treatment.",
);
assert.match(
  css,
  /\[class\*="_markdown"\] :is\(thead, th\)[\s\S]{0,260}color:\s*var\(--ds-text\) !important;[\s\S]{0,160}text-shadow:\s*0 1px 2px rgb\(var\(--ds-bg-rgb\) \/ \.78\) !important;/,
  "Markdown table headers must not inherit dark native text on dark glass.",
);

function createStyleDeclaration() {
  const values = new Map();
  return {
    values,
    getPropertyValue(name) { return values.get(name) ?? ""; },
    setProperty(name, value) { values.set(name, value); },
    removeProperty(name) { values.delete(name); },
  };
}

function createClassList(initial = []) {
  const values = new Set(initial);
  return {
    values,
    add(...names) { for (const name of names) values.add(name); },
    remove(...names) { for (const name of names) values.delete(name); },
    contains(name) { return values.has(name); },
    toggle(name, enabled) {
      if (enabled) values.add(name);
      else values.delete(name);
    },
  };
}

function createFixture(theme, {
  nativeShell = "light",
  analysisFixture = null,
  analysisCache = null,
} = {}) {
  let fixtureShell = nativeShell;
  const nodes = new Map();
  const attributes = new Map();
  const bodyAttributes = new Map();
  const observers = [];
  const resizeObservers = [];
  const windowListeners = new Map();
  const timers = new Map();
  let nextTimer = 1;
  let nextBlob = 1;
  const rootStyle = createStyleDeclaration();
  const root = {
    className: nativeShell === "dark" ? "electron-dark" : "electron-light",
    classList: createClassList(),
    style: rootStyle,
    appendChild(node) {
      node.parentElement = root;
      if (node.id) nodes.set(node.id, node);
    },
    getAttribute(name) { return attributes.get(name) ?? null; },
    setAttribute(name, value) { attributes.set(name, String(value)); },
    removeAttribute(name) { attributes.delete(name); },
  };
  const body = {
    className: "",
    appendChild(node) {
      node.parentElement = body;
      if (node.id) nodes.set(node.id, node);
    },
    getAttribute(name) { return bodyAttributes.get(name) ?? null; },
    setAttribute(name, value) { bodyAttributes.set(name, String(value)); },
  };
  const shellBox = { left: 280, top: 36, width: 1000, height: 764 };
  const shellMain = {
    classList: createClassList(),
    getBoundingClientRect() {
      return { ...shellBox };
    },
  };

  const createElement = (tagName) => {
    if (tagName === "canvas" && analysisFixture) {
      return {
        width: 0,
        height: 0,
        getContext() {
          return {
            drawImage() {},
            getImageData() { return { data: analysisFixture.pixels }; },
          };
        },
      };
    }
    const childNodes = new Map();
    const element = {
      id: "",
      dataset: {},
      style: createStyleDeclaration(),
      classList: createClassList(),
      parentElement: null,
      textContent: "",
	      innerHTML: "",
	      setAttribute() {},
	      prepend(node) {
	        node.parentElement = element;
	        if (node.id) nodes.set(node.id, node);
	      },
	      querySelector(selector) {
        if (!childNodes.has(selector)) childNodes.set(selector, { textContent: "" });
        return childNodes.get(selector);
      },
      remove() { if (element.id) nodes.delete(element.id); },
    };
    return element;
  };

  const document = {
    documentElement: root,
    head: root,
    body,
    createElement,
    getElementById(id) { return nodes.get(id) ?? null; },
    querySelector(selector) {
      if (selector === "main.main-surface" || selector === "main") return shellMain;
      return null;
    },
    querySelectorAll() { return []; },
  };
  const mediaQuery = {
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  };
  const revokedUrls = [];
  const window = {
    addEventListener(type, handler) { windowListeners.set(type, handler); },
    removeEventListener(type, handler) {
      if (windowListeners.get(type) === handler) windowListeners.delete(type);
    },
    matchMedia() {
      mediaQuery.matches = fixtureShell === "dark";
      return mediaQuery;
    },
  };
  if (analysisCache) window.__CODEX_DREAM_SKIN_ANALYSIS_CACHE__ = analysisCache;
  if (analysisFixture) {
    window.Image = class {
      naturalWidth = analysisFixture.naturalWidth;
      naturalHeight = analysisFixture.naturalHeight;
      set src(_) { this.onload(); }
    };
  }
  const context = {
    window,
    document,
    MutationObserver: class {
      constructor(callback) {
        this.callback = callback;
        observers.push(this);
      }
      observe() {}
      disconnect() {}
    },
    ResizeObserver: class {
      constructor(callback) {
        this.callback = callback;
        this.target = null;
        resizeObservers.push(this);
      }
      observe(target) { this.target = target; }
      disconnect() { this.target = null; }
    },
    URL: {
      createObjectURL() { return `blob:fixture-${nextBlob++}`; },
      revokeObjectURL(value) { revokedUrls.push(value); },
    },
    Blob,
    Uint8Array,
    atob,
    getComputedStyle() {
      const skinShell = root.classList.contains("codex-dream-skin")
        ? (attributes.get("data-dream-shell") || "dark") : fixtureShell;
      return {
        colorScheme: skinShell,
        backgroundColor: fixtureShell === "dark" ? "rgb(24, 24, 27)" : "rgb(250, 250, 250)",
      };
    },
    setInterval: () => 1,
    clearInterval() {},
    setTimeout(callback, delay) {
      const id = ++nextTimer;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    cancelAnimationFrame() {},
  };
  const payloadFor = (nextTheme, cssText = ".fixture { color: blue; }") => template
    .replace("__DREAM_SKIN_CSS_JSON__", JSON.stringify(cssText))
    .replace("__DREAM_SKIN_ART_JSON__", JSON.stringify("data:image/png;base64,AA=="))
    .replace("__DREAM_SKIN_THEME_JSON__", JSON.stringify(nextTheme))
    .replace("__DREAM_SKIN_VERSION_JSON__", JSON.stringify("test"))
    .replace("__DREAM_SKIN_STYLE_REVISION_JSON__", JSON.stringify(cssText));
  const flushTimers = (maximumDelay = Infinity) => {
    const pending = [...timers.entries()].filter(([, timer]) => timer.delay <= maximumDelay);
    for (const [id, timer] of pending) {
      timers.delete(id);
      timer.callback();
    }
  };

  return {
    attributes,
    body,
    bodyAttributes,
    context,
    flushTimers,
    nodes,
    observers,
    payload: payloadFor(theme),
    payloadFor,
    revokedUrls,
    resizeObservers,
    root,
    rootStyle,
    shellBox,
    timers,
    window,
    windowListeners,
    setNativeShell(value) { fixtureShell = value; },
  };
}

const defaults = createFixture({
  id: "default-contract",
  appearance: "auto",
  art: { safeArea: "auto", taskMode: "auto" },
});
const defaultResult = vm.runInNewContext(defaults.payload, defaults.context);
assert.equal(defaultResult.installed, true);
assert.equal(defaults.attributes.get("data-dream-shell"), "light");
assert.equal(defaults.attributes.get("data-dream-art-safe-area"), "center");
assert.equal(defaults.attributes.get("data-dream-art-task-mode"), "ambient");
assert.equal(defaults.attributes.get("data-dream-art-ready"), "false");
assert.equal(defaults.rootStyle.values.get("--dream-art-position"), "50.00% 50.00%");
const defaultMetrics = defaults.window.__CODEX_DREAM_SKIN_STATE__.metrics;
assert.equal(defaultMetrics.rootPasses, 1);
assert.equal(defaultMetrics.routePasses, 1);
assert.equal(defaultMetrics.layoutReads, 1);
for (let index = 0; index < 50; index += 1) defaults.observers[0].callback([]);
assert.equal(
  defaults.window.__CODEX_DREAM_SKIN_STATE__.scheduler.timeout,
  null,
  "Thread-only or empty mutation bursts should not schedule a route ensure.",
);
const sidebarMutationNode = {
  nodeType: 1,
  closest(selector) { return selector.includes(".app-shell-left-panel") ? this : null; },
};
for (let index = 0; index < 50; index += 1) {
  defaults.observers[0].callback([{ target: sidebarMutationNode, addedNodes: [], removedNodes: [] }]);
}
assert.ok(defaults.window.__CODEX_DREAM_SKIN_STATE__.scheduler.timeout, "Sidebar mutation bursts should schedule an ensure.");
assert.equal(
  [...defaults.timers.values()].filter((timer) => timer.delay === 240).length,
  1,
  "Mutation bursts should coalesce into one scheduled ensure.",
);
defaults.flushTimers(240);
assert.equal(defaultMetrics.rootPasses, 1, "Subtree mutations must not recompute root theme tokens.");
assert.equal(defaultMetrics.routePasses, 2);
assert.equal(defaultMetrics.layoutReads, 1, "Subtree mutations must not force shell layout reads.");
assert.equal(defaults.resizeObservers.length, 1);
assert.ok(defaults.resizeObservers[0].target);
defaults.shellBox.left = 196;
defaults.shellBox.width = 1084;
defaults.resizeObservers[0].callback([]);
defaults.flushTimers(160);
assert.equal(defaultMetrics.layoutReads, 2, "Shell ResizeObserver changes must refresh chrome geometry.");
const defaultChrome = defaults.nodes.get("codex-dream-skin-chrome");
assert.equal(defaultChrome.style.values.get("left"), "196px");
assert.equal(defaultChrome.style.values.get("width"), "1084px");
assert.equal(typeof defaults.windowListeners.get("pointermove"), "function");
assert.equal(typeof defaults.windowListeners.get("pointerleave"), "function");
assert.equal(typeof defaults.windowListeners.get("pointerover"), "function");
assert.equal(typeof defaults.windowListeners.get("pointerout"), "function");
defaults.windowListeners.get("pointermove")({ clientX: 444.4, clientY: 211.6 });
assert.equal(defaults.rootStyle.values.get("--ds-pointer-x"), "444px");
assert.equal(defaults.rootStyle.values.get("--ds-pointer-y"), "212px");
assert.equal(defaults.attributes.get("data-dream-pointer"), "active");
const panelFocusNode = {
  id: "",
  closest(selector) { return selector === "#codex-dream-skin-chrome" ? null : null; },
  contains(target) { return target === panelFocusChild; },
  getBoundingClientRect() {
    defaultMetrics.layoutReads += 0;
    return { left: 318.2, top: 146.7, width: 612.5, height: 92.4 };
  },
};
const panelFocusChild = {};
defaults.windowListeners.get("pointerover")({
  target: {
    closest(selector) {
      return selector.includes(".thread-scroll-container") ? panelFocusNode : null;
    },
  },
});
assert.equal(defaults.rootStyle.values.get("--ds-panel-focus-x"), "318px");
assert.equal(defaults.rootStyle.values.get("--ds-panel-focus-y"), "147px");
assert.equal(defaults.rootStyle.values.get("--ds-panel-focus-width"), "613px");
assert.equal(defaults.rootStyle.values.get("--ds-panel-focus-height"), "92px");
assert.equal(defaults.rootStyle.values.get("--ds-panel-focus-radius"), "18px");
assert.equal(defaults.attributes.get("data-dream-panel-focus"), "active");
defaults.windowListeners.get("pointerleave")();
assert.equal(defaults.attributes.get("data-dream-pointer"), "idle");
defaults.windowListeners.get("pointerout")({ relatedTarget: null });
assert.equal(defaults.attributes.get("data-dream-panel-focus"), "idle");

// Auto appearance must continue following the native shell after the skin is
// already installed. The fixture makes the injected root color-scheme win
// whenever our class remains on <html>, so a temporary native probe is needed
// for each light → dark → light transition.
const shellFollow = createFixture({
  id: "shell-follow",
  appearance: "auto",
  art: { safeArea: "auto", taskMode: "auto" },
});
shellFollow.root.className = "";
vm.runInNewContext(shellFollow.payload, shellFollow.context);
assert.equal(shellFollow.attributes.get("data-dream-shell"), "light");
shellFollow.setNativeShell("dark");
shellFollow.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(shellFollow.attributes.get("data-dream-shell"), "dark");
shellFollow.setNativeShell("light");
shellFollow.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(shellFollow.attributes.get("data-dream-shell"), "light");

defaults.root.className = "";
defaults.body.setAttribute("data-theme", "dark");
defaults.observers[1].callback([{ type: "attributes", target: defaults.body }]);
defaults.flushTimers(240);
assert.equal(defaults.attributes.get("data-dream-shell"), "dark", "Body theme changes must apply without the fallback interval.");

const synchronousWide = createFixture({
  id: "synchronous-wide",
  appearance: "auto",
  art: { safeArea: "auto", taskMode: "auto" },
  artKey: "wide-art",
  artMetadata: {
    width: 2400,
    height: 1350,
    ratio: 2400 / 1350,
    wide: true,
    aspect: "wide",
    taskMode: "ambient",
  },
});
vm.runInNewContext(synchronousWide.payload, synchronousWide.context);
assert.equal(synchronousWide.attributes.get("data-dream-art-wide"), "true");
assert.equal(synchronousWide.attributes.get("data-dream-art-aspect"), "wide");
assert.equal(synchronousWide.attributes.get("data-dream-art-task-mode"), "ambient");
assert.equal(synchronousWide.attributes.get("data-dream-art-ready"), "false");

const cachedAnalysis = {
  width: 2400,
  height: 1350,
  ratio: 2400 / 1350,
  wide: true,
  aspect: "wide",
  taskMode: "ambient",
  safeArea: "left",
  focusX: 0.72,
  focusY: 0.48,
  accentRgb: { r: 180, g: 90, b: 110 },
};
const cached = createFixture({
  id: "cached-wide",
  appearance: "auto",
  art: { safeArea: "auto", taskMode: "auto" },
  artKey: "cached-art",
  artMetadata: synchronousWide.window.__CODEX_DREAM_SKIN_STATE__.artMetadata,
}, { analysisCache: new Map([["cached-art", cachedAnalysis]]) });
vm.runInNewContext(cached.payload, cached.context);
assert.equal(cached.attributes.get("data-dream-art-ready"), "true");
assert.equal(cached.attributes.get("data-dream-art-safe-area"), "left");
assert.equal(cached.window.__CODEX_DREAM_SKIN_STATE__.metrics.analysisCacheHits, 1);
assert.equal(cached.window.__CODEX_DREAM_SKIN_STATE__.metrics.analysisRuns, 0);

const previousWideState = synchronousWide.window.__CODEX_DREAM_SKIN_STATE__;
const stableStyle = synchronousWide.nodes.get("codex-dream-skin-style");
stableStyle.disabled = true;
vm.runInNewContext(synchronousWide.payloadFor({
  id: "switched-wide",
  appearance: "dark",
  art: { safeArea: "right", taskMode: "ambient" },
  artKey: "switched-art",
  artMetadata: {
    width: 2400,
    height: 1350,
    ratio: 2400 / 1350,
    wide: true,
    aspect: "wide",
    taskMode: "ambient",
  },
}, ".fixture { color: red; }"), synchronousWide.context);
assert.equal(synchronousWide.nodes.get("codex-dream-skin-style"), stableStyle);
assert.equal(stableStyle.disabled, false, "Re-injection must re-enable a previously disabled style tag.");
assert.equal(stableStyle.textContent, ".fixture { color: red; }");
assert.equal(stableStyle.dataset.dreamSkinVersion, "test");
assert.equal(synchronousWide.rootStyle.values.get("--dream-skin-art"), 'url("blob:fixture-2")');
assert.deepEqual(synchronousWide.revokedUrls, ["blob:fixture-1"]);
assert.equal(previousWideState.cleanup(), false, "An old async cleanup must not remove the new theme.");

const brightPixels = new Uint8ClampedArray(96 * 32 * 4);
for (let offset = 0; offset < brightPixels.length; offset += 4) {
  brightPixels[offset] = 245;
  brightPixels[offset + 1] = 224;
  brightPixels[offset + 2] = 224;
  brightPixels[offset + 3] = 255;
}
const nativeDark = createFixture({
  id: "native-dark-contract",
  appearance: "auto",
  art: { safeArea: "auto", taskMode: "auto" },
}, {
  nativeShell: "dark",
  analysisFixture: { naturalWidth: 2400, naturalHeight: 800, pixels: brightPixels },
});
vm.runInNewContext(nativeDark.payload, nativeDark.context);
await Promise.resolve();
await Promise.resolve();
nativeDark.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(nativeDark.window.__CODEX_DREAM_SKIN_STATE__.analysis.shell, "light");
assert.equal(nativeDark.attributes.get("data-dream-shell"), "dark");
assert.match(nativeDark.rootStyle.values.get("--ds-bg"), /^#[0-9a-f]{6}$/);
assert.ok(Number.parseInt(nativeDark.rootStyle.values.get("--ds-bg").slice(1), 16) < 0x303030);

const explicit = createFixture({
  id: "explicit-contract",
  appearance: "dark",
  art: { focusX: 0.15, focusY: 0.8, safeArea: "none", taskMode: "off" },
});
const explicitResult = vm.runInNewContext(explicit.payload, explicit.context);
assert.equal(explicitResult.shell, "dark");
assert.equal(explicit.attributes.get("data-dream-shell"), "dark");
assert.equal(explicit.attributes.get("data-dream-art-safe-area"), "none");
assert.equal(explicit.attributes.get("data-dream-art-safe"), "none");
assert.equal(explicit.attributes.get("data-dream-art-task-mode"), "off");
assert.equal(explicit.rootStyle.values.get("--dream-art-position"), "15.00% 80.00%");
assert.equal(explicit.window.__CODEX_DREAM_SKIN_STATE__.analysis, null);

const banner = createFixture({
  id: "banner-contract",
  appearance: "auto",
  art: { safeArea: "left", taskMode: "banner" },
  artMetadata: {
    width: 2560,
    height: 1440,
    ratio: 2560 / 1440,
    wide: true,
    aspect: "ultrawide",
    taskMode: "banner",
    safeArea: "left",
    focusX: 0.72,
    focusY: 0.44,
  },
});
vm.runInNewContext(banner.payload, banner.context);
assert.equal(banner.attributes.get("data-dream-art-wide"), "true");
assert.equal(banner.attributes.get("data-dream-art-task-mode"), "banner");
assert.equal(banner.attributes.get("data-dream-task-mode"), "banner");

assert.equal(explicit.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);
assert.equal(explicit.root.classList.contains("codex-dream-skin"), false);
assert.equal(explicit.attributes.has("data-dream-shell"), false);
assert.equal(explicit.attributes.has("data-dream-pointer"), false);
assert.equal(explicit.attributes.has("data-dream-panel-focus"), false);
assert.equal(explicit.attributes.has("data-dream-art-safe-area"), false);
assert.equal(explicit.attributes.has("data-dream-art-task-mode"), false);
assert.equal(explicit.rootStyle.values.has("--dream-art-position"), false);
assert.equal(explicit.nodes.has("codex-dream-skin-style"), false);
assert.equal(explicit.nodes.has("codex-dream-skin-chrome"), false);
assert.equal(explicit.windowListeners.has("pointermove"), false);
assert.equal(explicit.windowListeners.has("pointerleave"), false);
assert.equal(explicit.windowListeners.has("pointerover"), false);
assert.equal(explicit.windowListeners.has("pointerout"), false);
assert.deepEqual(explicit.revokedUrls, ["blob:fixture-1"]);
await Promise.resolve();
await Promise.resolve();
assert.equal(explicit.root.classList.contains("codex-dream-skin"), false);
assert.equal(explicit.nodes.has("codex-dream-skin-style"), false);
assert.equal(explicit.window.__CODEX_DREAM_SKIN_STATE__, undefined);

console.log("PASS: renderer honors adaptive art metadata, fallback, and cleanup behavior.");
