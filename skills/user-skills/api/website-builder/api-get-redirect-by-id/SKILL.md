---
name: api-get-redirect-by-id
category: api/website-builder
type: UseCase
class: GetRedirectByIdUseCase
import: webiny/api/website-builder/redirect
description: >
  Programmatically get redirectbyid.
---

# Get Redirect By Id

Programmatically get redirectbyid.

**Import:** `import { GetRedirectByIdUseCase } from "webiny/api/website-builder/redirect";`

## Types

```typescript
import { GetRedirectByIdUseCase } from "webiny/api/website-builder/redirect";

// GetRedirectByIdUseCase.Interface
type Interface = IGetRedirectByIdUseCase;

// GetRedirectByIdUseCase.Error
type Error = UseCaseError;

// GetRedirectByIdUseCase.Return
type Return = Promise<Result<WbRedirect, UseCaseError>>;

// GetRedirectByIdUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetRedirectByIdUseCase } from "webiny/api/website-builder/redirect";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-redirect-by-id.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
