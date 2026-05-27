---
name: wb-preview-url-modifier
context: webiny-extensions
description: >
  Covers the PreviewUrlModifier extension point in Website Builder. Use when
  a user wants to inject custom query parameters into live preview URLs —
  e.g. signed tokens, tenant identifiers, feature flags — from their Webiny
  project. Handles the full registration pattern: implementing the interface,
  wiring via createFeature + RegisterFeature, and registering via
  webiny.config.tsx. Supports async modifier methods (e.g. remote token fetch).
---

# Website Builder: Preview URL Modifier

## TL;DR

`PreviewUrlModifier` is a DI extension point that lets project developers inject
custom query parameters into all Website Builder live preview URLs. Register one
implementation; it receives the full `URL` object and can mutate it however it
needs — including async operations like fetching a signed token from a remote API.

## Implement the Modifier

Import from `webiny/admin/website-builder`. The single required method is
`modify(url: URL): Promise<void>` — mutate `url.searchParams` in place, mark the
method `async` when you need to fetch remote values.

```ts
import { PreviewUrlModifier } from "webiny/admin/website-builder";

class MyPreviewUrlModifier implements PreviewUrlModifier.Interface {
  async modify(url: URL) {
    url.searchParams.set("my-param", "my-value");
  }
}

export default PreviewUrlModifier.createImplementation({
  implementation: MyPreviewUrlModifier,
  dependencies: []
});
```

Async example — fetching a signed token:

```ts
class SignedTokenModifier implements PreviewUrlModifier.Interface {
  async modify(url: URL) {
    const token = await fetch("/api/preview-token").then(r => r.text());
    url.searchParams.set("token", token);
  }
}

export default PreviewUrlModifier.createImplementation({
  implementation: SignedTokenModifier,
  dependencies: []
});
```

## Register the Feature

```tsx
// extensions/previewUrlModifier/index.tsx
import React from "react";
import { createFeature, RegisterFeature } from "webiny/admin";
import MyPreviewUrlModifier from "./MyPreviewUrlModifier.js";

const PreviewUrlModifierFeature = createFeature({
  name: "MyApp/PreviewUrlModifier",
  register(container) {
    container.register(MyPreviewUrlModifier);
  }
});

export default () => <RegisterFeature feature={PreviewUrlModifierFeature} />;
```

```tsx
// webiny.config.tsx
<Admin.Extension src={"@/extensions/previewUrlModifier/index.tsx"} />
```

## Where It Applies

| Surface          | Description                                          |
| ---------------- | ---------------------------------------------------- |
| Editor iframe    | The live-editing iframe in the page editor           |
| Address bar link | The "copy preview link" button in the editor toolbar |
| Pages list       | Preview icon links in the pages list table           |

## Constraints

- **One modifier per project.** Only the first registered implementation is used.
- **Mutate in place.** Return value is ignored; mutate the `URL` object directly.
- **No `wb.*` collisions.** Params prefixed `wb.` are reserved for internal use.

## Related Skills

- `wb-custom-page-types` -- registering custom page types via PageType abstraction
- `wb-page-settings` -- extending page settings groups and fields
