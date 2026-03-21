---
name: api-get-page-revisions
category: api/website-builder
type: UseCase
class: GetPageRevisionsUseCase
import: webiny/api/website-builder/page
description: >
  Programmatically get pagerevisions.
---

# Get Page Revisions

Programmatically get pagerevisions.

**Import:** `import { GetPageRevisionsUseCase } from "webiny/api/website-builder/page";`

## Types

```typescript
import { GetPageRevisionsUseCase } from "webiny/api/website-builder/page";

// GetPageRevisionsUseCase.Interface
type Interface = IGetPageRevisionsUseCase;

// GetPageRevisionsUseCase.Error
type Error = UseCaseError;

// GetPageRevisionsUseCase.Return
type Return = Promise<Result<WbPage[], UseCaseError>>;

// GetPageRevisionsUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetPageRevisionsUseCase } from "webiny/api/website-builder/page";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-page-revisions.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
