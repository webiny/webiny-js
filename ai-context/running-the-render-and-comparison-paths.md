# Running the render and comparison paths

Operational notes for Component Extraction's render step and the page-composition comparison harness.
Neither is self-contained and nothing in their error output says so, which has cost hours twice.

This lives here rather than in `packages/api-page-composition-poc/README.md` because `.gitignore:60`
ignores every `packages/*/README.md`, so a note there would not survive a clone.

**The website app on `http://localhost:3000`.** Both the comparison harness in
`scripts/comparePages` and Component Extraction's render step (`componentExtractionRenderComponents`,
in `@webiny/api-component-extraction`) drive a browser against it. The app lives outside this repo at
`../next-website-migration-tool`; `yarn dev` there.

**A public tunnel to it, set as the Website Builder preview domain.** The render step runs in Lambda,
so `localhost` is not reachable from it — it resolves the sandbox route against the configured
preview domain. A quick tunnel works:

```bash
cloudflared tunnel --url http://localhost:3000
```

Then set the printed `https://*.trycloudflare.com` origin as the preview domain. **A quick tunnel is
ephemeral**: it carries a fresh hostname every time and deregisters without warning, so a preview
domain that worked an hour ago may point at nothing now.

### When a render fails

```
could not render "<name>": Waiting failed: 30000ms exceeded
```

**Check the tunnel before reading anything into the component.** That timeout means the sandbox page
never signalled that it had mounted, and the overwhelmingly common cause is that the renderer could
not load it at all. In order:

1. `curl -sI <preview-domain>/sandbox/component` — if this does not answer, the tunnel is dead.
2. `curl -so /dev/null -w '%{http_code}' http://localhost:3000/_next/static/chunks/main-app.js` — a
   dev server can serve page HTML while returning 500 for its own chunks, in which case nothing
   hydrates and every component times out identically. Clear `.next` and restart.
3. Run one site's render pass at a time. Several concurrent passes against one dev server fail every
   component.

Only after those three is the message about the component.
