# Handoff prompt: re-export `streamHandler` from the WCP telemetry client

Paste the section below into an agent in the **WCP repo** (the one that serves
`https://api.webiny.com/clients/latest.mjs`). Once it ships, delete the string-append in
`packages/project/src/extensions/Project/WcpInjectTelemetryClientAfterBuild.ts` and this file.

---

The telemetry client artifact this repo serves at `GET /clients/latest.mjs` needs a one-line
change. Find whatever source file that artifact is built from (the served output is 108 lines,
starts with `import { handler as userHandler } from "./_handler.mjs";` and ends with
`export { handler, telemetryData, postTelemetryData };`).

Background: webiny-js injects this file into a built Webiny API bundle by renaming the bundle's
`handler.mjs` to `_handler.mjs` and writing this artifact in its place. So this artifact decides
which of the bundle's exports survive. Today it only re-exports `handler`. The AWS API bundle now
also exports `streamHandler` — the entry point of a Lambda configured for HTTP response streaming.
Because this artifact drops it, that Lambda has no handler to load and dies at cold start, and
webiny-js currently works around it by string-appending a re-export onto the downloaded file after
download. Fixing it here deletes that workaround.

The change — add one line right after the existing import:

    import { handler as userHandler } from "./_handler.mjs";
    export * from "./_handler.mjs";

Requirements, all of which the one-liner already satisfies — verify, don't re-engineer:

1. `streamHandler` must be re-exported UNWRAPPED, as the same function object. AWS's
   `awslambda.streamifyResponse` attaches a marker to it and the Lambda runtime inspects the
   exported function for that marker. Routing it through a telemetry wrapper function strips the
   marker and silently downgrades the function to buffered (non-streaming) responses, which is
   worse than a crash because it looks like it works. No telemetry for that function is the
   accepted trade.
2. The telemetry-wrapped `handler` must still win. An explicit `export { handler }` shadows a star
   re-export of the same name — that is defined ES module behavior, not an ambiguity error — so the
   existing final export line keeps precedence and needs no edit.
3. It must not break the self-hosted API bundle, which has NO `streamHandler` (streaming is native
   there, no Lambda involved). `export *` re-exports nothing extra in that case. Do NOT use
   `export { streamHandler } from "./_handler.mjs"` — a named re-export of a missing binding is a
   hard ESM error that breaks the entire handler. This was tried and it broke the self-hosted build.
4. `export *` must not re-export `default` — per spec it doesn't, so nothing else leaks.

Then confirm the built/served artifact actually contains the new line (the fix is worthless if the
build pipeline strips or rewrites the export), and tell me the version/deploy step needed for
`GET /clients/latest.mjs` to serve it.
