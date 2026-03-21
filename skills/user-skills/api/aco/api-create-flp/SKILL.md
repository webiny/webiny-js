---
name: api-create-flp
category: api/aco
type: UseCase
class: CreateFlpUseCase
import: webiny/api/aco/flp
description: >
  Programmatically create flp.
---

# Create Flp

Programmatically create flp.

**Import:** `import { CreateFlpUseCase } from "webiny/api/aco/flp";`

## Types

```typescript
import { CreateFlpUseCase } from "webiny/api/aco/flp";

// CreateFlpUseCase.Interface
type Interface = ICreateFlpUseCase;

// CreateFlpUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CreateFlpUseCase } from "webiny/api/aco/flp";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/create-flp.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
