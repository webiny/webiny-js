---
name: api-invalidate-redirects-cache-invalidate-redirects-cache
category: api/website-builder
type: UseCase
class: InvalidateRedirectsCacheUseCase
import: webiny/api/website-builder/redirect
description: >
  Programmatically invalidate-redirects-cache invalidateredirectscache.
---

# Invalidate-redirects-cache Invalidate Redirects Cache

Programmatically invalidate-redirects-cache invalidateredirectscache.

**Import:** `import { InvalidateRedirectsCacheUseCase } from "webiny/api/website-builder/redirect";`

## Types

```typescript
import { InvalidateRedirectsCacheUseCase } from "webiny/api/website-builder/redirect";

// InvalidateRedirectsCacheUseCase.Interface
type Interface = IInvalidateRedirectsCacheUseCase;

// InvalidateRedirectsCacheUseCase.Error
type Error = UseCaseError;

// InvalidateRedirectsCacheUseCase.Return
type Return = Promise<Result<void, UseCaseError>>;

// InvalidateRedirectsCacheUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { InvalidateRedirectsCacheUseCase } from "webiny/api/website-builder/redirect";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/invalidate-redirects-cache-invalidate-redirects-cache.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
