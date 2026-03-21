---
name: api-update-page
category: api/website-builder
type: UseCase
class: UpdatePageUseCase
import: webiny/api/website-builder/page
description: >
  Programmatically update page.
---

# Update Page

Programmatically update page.

**Import:** `import { UpdatePageUseCase } from "webiny/api/website-builder/page";`

## Types

```typescript
import { UpdatePageUseCase } from "webiny/api/website-builder/page";

// UpdatePageUseCase.Interface
type Interface = IUpdatePageUseCase;

// UpdatePageUseCase.Error
type Error = UseCaseError;

// UpdatePageUseCase.Return
type Return = Promise<Result<WbPage, UseCaseError>>;

// UpdatePageUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UpdatePageUseCase } from "webiny/api/website-builder/page";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/update-page.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
