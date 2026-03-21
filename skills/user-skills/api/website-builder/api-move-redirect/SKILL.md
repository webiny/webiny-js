---
name: api-move-redirect
category: api/website-builder
type: UseCase
class: MoveRedirectUseCase
import: webiny/api/website-builder/redirect
description: >
  Programmatically move redirect.
---

# Move Redirect

Programmatically move redirect.

**Import:** `import { MoveRedirectUseCase } from "webiny/api/website-builder/redirect";`

## Types

```typescript
import { MoveRedirectUseCase } from "webiny/api/website-builder/redirect";

// MoveRedirectUseCase.Interface
type Interface = IMoveRedirectUseCase;

// MoveRedirectUseCase.Error
type Error = UseCaseError;

// MoveRedirectUseCase.Return
type Return = Promise<Result<WbRedirect, UseCaseError>>;

// MoveRedirectUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { MoveRedirectUseCase } from "webiny/api/website-builder/redirect";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/move-redirect.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
