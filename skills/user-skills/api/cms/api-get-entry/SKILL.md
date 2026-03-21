---
name: api-get-entry
category: api/cms
type: UseCase
class: GetEntryUseCase
import: webiny/api/cms/entry
description: >
  Programmatically get entry.
---

# Get Entry

Programmatically get entry.

**Import:** `import { GetEntryUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { GetEntryUseCase } from "webiny/api/cms/entry";

// GetEntryUseCase.Interface
type Interface = IGetEntryUseCase;

// GetEntryUseCase.Error
type Error = UseCaseError;

// GetEntryUseCase.Return
type Return = Promise<Result<CmsEntry<T>, UseCaseError>>;

// GetEntryUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetEntryUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-entry.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
