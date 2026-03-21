---
name: api-create-files-in-batch
category: api/file-manager
type: UseCase
class: CreateFilesInBatchUseCase
import: webiny/api/file-manager/file
description: >
  Programmatically create filesinbatch.
---

# Create Files In Batch

Programmatically create filesinbatch.

**Import:** `import { CreateFilesInBatchUseCase } from "webiny/api/file-manager/file";`

## Types

```typescript
import { CreateFilesInBatchUseCase } from "webiny/api/file-manager/file";

// CreateFilesInBatchUseCase.Interface
type Interface = ICreateFilesInBatchUseCase;

// CreateFilesInBatchUseCase.Error
type Error = UseCaseError;

// CreateFilesInBatchUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CreateFilesInBatchUseCase } from "webiny/api/file-manager/file";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/create-files-in-batch.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
