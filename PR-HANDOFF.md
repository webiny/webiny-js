# PR handoff review

Base branch diffed against: `origin/next` (HEAD `016c33ba03`, 0 commits behind base).

Correctness judged against the Webiny MCP server: `get_started()`,
`get_webiny_agent('website-builder-developer')`, `get_webiny_skill('webiny-website-builder')`,
`get_webiny_skill('wb-preview-url-modifier')`, `get_webiny_skill('webiny-admin-website-builder-catalog')`,
`list_webiny_skills()`.

## 1. Intent

The Website Builder editor previously showed an indefinite "Loading preview..." spinner whenever
the Next.js frontend that renders the preview iframe was not running, giving no explanation and no
way out. This change adds a connection state machine around the preview iframe that distinguishes
"nothing is listening on the preview origin" from "something answered but never completed the
`preview.ready` handshake", and replaces the spinner with an empty state that explains which
origin failed, links to setup docs, and offers to point the preview at a Webiny-hosted sample
frontend. While the preview points at that sample frontend, a persistent info banner sits under
the address bar explaining that pages render only inside the editor, with a "Disconnect" action.

## 2. File map

All files are in `packages/app-website-builder` (Admin-side WB editor). None are generated.

`src/BaseEditor/defaultConfig/Content/`

- `sampleFrontend.ts` — new. Two hardcoded constants: `SAMPLE_FRONTEND_DOMAIN`
  (`https://wb-demo.webiny.com`) and `FRONTEND_SETUP_DOCS_URL` (`https://webiny.link/wb-frontend`).
- `SampleFrontendBanner.tsx` — new. Renders an `Alert` (info/subtle) with "Learn more" and
  "Disconnect" actions when the effective preview domain equals `SAMPLE_FRONTEND_DOMAIN`; returns
  `null` otherwise. Wrapped in `data-affects-preview="height"` so `useReservedUISpace` subtracts it
  from the iframe height.
- `ContentPreviewConfig.tsx` — registers the banner as a Content element named
  `sampleFrontendBanner`, `after="addressBar"`. Mechanical, three lines.

`src/BaseEditor/defaultConfig/Content/Preview/`

- `usePreviewConnection.ts` — new. The state machine:
  `connecting | connected | unreachable | unresponsive`. Probes the preview origin with a `no-cors`
  `HEAD` fetch for a fast "nothing is listening" signal, falls back to a 15s handshake timeout for
  "unresponsive", and while `unreachable` polls the origin every 4s, firing
  `Commands.RefreshPreview` as soon as it answers. Exposes `retry()`.
- `PreviewFrame.tsx` — new. Wraps `Iframe`, owns the per-page-load `connected` flag, forwards
  `onConnected` to `PreviewEvents`, and turns an error status into the overlay element.
- `NoFrontendConnected.tsx` — new. The overlay: `EmptyState type="layout"` with per-status copy,
  three buttons (docs, load sample frontend, try again) and a footnote about the sample frontend's
  limits. Hides the "load sample" button when the sample domain is already active.
- `Iframe.tsx` — adds an optional `overlay` prop rendered in place of `OverlayLoader`. The iframe
  stays mounted underneath so a late handshake still resolves.
- `Preview.tsx` — swaps `Iframe` for `PreviewFrame`, drops the local `onConnected` callback in
  favour of passing `previewEvents` down, and adds `key={`${url}|${iframeTimestamp}`}` so the
  connection state is recreated on every page load.

## 3. Decisions taken

- Connection health is inferred from two independent signals rather than one: an unauthenticated
  `HEAD` probe of the origin for speed, and the existing `preview.ready` postMessage handshake as
  the authority. Neither the MCP server nor any skill describes a sanctioned way to detect frontend
  liveness, so this mechanism is invented here.
- "No frontend running" is treated as a recoverable state that self-heals: a 4s poll fires
  `Commands.RefreshPreview` on the user's behalf once the origin answers. Nothing else in the editor
  auto-executes an editor command on a timer.
- 15s handshake timeout and 4s poll interval, both hardcoded module constants, not configurable.
- The escape hatch is a Webiny-operated public host (`wb-demo.webiny.com`) hardcoded in core, with
  no DI abstraction or build parameter to override or disable it. The
  `webiny-admin-website-builder-catalog` skill lists `PreviewUrlModifier` as the only preview-related
  extension point; it lists nothing covering a fallback/sample preview host, and the MCP server has
  no guidance on this case either way.
- "Load sample frontend" writes the `webiny_wb_custom_preview_domain` localStorage key via
  `usePreviewDomain().setPreviewDomain`. `usePreviewDomain.ts:20-23` documents that override as "a
  developers-only feature"; this change promotes it to a primary end-user action, and does not use
  the existing `DeveloperMode` gate (`packages/app-admin/src/components/DeveloperMode/DeveloperMode.tsx`,
  `WEBINY_ADMIN_DEV_MODE`).
- Neither the "load sample" nor the "disconnect" action refreshes the preview itself. Both rely on
  `PreviewDomain.tsx:42-48` — a sibling component in the address bar — whose effect fires
  `Commands.RefreshPreview` whenever `previewDomain` changes. Remove or decorate away the address bar
  and the loading/box reset silently stops happening.
- The state machine lives in a hook parameterised by `connected`, with the boolean owned by
  `PreviewFrame` and the remount driven by a `key` in `Preview`, instead of resetting state inside
  the hook on url/timestamp change.
- Copy is hardcoded English in a `COPY` record keyed by error status; the "unresponsive" and
  "unreachable" descriptions are sentence fragments completed by the origin string in JSX.
- The banner is registered in `BaseEditor` default config, so it applies to every document editor
  (pages, blocks, templates, experiments), and it renders in read-only mode too.

## 4. Not done

- No tests of any kind. See section 5.
- No abstraction, build parameter, or settings field to change or disable the sample frontend host,
  and no way for a self-hosted or air-gapped customer to opt out of the offer.
- No confirmation step before repointing the preview domain at a third-party host, and no
  indication in the UI that doing so sends the document to that host.
- The banner explains the sample frontend inside the editor only. The pages list preview links
  (`usePagePreviewLink`) read the same `usePreviewDomain` value, so they silently point at
  `wb-demo.webiny.com` too, with no banner and — by the change's own copy — no rendered page.
- No re-detection after a connection is lost. Once `connected`, the hook returns early forever; a
  dev server that dies mid-session leaves a stale preview with no notice until a manual refresh.
- No backoff, cap, or visibility gating on the 4s reachability poll; it runs for as long as the
  editor sits in the `unreachable` state, including in a hidden tab, and each failed probe emits a
  console network error.
- `usePreviewDomain` triggers `getSettings.execute()` per hook instance; `SampleFrontendBanner`
  mounts on every editor load, adding one settings request per load. No deduplication.
- The overlay has no `role`/`aria-live`, and none of the new copy goes through any i18n mechanism.
- Neither the liveness of `https://wb-demo.webiny.com` nor the target of `https://webiny.link/wb-frontend`
  could be verified in this environment (no network access); both are unverified.
- No docs or changelog entry accompanies a user-visible new state and a new outbound host.
- Working tree hygiene, adjacent to this diff: `webiny.config.tsx.bac`, `lerna.json`, and untracked
  `extensions/` scratch files (including `extensions/previewUrlModifier/MyPreviewUrlModifier.ts`)
  are present and must not ride along in a commit.

## 5. Test coverage

Nothing in this change is tested. `TEST FILES TOUCHED` is empty, and codegraph reports no covering
tests for `PreviewEvents`, `AwaitIframeUrl`, `usePreviewDomain`, or `Iframe` either, so there is no
existing harness for this area to extend — `packages/app-website-builder` has jest tests only for
use cases (`src/features/pages/*.test.ts`) and pure helpers (`src/shared/PagePath.test.ts`).

Untested behaviours, by behaviour:

- The status transitions themselves: `connecting → unreachable` on a refused probe,
  `connecting → unresponsive` on timeout, the `setStatus(current => current === "connecting" ? ... )`
  guard that stops the timeout from overwriting `unreachable`, and `* → connected` on handshake.
  This is the only genuinely unit-testable piece in the change (a hook over fake timers and a
  stubbed `fetch`) and it has no test.
- That a late handshake clears an already-displayed overlay — the stated reason for keeping the
  iframe mounted behind the overlay.
- That the poll fires `Commands.RefreshPreview` exactly once when the origin comes up, and never
  fires while `unresponsive` (the guard that prevents a reload loop).
- That timers and the poll are cleared on unmount and on url change (the `disposed` flags).
- That `PreviewFrame` remounts, and connection state resets, on url or timestamp change.
- That `Iframe` prefers `overlay` over `OverlayLoader`, and still renders the loader when `overlay`
  is `null`.
- That the banner appears only for the sample domain, and that "Disconnect" actually returns the
  preview to the configured domain.
- That "Load sample frontend" is suppressed when the sample domain is already active.

## 6. Look here first

```
packages/app-website-builder/src/BaseEditor/defaultConfig/Content/Preview/NoFrontendConnected.tsx:34  [severity: high]  [confidence: high]
  Risk: `setPreviewDomain(SAMPLE_FRONTEND_DOMAIN)` repoints the preview at a Webiny-operated
    public host. From that point `ConnectEditorToPreview` builds its `Messenger` with
    targetOrigin `https://wb-demo.webiny.com` and `PreviewEvents` posts `document.set` with the
    full document JSON, then a `document.patch` per edit — so unpublished page content leaves the
    customer's origins for a third-party host. The preview URL sent to that host also carries
    `wb.tenant`, `wb.id`, `wb.referrer` (the admin origin), and anything a project's
    `PreviewUrlModifier` injected — the `wb-preview-url-modifier` skill names "signed tokens" as
    the primary use case for that hook, and the modifier runs unconditionally in `useIframeUrl`
    with no allowlist of target origins. The override is stored in localStorage under a single
    global key, so it survives reloads and applies to every tenant, every document, and the pages
    list preview links, with no banner outside the editor.
  Verify: whether shipping an outbound third-party preview host in core is acceptable without an
    opt-out (DI abstraction, build param, or settings flag), whether a project with a
    `PreviewUrlModifier` can leak a signed token to `wb-demo.webiny.com`, and whether the action
    needs a confirmation that names what gets sent. Confirm with whoever owns the demo host what it
    logs and retains.
  Source: get_webiny_skill('wb-preview-url-modifier') (modifier applies to the editor iframe,
    address-bar link and pages-list links; params are injected for every preview URL);
    get_webiny_skill('webiny-admin-website-builder-catalog') (PreviewUrlModifier is the only
    preview-related extension point listed; no abstraction exists for a fallback preview host).
    The MCP server gives no guidance on hardcoding an external origin in core — flagged on the
    multi-tenancy/data-egress rule in the review brief, not on a documented convention.
```

```
packages/app-website-builder/src/BaseEditor/defaultConfig/Content/Preview/usePreviewConnection.ts:34  [severity: high]  [confidence: medium]
  Risk: `unreachable` — the state that renders "No frontend detected" next to the
    domain-switching button above — is decided by a single `fetch(origin, { mode: "no-cors" })`
    rejection. That rejection is not specific to "nothing is listening": mixed content (an
    HTTPS-served admin probing `http://localhost:3000`, which Safari blocks outright and other
    browsers exempt only for loopback), an ad blocker or corporate proxy, a `connect-src` CSP, or a
    transient reset all reject identically. On a false negative the overlay covers a preview that
    is loading normally, and the most prominent action offered is the one that permanently
    repoints the preview at the external host in finding 1. The handshake does eventually win and
    clear the overlay, so the damage is a misleading window, not a stuck state.
  Verify: open the editor from a deployed HTTPS admin against a local `http://` dev server in
    Chrome, Safari, and Firefox, and confirm the probe agrees with reality; confirm no deployed
    admin ships a `connect-src` CSP (none found in this repo, but that is not proof for hosted
    Webiny Cloud); decide whether an action this consequential should be gated on the authoritative
    handshake failing rather than on the heuristic probe.
  Source: The `preview.ready` handshake in `ConnectEditorToPreview` is the only connection signal
    the WB architecture defines (get_webiny_skill('webiny-website-builder') — Admin iframe +
    postMessage SDK). The MCP server documents no reachability-probe mechanism, so the probe has no
    convention to be measured against; this is judged on browser fetch semantics.
```

```
packages/app-website-builder/src/BaseEditor/defaultConfig/Content/Preview/usePreviewConnection.ts:103  [severity: medium]  [confidence: high]
  Risk: The poll fires `Commands.RefreshPreview` the instant the origin accepts a connection, which
    for a just-started Next dev server is the moment the first compile begins, not the moment it can
    serve. The remount restarts the 15s handshake timeout; a first compile slower than 15s lands the
    user on "Frontend didn't connect" — the wrong diagnosis — and there is no further auto-recovery,
    because the poll is gated on `status === "unreachable"` and the status is now `unresponsive`. The
    comment at line 21 states the timeout is generous precisely because of first-compile time, which
    the auto-retry then undercuts. Each auto-retry also runs through the real command, resetting
    `loadingPreview` and clearing overlay boxes.
  Verify: start the editor with no dev server, then `yarn dev` on a cold Next cache and watch which
    state the editor settles in; check whether the poll should keep running (or the timeout restart)
    while `unresponsive`.
  Source: No MCP guidance on preview retry/backoff behaviour — judged against the change's own
    stated intent in its comments and against `Commands.RefreshPreview` semantics in
    `Preview.tsx:40-51`.
```

```
packages/app-website-builder/src/BaseEditor/defaultConfig/Content/SampleFrontendBanner.tsx:31  [severity: medium]  [confidence: high]
  Risk: The banner's visibility is decided on the *effective* preview domain
    (`normalizePreviewDomain(customDomain ?? settingsDomain)`), but "Disconnect" only clears the
    localStorage override. If the saved WB settings `previewDomain` is the sample domain (with or
    without a trailing slash), the banner shows permanently and "Disconnect" is a silent no-op —
    and `NoFrontendConnected` suppresses its "Load sample frontend" button in the same situation, so
    the user has no in-editor way out. The two components also disagree about which value they are
    comparing: `usePreviewDomain.setPreviewDomain` compares its argument against the raw settings
    state variable, not the normalized effective value the callers use for their guards, so the
    guard and the write are keyed off different strings.
  Verify: set the WB preview domain setting to `https://wb-demo.webiny.com` and confirm whether the
    banner can be dismissed; decide whether "Disconnect" should clear the override or also write
    settings, and whether the guards should share one predicate.
  Source: No MCP guidance on preview-domain precedence; judged against
    `usePreviewDomain.ts:8-23,35-48` (the documented dual-source read-time normalization) and the
    two new callers' guards.
```

```
packages/app-website-builder/src/BaseEditor/defaultConfig/Content/Preview/Preview.tsx:93  [severity: medium]  [confidence: low]
  Risk: `key={`${url}|${iframeTimestamp}`}` makes the whole connection lifecycle restart whenever
    the url string changes. `useIframeUrl` regenerates the url through the project's
    `PreviewUrlModifier` on every `[baseUrl, modifier]` change, and `usePreviewUrlModifier` resolves
    from the container on each render. A modifier that produces a different string each call (a
    nonce, a timestamp, a freshly minted token) yields a new url per render, which previously only
    re-keyed `PreviewContainer` but now additionally resets `connected` and restarts the probe and
    the 15s timer — a remount loop that would present as a preview that never connects. No core
    modifier exists, so this could not be reproduced here; it depends entirely on project code.
  Verify: register a `PreviewUrlModifier` that sets a new random value per `modify()` call and watch
    whether the preview settles; if it does not, key on document identity rather than the modified
    url.
  Source: get_webiny_skill('wb-preview-url-modifier') — modifiers are explicitly allowed to be
    async and to fetch a fresh signed token per call; the skill places no stability requirement on
    the resulting URL.
```
