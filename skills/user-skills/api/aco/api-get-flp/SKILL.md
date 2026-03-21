---
name: api-get-flp
category: api/aco
type: UseCase
class: GetFlpUseCase
import: webiny/api/aco/flp
description: >
  Programmatically get flp.
---

# Get Flp

Programmatically get flp.

**Import:** `import { GetFlpUseCase } from "webiny/api/aco/flp";`

## Types

```typescript
import { GetFlpUseCase } from "webiny/api/aco/flp";

// GetFlpUseCase.Interface
type Interface = IGetFolderPermission;

// GetFlpUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetFlpUseCase } from "webiny/api/aco/flp";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-flp.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
