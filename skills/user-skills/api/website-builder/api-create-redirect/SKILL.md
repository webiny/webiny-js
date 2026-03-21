---
name: api-create-redirect
category: api/website-builder
type: UseCase
class: CreateRedirectUseCase
import: webiny/api/website-builder/redirect
description: >
  Programmatically create redirect.
---

# Create Redirect

Programmatically create redirect.

**Import:** `import { CreateRedirectUseCase } from "webiny/api/website-builder/redirect";`

## Types

```typescript
import { CreateRedirectUseCase } from "webiny/api/website-builder/redirect";

// CreateRedirectUseCase.Interface
type Interface = ICreateRedirectUseCase;

// CreateRedirectUseCase.Error
type Error = UseCaseError;

// CreateRedirectUseCase.Return
type Return = Promise<Result<WbRedirect, UseCaseError>>;

// CreateRedirectUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CreateRedirectUseCase } from "webiny/api/website-builder/redirect";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/create-redirect.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
