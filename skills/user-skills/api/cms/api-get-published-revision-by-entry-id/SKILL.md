---
name: api-get-published-revision-by-entry-id
category: api/cms
type: UseCase
class: GetPublishedRevisionByEntryIdUseCase
import: webiny/api/cms/entry
description: >
  Programmatically get publishedrevisionbyentryid.
---

# Get Published Revision By Entry Id

Programmatically get publishedrevisionbyentryid.

**Import:** `import { GetPublishedRevisionByEntryIdUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { GetPublishedRevisionByEntryIdUseCase } from "webiny/api/cms/entry";

// GetPublishedRevisionByEntryIdUseCase.Interface
type Interface = IGetPublishedRevisionByEntryIdUseCase;

// GetPublishedRevisionByEntryIdUseCase.Error
type Error = UseCaseError;

// GetPublishedRevisionByEntryIdUseCase.Return
type Return = Promise<
        Result<CmsEntry<T> | null, UseCaseError>
    >;

// GetPublishedRevisionByEntryIdUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetPublishedRevisionByEntryIdUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-published-revision-by-entry-id.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
