---
name: api-duplicate-page
category: api/website-builder
type: UseCase
class: DuplicatePageUseCase
import: webiny/api/website-builder/page
description: >
  Programmatically duplicate page.
---

# Duplicate Page

Programmatically duplicate page.

**Import:** `import { DuplicatePageUseCase } from "webiny/api/website-builder/page";`

## Types

```typescript
import { DuplicatePageUseCase } from "webiny/api/website-builder/page";

// DuplicatePageUseCase.Interface
type Interface = IDuplicatePageUseCase;

// DuplicatePageUseCase.Error
type Error = UseCaseError;

// DuplicatePageUseCase.Return
type Return = Promise<Result<WbPage, UseCaseError>>;

// DuplicatePageUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { DuplicatePageUseCase } from "webiny/api/website-builder/page";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/duplicate-page.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
