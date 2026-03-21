---
name: api-delete-page
category: api/website-builder
type: UseCase
class: DeletePageUseCase
import: webiny/api/website-builder/page
description: >
  Programmatically delete page.
---

# Delete Page

Programmatically delete page.

**Import:** `import { DeletePageUseCase } from "webiny/api/website-builder/page";`

## Types

```typescript
import { DeletePageUseCase } from "webiny/api/website-builder/page";

// DeletePageUseCase.Interface
type Interface = IDeletePageUseCase;

// DeletePageUseCase.Error
type Error = UseCaseError;

// DeletePageUseCase.Return
type Return = Promise<Result<void, UseCaseError>>;

// DeletePageUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { DeletePageUseCase } from "webiny/api/website-builder/page";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/delete-page.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
