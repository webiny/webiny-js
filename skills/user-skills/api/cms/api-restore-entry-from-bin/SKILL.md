---
name: api-restore-entry-from-bin
category: api/cms
type: UseCase
class: RestoreEntryFromBinUseCase
import: webiny/api/cms/entry
description: >
  Programmatically restore entryfrombin.
---

# Restore Entry From Bin

Programmatically restore entryfrombin.

**Import:** `import { RestoreEntryFromBinUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { RestoreEntryFromBinUseCase } from "webiny/api/cms/entry";

// RestoreEntryFromBinUseCase.Interface
type Interface = IRestoreEntryFromBinUseCase;

// RestoreEntryFromBinUseCase.Error
type Error = UseCaseError;

// RestoreEntryFromBinUseCase.Return
type Return = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;

// RestoreEntryFromBinUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { RestoreEntryFromBinUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/restore-entry-from-bin.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
