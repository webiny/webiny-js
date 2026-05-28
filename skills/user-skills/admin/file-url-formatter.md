---
name: file-url-formatter
context: webiny-extensions
description: >
  Covers the FileUrlFormatter extension point introduced in Webiny 6.4.0.
  Explains how to register a custom URL formatter that transforms file/image
  URLs throughout the admin UI (e.g. to append CDN-specific query parameters).
  Handles the createFeature + RegisterFeature pattern, the format(url, params)
  mutation contract, and the FileUrlFormatter.Params type namespace.
---

# File URL Formatter

## TL;DR

`FileUrlFormatter` lets you intercept image URL construction in the admin UI and
rewrite it — adding CDN tokens, remapping query parameters, or changing the host.
Register your implementation once via `createFeature`; it is automatically picked
up by every `FilePicker` thumbnail in the app.

## The Interface

Defined in `@webiny/admin-ui`:

```ts
export interface FileUrlParams {
  width?: number;
  [key: string]: unknown;
}

export interface FileUrlFormatter {
  format(url: URL, params?: FileUrlParams): void;
}
```

`format` receives a mutable `URL` object. Mutate it in place — no return value.
`params` carries the caller's intent (e.g. `{ width: 128 }`) alongside any
arbitrary extra keys your implementation may recognise.

All types are exposed through the `FileUrlFormatter` namespace:

| Type                         | Usage                          |
| ---------------------------- | ------------------------------ |
| `FileUrlFormatter.Interface` | implement this in your class   |
| `FileUrlFormatter.Params`    | type for the `params` argument |

## Creating an Implementation

```ts
// extensions/myFormatter/MyFileUrlFormatter.ts
import { FileUrlFormatter } from "webiny/admin/file-manager";

class MyFileUrlFormatter implements FileUrlFormatter.Interface {
  format(url: URL, params?: FileUrlFormatter.Params): void {
    if (params?.width !== undefined) {
      // Replace the standard width param with your CDN's equivalent
      url.searchParams.delete("width");
      url.searchParams.set("my_width", String(params.width));
    }
  }
}

export const MyFileUrlFormatterImpl = FileUrlFormatter.createImplementation({
  implementation: MyFileUrlFormatter,
  dependencies: []
});
```

## Registering via createFeature

```tsx
// extensions/myFormatter/index.tsx
import React from "react";
import { createFeature, RegisterFeature } from "webiny/admin";
import { MyFileUrlFormatterImpl } from "./MyFileUrlFormatter.js";

const MyFormatterFeature = createFeature({
  name: "MyApp/FileUrlFormatter",
  register(container) {
    container.register(MyFileUrlFormatterImpl).inSingletonScope();
  }
});

export default () => <RegisterFeature feature={MyFormatterFeature} />;
```

Mount it in `webiny.config.tsx`:

```tsx
<Admin.Extension src={"@/extensions/myFormatter/index.tsx"} />
```

## How the Default Works

When File Manager is loaded it registers `FmFileUrlFormatter`, which appends
`?width=N` to any image URL. If you register your own implementation it takes
precedence (last registered wins via `container.resolve`).

| Scenario                          | Result                              |
| --------------------------------- | ----------------------------------- |
| File Manager loaded, no extension | `?width=128` appended               |
| Extension registered              | Extension's `format` called instead |
| No File Manager, no extension     | URL returned unchanged              |

## Quick Reference

```ts
// Import
import { FileUrlFormatter } from "webiny/admin/file-manager";

// Implement
class MyFormatter implements FileUrlFormatter.Interface {
  format(url: URL, params?: FileUrlFormatter.Params): void {
    /* mutate url */
  }
}

// Wrap
export const MyFormatterImpl = FileUrlFormatter.createImplementation({
  implementation: MyFormatter,
  dependencies: []
});

// Register (in createFeature)
container.register(MyFormatterImpl).inSingletonScope();
```

## Related Skills

- `preview-url-modifier` -- same createFeature pattern for website-builder live preview URLs
