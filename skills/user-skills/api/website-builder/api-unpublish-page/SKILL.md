---
name: api-unpublish-page
category: api/website-builder
type: UseCase
class: UnpublishPageUseCase
import: webiny/api/website-builder/page
description: >
  Programmatically unpublish page.
---

# Unpublish Page

Programmatically unpublish page.

**Import:** `import { UnpublishPageUseCase } from "webiny/api/website-builder/page";`

## Types

```typescript
import { UnpublishPageUseCase } from "webiny/api/website-builder/page";

// UnpublishPageUseCase.Interface
type Interface = IUnpublishPageUseCase;

// UnpublishPageUseCase.Error
type Error = UseCaseError;

// UnpublishPageUseCase.Return
type Return = Promise<Result<WbPage, UseCaseError>>;

// UnpublishPageUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UnpublishPageUseCase } from "webiny/api/website-builder/page";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/unpublish-page.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
