---
name: api-unpublish-entry
category: api/cms
type: UseCase
class: UnpublishEntryUseCase
import: webiny/api/cms/entry
description: >
  Programmatically unpublish entry.
---

# Unpublish Entry

Programmatically unpublish entry.

**Import:** `import { UnpublishEntryUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { UnpublishEntryUseCase } from "webiny/api/cms/entry";

// UnpublishEntryUseCase.Interface
type Interface = IUnpublishEntryUseCase;

// UnpublishEntryUseCase.Error
type Error = UseCaseError;

// UnpublishEntryUseCase.Return
type Return = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;

// UnpublishEntryUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UnpublishEntryUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/unpublish-entry.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
