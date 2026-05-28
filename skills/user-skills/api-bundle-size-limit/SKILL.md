---
name: api-bundle-size-limit
context: webiny-extensions
description: >
  Covers how to configure the maximum allowed size of the Webiny API Lambda
  bundle using the Infra.Api.MaxBundleSize extension in webiny.config.tsx.
  Use when a project's API bundle exceeds the default 4.5 MB limit or when
  you want to enforce a stricter limit. Handles the extension syntax, byte
  calculations, and interpreting the build error message.
---

# API Bundle Size Limit

## TL;DR

The `Infra.Api.MaxBundleSize` extension enforces a maximum size on the built API Lambda bundle. The default limit is 4.5 MB. If the bundle exceeds the limit the build fails with a clear error; add the extension to `webiny.config.tsx` to raise (or lower) it.

## Default Behavior

By default Webiny enforces a **4.5 MB** limit on the API Lambda bundle (`handler.mjs`). If the built output exceeds this, the build fails:

```
error   Build errors:
× asset size limit: The following asset(s) exceed the recommended size limit (4.5 MiB).
× entrypoint size limit: The following entrypoint(s) combined asset size exceeds the recommended limit (4.5 MiB).
error   build failed
```

## Raising the Limit

Add `Infra.Api.MaxBundleSize` to `webiny.config.tsx` with `size` in **bytes**:

```tsx
// webiny.config.tsx
import { Infra } from "webiny/extensions";

export const Extensions = () => (
  <>
    {/* Raise the API bundle size limit to 6 MB */}
    <Infra.Api.MaxBundleSize size={6 * 1024 * 1024} />
  </>
);
```

Common byte values:

| MB  | Bytes expression                | Exact bytes       |
| --- | ------------------------------- | ----------------- |
| 4.5 | `Math.round(4.5 * 1024 * 1024)` | 4718592 (default) |
| 5   | `5 * 1024 * 1024`               | 5242880           |
| 6   | `6 * 1024 * 1024`               | 6291456           |
| 8   | `8 * 1024 * 1024`               | 8388608           |
| 10  | `10 * 1024 * 1024`              | 10485760          |

## How It Works

The extension sets the `WEBINY_INFRA_API_MAX_BUNDLE_SIZE` environment variable (in bytes) which is read by the API bundler (`@webiny/build-tools`) at build time. The `WEBINY_INFRA_` prefix ensures the variable is **not** automatically forwarded to the Lambda function's runtime environment.

## Lowering the Limit

You can also enforce a stricter limit to catch bundle regressions early:

```tsx
{
  /* Enforce a strict 3 MB limit */
}
<Infra.Api.MaxBundleSize size={3 * 1024 * 1024} />;
```

## Quick Reference

| Task                     | Snippet                                               |
| ------------------------ | ----------------------------------------------------- |
| Raise to 6 MB            | `<Infra.Api.MaxBundleSize size={6 * 1024 * 1024} />`  |
| Raise to 10 MB           | `<Infra.Api.MaxBundleSize size={10 * 1024 * 1024} />` |
| Restore default (4.5 MB) | Remove the extension                                  |
| Convert MB to bytes      | `Math.round(N * 1024 * 1024)`                         |

## Related Skills

- `infra-env-var` -- setting arbitrary environment variables in the project context
- `api-lambda-function` -- adding custom Lambda functions to the API
