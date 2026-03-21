---
name: api-republish-entry
category: api/cms
type: UseCase
class: RepublishEntryUseCase
import: webiny/api/cms/entry
description: >
  Programmatically republish entry.
---

# Republish Entry

Programmatically republish entry.

**Import:** `import { RepublishEntryUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { RepublishEntryUseCase } from "webiny/api/cms/entry";

// RepublishEntryUseCase.Interface
type Interface = IRepublishEntryUseCase;

// RepublishEntryUseCase.Error
type Error = UseCaseError;

// RepublishEntryUseCase.Return
type Return = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;

// RepublishEntryUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { RepublishEntryUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/republish-entry.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
