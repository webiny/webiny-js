---
name: api-update-entry
category: api/cms
type: UseCase
class: UpdateEntryUseCase
import: webiny/api/cms/entry
description: >
  Programmatically update entry.
---

# Update Entry

Programmatically update entry.

**Import:** `import { UpdateEntryUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { UpdateEntryUseCase } from "webiny/api/cms/entry";

// UpdateEntryUseCase.Interface
type Interface = IUpdateEntryUseCase;

// UpdateEntryUseCase.Input
type Input = UpdateCmsEntryInput<T>;

// UpdateEntryUseCase.Options
type Options = UpdateCmsEntryOptionsInput;

// UpdateEntryUseCase.Error
type Error = UseCaseError;

// UpdateEntryUseCase.Return
type Return = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;

// UpdateEntryUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UpdateEntryUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/update-entry.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
