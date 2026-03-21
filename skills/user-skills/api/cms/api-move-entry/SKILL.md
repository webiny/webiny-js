---
name: api-move-entry
category: api/cms
type: UseCase
class: MoveEntryUseCase
import: webiny/api/cms/entry
description: >
  Programmatically move entry.
---

# Move Entry

Programmatically move entry.

**Import:** `import { MoveEntryUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { MoveEntryUseCase } from "webiny/api/cms/entry";

// MoveEntryUseCase.Interface
type Interface = IMoveEntryUseCase;

// MoveEntryUseCase.Error
type Error = UseCaseError;

// MoveEntryUseCase.Return
type Return = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;

// MoveEntryUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { MoveEntryUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/move-entry.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
