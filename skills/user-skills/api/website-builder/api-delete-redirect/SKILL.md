---
name: api-delete-redirect
category: api/website-builder
type: UseCase
class: DeleteRedirectUseCase
import: webiny/api/website-builder/redirect
description: >
  Programmatically delete redirect.
---

# Delete Redirect

Programmatically delete redirect.

**Import:** `import { DeleteRedirectUseCase } from "webiny/api/website-builder/redirect";`

## Types

```typescript
import { DeleteRedirectUseCase } from "webiny/api/website-builder/redirect";

// DeleteRedirectUseCase.Interface
type Interface = IDeleteRedirectUseCase;

// DeleteRedirectUseCase.Error
type Error = UseCaseError;

// DeleteRedirectUseCase.Return
type Return = Promise<Result<void, UseCaseError>>;

// DeleteRedirectUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { DeleteRedirectUseCase } from "webiny/api/website-builder/redirect";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/delete-redirect.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
