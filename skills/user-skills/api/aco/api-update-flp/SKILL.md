---
name: api-update-flp
category: api/aco
type: UseCase
class: UpdateFlpUseCase
import: webiny/api/aco/flp
description: >
  Programmatically update flp.
---

# Update Flp

Programmatically update flp.

**Import:** `import { UpdateFlpUseCase } from "webiny/api/aco/flp";`

## Types

```typescript
import { UpdateFlpUseCase } from "webiny/api/aco/flp";

// UpdateFlpUseCase.Interface
type Interface = IUpdateFlpUseCase;

// UpdateFlpUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UpdateFlpUseCase } from "webiny/api/aco/flp";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/update-flp.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
