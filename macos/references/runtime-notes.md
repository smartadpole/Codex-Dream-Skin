# Runtime notes

- Discover the official `com.openai.codex` bundle on every launch; do not assume an upgrade keeps the same executable internals.
- Use `Contents/Resources/cua_node/bin/node` from that bundle. Require Node.js 20+, a valid strict code signature, matching architecture, and OpenAI Team ID `2DC432GLL2` on both app and runtime.
- Do not ship a Node binary and do not depend on a globally installed `node` or `npm`.
- Launch the official executable through a per-user `launchd` job with `--remote-debugging-address=127.0.0.1` and a selected port. LaunchServices may discard Chromium flags.
- Prefer port `9341`; scan through `9441` on collision and record the selected port in state.
- Accept CDP only when the listener belongs to the discovered Codex main process or one of its legitimate descendants, the WebSocket URL is loopback-only, and an `app://` renderer exposes expected native shell markers.
- Treat loopback CDP as locally privileged but unauthenticated. Keep the themed session limited to trusted local use and close the port through a full Restore when finished.
- Poll page targets and reinject after document loads. A debounced mutation observer plus a low-frequency safety timer handles in-page route changes.
- Record injector PID, start time, executable, script path, app identity, selected port, and theme directory. Refuse to stop a PID when any required identity differs.
- Store mutable data under `~/Library/Application Support/CodexDreamSkinStudio`; keep the installed program under `~/.codex/codex-dream-skin-studio`.
- Back up and restore only `appearanceTheme` and `appearanceDarkCodeThemeId`. Leave `appearanceDarkChromeTheme` and unrelated TOML content untouched.
- Never modify, replace, unpack, repack, re-sign, or back up `app.asar`.

## Image and readability policy

- Import scripts must preserve real image detail. Downscale sources that exceed
  the 3840 px working ceiling, but never upscale smaller sources during import.
  A prepared theme image may be larger only when the source was already larger.
- Let the renderer's Canvas analysis derive accent, secondary, highlight,
  focus, safe area, and task mode by default. Passing explicit colors is an
  override for curated presets or deliberate art direction, not the default
  path for user image imports.
- Keep the full-window wallpaper clear enough to carry atmosphere. Avoid using
  global opacity, blur, or page-wide white/dark veils as the primary readability
  mechanism.
- Put readability where text actually lives: sidebar rows, task headers,
  user bubbles, assistant markdown containers, attachment/status cards,
  summary/environment panels, project controls, and the composer should each
  receive a solid or gradient theme-colored backing.
- Treat navigation project headers and icon-only action buttons as foreground,
  not decoration. Project labels should be bold with a themed backing; compact
  buttons need an explicit fill, border, or accent glow when they sit over
  wallpaper.
- For complex image skins, prefer translucent cinematic glass over opaque
  cards. Use local blur/saturation, fine accent borders, and soft shadows to
  preserve the artwork while separating foreground text.
- If the result still feels flat, use neo-cinematic depth before increasing
  panel opacity: darker glass tokens, restrained vignettes, environmental neon,
  and accent edge lights can make the theme immersive without reducing text
  contrast.
- Hover and focus are required foreground states. Sidebar rows should include
  scoped coverage for native buttons/links, role buttons, and current
  `cursor-interaction` row classes; compact controls should gain a clearer
  border/glow on hover and focus.
- Sidebar section expanders such as `Show more` and `Show less` must remain
  visible over wallpaper. Do not let them inherit only placeholder opacity.
- Treat `no-drag` buttons inside the main surface as the minimum foreground
  button class for current Codex builds. They need scoped fill, border,
  readable icon color, and hover glow because message actions often have no
  stronger semantic class.
- Composer text inputs should set an explicit high-contrast caret color, and
  main/side scroll containers should expose themed scrollbars; both are
  foreground affordances during active work.
- Markdown semantics should survive the readability pass. Links keep an accent
  underline/glow instead of being flattened to body text, and rendered
  screenshots/images keep a framed visible surface. Verification screenshots
  should be written to a no-space path when possible so local Markdown images
  render reliably.
- Conversation routes do not always expose stable `article` or
  `data-message-author-role` markers. CSS should cover the current Codex
  markdown containers (`_markdownContent`), user bubble classes, and
  summary-panel items while keeping selectors bounded to `.main-surface` when
  possible.
- Visual acceptance for task routes is two-part: the foreground must be legible
  without text shadows fighting the image, and the background must still be
  recognizable in the spaces between native surfaces.

## Performance policy

- Treat lag after enabling a complex full-window skin as a renderer/compositor
  issue until proven otherwise. Compare the same Codex window with skin paused
  and skin enabled; include Codex Renderer, Codex GPU process, ChatGPT main
  process, and WindowServer in the readback.
- The accepted steady-state budget is no more than about 30% growth over the
  same-window no-skin baseline for foreground interaction work. Other heavy
  local services may pollute absolute CPU numbers, so record both baseline and
  skin-on samples instead of relying on a single process snapshot.
- Wide or complex art should use a performance guard: keep the wallpaper and
  dark glass surfaces, but disable live `backdrop-filter` on repeated message,
  attachment, side-panel, tooltip, and composer surfaces; avoid fixed
  background attachment and blend modes on task routes.
- Renderer mutation handling must be coalesced with timers, not scheduled at
  animation-frame frequency during streaming output. Layout-sensitive refreshes
  can be faster than ordinary mutation refreshes, but both should debounce.
- The outer watcher must stay resident while the skin is active. File watchers
  should be persistent, while target discovery and DOM refresh inside the page
  remain low-frequency/debounced; otherwise status can become stale and route
  changes may lose the skin even though a one-shot injection looked successful.
- On macOS, the watcher startup must be managed outside the starter shell so it
  remains alive after `start-dream-skin-macos.sh` exits. Write a state-local
  LaunchAgent plist, bootstrap it with one fixed `launchctl` job label, boot
  that label out before restart, and still discover/persist the real
  bundled-node
  `injector.mjs --watch --port ... --theme-dir ...` PID by exact command-line
  identity instead of trusting launch wrappers or diagnostic shell commands.
- Once a verified Codex session is attached, outer CDP discovery should run at
  multi-second cadence. Existing route/content changes are handled inside the
  renderer; keeping the outer loop below one second can turn an otherwise light
  skin into avoidable app/WindowServer/GPU churn.
- Prefer renderer-published state attributes over global CSS `:has()` for
  route-level decisions. For example, use `data-dream-route="home|task"` on
  `<html>` rather than asking CSS to repeatedly infer the current route from
  `main.main-surface`.
- Do not regain readability by increasing global overlays after a performance
  fix. Prefer static gradients, solid theme glass, borders, shadows, and hover
  glows before blur, filters, animation, or blend-mode effects.
