---
name: api-get-singleton-entry
category: api/cms
type: UseCase
class: GetSingletonEntryUseCase
import: webiny/api/cms/entry
description: >
  Programmatically get singletonentry.
---

# Get Singleton Entry

Programmatically get singletonentry.

**Import:** `import { GetSingletonEntryUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { GetSingletonEntryUseCase } from "webiny/api/cms/entry";

// GetSingletonEntryUseCase.Interface
type Interface = IGetSingletonEntryUseCase;

// GetSingletonEntryUseCase.Error
type Error = UseCaseError;

// GetSingletonEntryUseCase.Return
type Return = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;

// GetSingletonEntryUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetSingletonEntryUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-singleton-entry.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
