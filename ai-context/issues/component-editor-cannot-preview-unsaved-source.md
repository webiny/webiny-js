# The component editor cannot preview unsaved source

> **Package:** `@webiny/remote-components`
> **Severity:** low — a missing capability, not a defect. Filed so it gets built deliberately rather
> than preserved by accident.

## What happened

Before W4, the editor held its own bundler (`bundleComponentInBrowser`). It looked like a local
preview build, and a standing decision said the editor should keep one.

It was not one. The editor's sandbox renders `component.bundledJs` — the **stored** bundle — and the
browser bundler existed only to produce the bundle the editor then saved. Once saving was routed
through `bundleRemoteComponent`, it had no caller, so it was deleted along with its `sha256` helper
and the `PreviewBundle` type that described its output.

Deleting it did not remove a capability. It removed a module whose reason had already gone.

## What is missing

Previewing **unsaved** source. Today the editor must save before the preview reflects a change,
because the preview reads what is stored. That is a real feature and worth building:

- It is the fast feedback loop the editor exists for.
- It is what the deleted bundler _looked_ like it was doing, which is why it survived as long as it
  did.

## What it must not become

A second derivation. The reason the two bundlers diverged is that each held its own idea of what to
bundle; that is now one shared module (`src/shared/bundler/deriveComponentBundle.ts`) with a
conformance suite over it.

A preview build has to use that same derivation, and it must stay structurally incapable of
producing anything persistable — no `sha256`, no manifest, nothing the Library stores. The type test
in `__tests__/editorCannotWriteBundles.test-d.ts` is what holds that line and should be extended,
not worked around.
