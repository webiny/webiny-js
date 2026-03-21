---
name: api-create-page
category: api/website-builder
type: UseCase
class: CreatePageUseCase
import: webiny/api/website-builder/page
description: >
  Programmatically create page.
---

# Create Page

Programmatically create page.

**Import:** `import { CreatePageUseCase } from "webiny/api/website-builder/page";`

## Types

```typescript
import { CreatePageUseCase } from "webiny/api/website-builder/page";

// CreatePageUseCase.Interface
type Interface = ICreatePageUseCase;

// CreatePageUseCase.Error
type Error = UseCaseError;

// CreatePageUseCase.Return
type Return = Promise<Result<WbPage, UseCaseError>>;

// CreatePageUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CreatePageUseCase } from "webiny/api/website-builder/page";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/create-page.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
