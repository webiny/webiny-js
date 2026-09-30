# The preview middleware redirects forever

> **Package:** `@webiny/website-builder-nextjs` (`middleware.ts`), and the same pattern hand-written
> in the demo website app.
> **Severity:** high — every preview/editing request loops until the browser gives up, so the Website
> Builder editor's canvas never loads. Not specific to migrated pages; any page previewed through
> this middleware does it.
> **Status:** fixed. The package middleware in `93f`-series commit below; the demo website app's
> copy changed in its own repo and left uncommitted there, as that repo is outside this worktree.
> The mixed-content wall recorded at the end is NOT fixed and is the reason a canvas may still not
> appear from the deployed admin.

## What happens

Opening any page in the Website Builder editor loads its preview iframe at

```
<previewDomain>/<path>?wb.editing=true&wb.type=page&wb.id=…&wb.tenant=root
```

The middleware sees `wb.editing=true`, finds draft mode not enabled, and redirects to
`/api/preview`, which enables draft mode and redirects back to the page. The middleware sees
`wb.editing=true` again, finds draft mode not enabled **again**, and redirects to `/api/preview`.
Forever.

Reproduced with a bare request, nothing to do with the admin:

```
$ curl -sL 'http://localhost:3000/apartments/ct/bridgeport/apply-now?wb.editing=true&wb.tenant=root'
final 307 after 50 redirect(s) -> http://localhost:3000/api/preview?wb.editing=true&wb.tenant=root
```

## The cause

`draftMode()` does not report enabled state inside Next.js middleware.

`middleware.ts:21` asks for it and branches on it:

```ts
const previewMode = await draftMode();

if (previewRequested) {
  if (previewMode.isEnabled) {
    /* pass through */
  }
  // not in draft mode yet — hand off to the route that enables it
  return NextResponse.redirect(url); // ← always taken
}
```

`previewMode.isEnabled` is always `false` here, so the second branch is unconditional.

The cookie is not the problem — `/api/preview` sets it correctly:

```
$ curl -D - 'http://localhost:3000/api/preview?…'
HTTP/1.1 307 Temporary Redirect
location: /apartments/ct/bridgeport/apply-now?wb.editing=true&…
set-cookie: __prerender_bypass=5a0c670d…; Path=/; Secure; HttpOnly; SameSite=none
```

The isolating test is the _other_ branch. Send that cookie with no editing flag, and middleware
should take its exit-preview path (`isEnabled` → `disable()` → redirect). It does not:

```
page + valid __prerender_bypass, no editing flag  ->  200        (should have redirected)
page + no cookie,                no editing flag  ->  200
```

Identical. Middleware cannot see draft mode whether the cookie is there or not, which is what makes
the loop unconditional rather than intermittent.

Next 15.5.14; the package declares `"next": ">=15"`.

## Verified after the fix

Against the running app, all four paths through the middleware:

```
editing flag, no cookie      307 -> /api/preview   hands off once, no longer loops
editing flag, with cookie    200                   passes through
full chain, cookie store     200 after 2 redirects  "Apply Now | Park City Place"
cookie, no editing flag      307 + cookie cleared, settles at 200 after 1 redirect
```

The gate still gates: a preview request without the cookie is still sent to the draft-mode route, so
the fix did not simply remove the check.

Two of the measurements here were artefacts before they were right, both from curl rather than the
code. curl will not store a `Secure` cookie over `http` where Chrome will on localhost, so the first
"no cookies at all" reading was wrong; and forcing `-H Cookie` re-sends it on every redirect, which
made the exit-preview branch look like it looped when a real cookie store settles it in one hop.

## The fix

Read the cookie directly rather than asking `draftMode()`, which is documented for Server Components
and Route Handlers:

```ts
const previewEnabled = Boolean(request.cookies.get("__prerender_bypass"));
```

The exit-preview branch needs the same treatment. It cannot call `previewMode.disable()` from
middleware either, so exiting has to clear the cookie on the response:

```ts
response.cookies.delete("__prerender_bypass");
```

`MiddlewareRequest` in the package already declares `cookies.get`, so the shipped middleware has
everything it needs and simply asks the wrong thing.

## Two places, one pattern

The demo website app (`~/Dev/next-website-migration-tool/middleware.ts`) hand-writes this rather than
using `export { middleware, config } from "@webiny/website-builder-nextjs/middleware"` — but both
carry the same defect, so switching the app to the package would not fix it. Both need the change.

## A second wall behind this one

Fixing the loop will not give a working preview from the **deployed** admin against a **local**
website app, and it is worth knowing before anyone measures the fix by whether the canvas appears.

The admin is served over https (`wb.referrer=https://d3b1upepv12kyx.cloudfront.net`) and
`usePreviewDomain` defaults to `http://localhost:3000`. An https page cannot embed an http iframe —
browsers block it as mixed active content — so the canvas stays empty for a reason that has nothing
to do with draft mode.

This is inferred from the URLs rather than observed in a browser, so it should be confirmed before
being acted on. If it holds, the options are a local admin over http, an https tunnel to the local
app, or the dev-only preview-domain override (`webiny_wb_custom_preview_domain` in localStorage)
pointed at something https.

## What is not wrong

The extraction admin's Edit button, which is what surfaced this. It opens
`/website-builder/pages/editor/<revision id>` and the editor loads the right page — the loop is
inside the website app's preview handshake and reproduces from a bare curl with no admin involved.
