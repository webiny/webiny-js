---
name: api-get-active-redirects
category: api/website-builder
type: UseCase
class: GetActiveRedirectsUseCase
import: webiny/api/website-builder/redirect
description: >
  Programmatically get activeredirects.
---

# Get Active Redirects

Programmatically get activeredirects.

**Import:** `import { GetActiveRedirectsUseCase } from "webiny/api/website-builder/redirect";`

## Types

```typescript
import { GetActiveRedirectsUseCase } from "webiny/api/website-builder/redirect";

// GetActiveRedirectsUseCase.Interface
type Interface = IGetActiveRedirectsUseCase;

// GetActiveRedirectsUseCase.Error
type Error = UseCaseError;

// GetActiveRedirectsUseCase.Return
type Return = Promise<Result<WbRedirect[], UseCaseError>>;

// GetActiveRedirectsUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetActiveRedirectsUseCase } from "webiny/api/website-builder/redirect";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-active-redirects.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
