---
name: api-create-entry
category: api/cms
type: UseCase
class: CreateEntryUseCase
import: webiny/api/cms/entry
description: >
  Programmatically create entry.
---

# Create Entry

Programmatically create entry.

**Import:** `import { CreateEntryUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { CreateEntryUseCase } from "webiny/api/cms/entry";

// CreateEntryUseCase.Interface
type Interface = ICreateEntryUseCase;

// CreateEntryUseCase.Input
type Input = CreateCmsEntryInput<T>;

// CreateEntryUseCase.Options
type Options = CreateCmsEntryOptionsInput;

// CreateEntryUseCase.Error
type Error = UseCaseError;

// CreateEntryUseCase.Return
type Return = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;

// CreateEntryUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CreateEntryUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/create-entry.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
