---
name: api-list-redirects
category: api/website-builder
type: UseCase
class: ListRedirectsUseCase
import: webiny/api/website-builder/redirect
description: >
  Programmatically list redirects.
---

# List Redirects

Programmatically list redirects.

**Import:** `import { ListRedirectsUseCase } from "webiny/api/website-builder/redirect";`

## Types

```typescript
import { ListRedirectsUseCase } from "webiny/api/website-builder/redirect";

// ListRedirectsUseCase.Interface
type Interface = IListRedirectsUseCase;

// ListRedirectsUseCase.Error
type Error = UseCaseError;

// ListRedirectsUseCase.Return
type Return = Promise<Result<ListRedirectsResult, UseCaseError>>;

// ListRedirectsUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListRedirectsUseCase } from "webiny/api/website-builder/redirect";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-redirects.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
