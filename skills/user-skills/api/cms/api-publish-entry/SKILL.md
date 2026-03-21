---
name: api-publish-entry
category: api/cms
type: UseCase
class: PublishEntryUseCase
import: webiny/api/cms/entry
description: >
  Programmatically publish entry.
---

# Publish Entry

Programmatically publish entry.

**Import:** `import { PublishEntryUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { PublishEntryUseCase } from "webiny/api/cms/entry";

// PublishEntryUseCase.Interface
type Interface = IPublishEntryUseCase;

// PublishEntryUseCase.Error
type Error = UseCaseError;

// PublishEntryUseCase.Return
type Return = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;

// PublishEntryUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PublishEntryUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/publish-entry.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
