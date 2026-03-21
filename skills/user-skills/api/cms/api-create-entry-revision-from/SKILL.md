---
name: api-create-entry-revision-from
category: api/cms
type: UseCase
class: CreateEntryRevisionFromUseCase
import: webiny/api/cms/entry
description: >
  Programmatically create entryrevisionfrom.
---

# Create Entry Revision From

Programmatically create entryrevisionfrom.

**Import:** `import { CreateEntryRevisionFromUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { CreateEntryRevisionFromUseCase } from "webiny/api/cms/entry";

// CreateEntryRevisionFromUseCase.Interface
type Interface = ICreateEntryRevisionFromUseCase;

// CreateEntryRevisionFromUseCase.Input
type Input = CreateCmsEntryInput<T>;

// CreateEntryRevisionFromUseCase.Options
type Options = CreateCmsEntryOptionsInput;

// CreateEntryRevisionFromUseCase.Error
type Error = UseCaseError;

// CreateEntryRevisionFromUseCase.Return
type Return = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;

// CreateEntryRevisionFromUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CreateEntryRevisionFromUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/create-entry-revision-from.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
