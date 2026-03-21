---
name: api-update-singleton-entry
category: api/cms
type: UseCase
class: UpdateSingletonEntryUseCase
import: webiny/api/cms/entry
description: >
  Programmatically update singletonentry.
---

# Update Singleton Entry

Programmatically update singletonentry.

**Import:** `import { UpdateSingletonEntryUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { UpdateSingletonEntryUseCase } from "webiny/api/cms/entry";

// UpdateSingletonEntryUseCase.Interface
type Interface = IUpdateSingletonEntryUseCase;

// UpdateSingletonEntryUseCase.Input
type Input = UpdateCmsEntryInput<T>;

// UpdateSingletonEntryUseCase.Options
type Options = UpdateCmsEntryOptionsInput;

// UpdateSingletonEntryUseCase.Error
type Error = UseCaseError;

// UpdateSingletonEntryUseCase.Return
type Return = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;

// UpdateSingletonEntryUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UpdateSingletonEntryUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/update-singleton-entry.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
