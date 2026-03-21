---
name: api-move-page
category: api/website-builder
type: UseCase
class: MovePageUseCase
import: webiny/api/website-builder/page
description: >
  Programmatically move page.
---

# Move Page

Programmatically move page.

**Import:** `import { MovePageUseCase } from "webiny/api/website-builder/page";`

## Types

```typescript
import { MovePageUseCase } from "webiny/api/website-builder/page";

// MovePageUseCase.Interface
type Interface = IMovePageUseCase;

// MovePageUseCase.Error
type Error = UseCaseError;

// MovePageUseCase.Return
type Return = Promise<Result<WbPage, UseCaseError>>;

// MovePageUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { MovePageUseCase } from "webiny/api/website-builder/page";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/move-page.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
