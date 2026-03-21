---
name: api-update-redirect
category: api/website-builder
type: UseCase
class: UpdateRedirectUseCase
import: webiny/api/website-builder/redirect
description: >
  Programmatically update redirect.
---

# Update Redirect

Programmatically update redirect.

**Import:** `import { UpdateRedirectUseCase } from "webiny/api/website-builder/redirect";`

## Types

```typescript
import { UpdateRedirectUseCase } from "webiny/api/website-builder/redirect";

// UpdateRedirectUseCase.Interface
type Interface = IUpdateRedirectUseCase;

// UpdateRedirectUseCase.Error
type Error = UseCaseError;

// UpdateRedirectUseCase.Return
type Return = Promise<Result<WbRedirect, UseCaseError>>;

// UpdateRedirectUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UpdateRedirectUseCase } from "webiny/api/website-builder/redirect";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/update-redirect.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
