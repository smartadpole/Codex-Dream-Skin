# QA inventory

## Required user-visible behavior

1. Home route paints one continuous wallpaper across sidebar and main content, with a live native heading, the real project utility row/composer, and any native suggestion cards exposed by the current Codex version.
2. Normal tasks show the selected image clearly behind restrained gradients and
   solid or gradient live content surfaces; foreground text must not depend on a
   washed-out full-page background.
3. Sidebar, navigation, messages, approvals, project selector, attachments, composer, menus, hover, focus, and keyboard input remain native and interactive.
4. Decorative layers have `pointer-events: none`; no screenshot or raster UI is used as an overlay.
5. Route changes, renderer reloads, and ordinary refreshes reapply the current theme while the verified injector runs.
6. Official application signature and `app.asar` remain unchanged.
7. Restore removes live DOM/CSS, restores the two saved base-theme values, closes the CDP session after restart, and supports later reinstallation.

## Automated checks

- Shell and JavaScript syntax checks.
- Payload construction with bundled demo and an isolated custom theme.
- Reject unsupported theme config, unsafe image paths, invalid colors, oversized images, non-loopback WebSocket URLs, and unrecognized renderer targets.
- Exact install/restore round trip for the two TOML settings while preserving unrelated values.
- Empty `HOME` recovery.
- Official app and internal Node signature, Team ID, architecture, and version validation.
- Port collision selection and saved-port reuse.
- PID reuse protection through PID, start time, executable, script path, and command-line matching.
- Live verification after `Page.reload` returns version `1.2.0` and `pass: true`.
- Strict home verification requires a visible wallpaper composition region of at least 320×160, composer, sidebar, non-interactive decoration, and no horizontal overflow. Suggestion cards and the standalone project button are optional only when the current Codex host does not render them.

## Visual checks

- Home at normal desktop size: the subject stays clear of the text-safe area, text remains live, native cards are not clipped when present, and the merged project/composer surface does not overlap content.
- Narrower window: wallpaper cropping preserves the declared focus and safe area before essential controls are compressed.
- Task route: background remains atmospheric, messages and output panels keep high contrast, and the composer remains reachable.
- Conversation route: verify a real existing thread, not only the new-chat home
  route. User bubbles, assistant markdown, command/status cards, attachment
  cards, sidebar selection, composer, and right-side environment/summary panels
  must each sit on a readable themed surface while the wallpaper remains
  recognizable between them.
- Sidebar project headers: project names are visibly distinct from normal task
  rows through bold type, themed glass backing, and an accent line/border.
- Sidebar fold controls: `Show more` and `Show less` are both visible at rest,
  readable over the wallpaper, and gain a clear hover state.
- Header and side-panel buttons: `Open in`, secondary actions, panel toggles,
  environment add buttons, and project action/new-chat icons retain a visible
  fill or glow over the wallpaper in normal, hover, and focus states.
- Message action buttons: copy, thumbs, retry/edit, scroll-to-bottom, and other
  icon-only `no-drag` controls are visible at rest, not only after hover.
- Composer and scrolling: the typing caret is high-contrast in the editor, and
  the right-side conversation scrollbar appears with a themed thumb while
  scrolling.
- Markdown content: hyperlinks keep an accent highlight/underline, and
  screenshot/image Markdown renders as visible framed images instead of raw
  `![alt](path)` text where the renderer supports local images.
- File/edit cards: attachment groups and edited-files summaries must avoid
  broad white or pale-gray slabs; nested rows/buttons inherit dark glass,
  readable text, and themed controls.
- Cinematic glass balance: normal rows and buttons should not form a wall of
  opaque cards; foreground surfaces stay readable through translucent
  theme-tinted glass, fine borders, and local hover/focus glow while the
  wallpaper remains recognizable.
- Neo-cinematic depth: wide complex-image task pages should avoid a pale
  office-document look. The background should have controlled dark depth,
  subtle neon/environment tint, and readable dark glass foreground surfaces.
- Performance guard: with a complex wallpaper enabled, the same existing
  conversation should keep wallpaper, foreground glass, hover/focus, buttons,
  composer, scrollbar, links, images, and file/edit cards intact while Codex
  Renderer / GPU / WindowServer samples remain within about 30% of the
  no-skin baseline for the same window.
- Performance internals: repeated message/card/composer surfaces should not
  rely on live `backdrop-filter` in wide-art mode; task-route background
  attachment should not be fixed; the decorative vignette should avoid blend
  modes; mutation-driven `ensure()` refreshes should debounce instead of
  running at animation-frame cadence.
- Watcher reliability: after `start-dream-skin-macos.sh`, `status` should read
  `session=active`, the recorded watcher PID should still be alive, and route
  changes/hot reload should stay covered without relying on a one-shot inject.
  Recheck after the starter script has exited for at least 30 seconds; the live
  process must be the bundled node running `injector.mjs --watch`, not a
  launch wrapper, stale external starter, or diagnostic shell command.
- Image import: check the prepared theme image dimensions. Sources smaller than
  3840 px must not be upscaled; sources larger than 3840 px may be downscaled.
- Task side panel: open and close the native thread panel twice, resize the window, and repeat; the toggle remains visible and clickable.
- Selected image contains no fake interface controls or raster text intended to impersonate Codex.
- Inspect sidebar selection, `Show more` / `Show less`, header, wallpaper
  edges, cards, project utility row, composer buttons, composer caret,
  scrollbars, markdown links/images, message action buttons, focus outlines,
  dialogs, and menus.

## Release signoff

- Run `tests/run-tests.sh` successfully.
- Install from a clean extracted copy with no global Node.js.
- Complete install → live verify → reload verify → restore → reinstall.
- Capture a real CDP screenshot and retain the verifier JSON.
- Capture at least one no-reload CDP screenshot from an existing conversation
  page after hot reload, because the home-route verifier alone does not prove
  task-thread readability.
- Record a skin-paused resource sample and a skin-enabled resource sample from
  the same Codex window. If the skin-enabled sample exceeds the baseline by
  more than about 30% without another visible local cause, do not sign off the
  visual release.
- Confirm `codesign --verify --deep --strict` still succeeds for the official Codex app.
- Build ZIP and record SHA-256.
