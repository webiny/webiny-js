---
name: api-delete-flp
category: api/aco
type: UseCase
class: DeleteFlpUseCase
import: webiny/api/aco/flp
description: >
  Programmatically delete flp.
---

# Delete Flp

Programmatically delete flp.

**Import:** `import { DeleteFlpUseCase } from "webiny/api/aco/flp";`

## Types

```typescript
import { DeleteFlpUseCase } from "webiny/api/aco/flp";

// DeleteFlpUseCase.Interface
type Interface = IDeleteFlpUseCase;

// DeleteFlpUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { DeleteFlpUseCase } from "webiny/api/aco/flp";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/delete-flp.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
