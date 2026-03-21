---
name: api-list-flps
category: api/aco
type: UseCase
class: ListFlpsUseCase
import: webiny/api/aco/flp
description: >
  Programmatically list flps.
---

# List Flps

Programmatically list flps.

**Import:** `import { ListFlpsUseCase } from "webiny/api/aco/flp";`

## Types

```typescript
import { ListFlpsUseCase } from "webiny/api/aco/flp";

// ListFlpsUseCase.Interface
type Interface = IListFlps;

// ListFlpsUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListFlpsUseCase } from "webiny/api/aco/flp";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-flps.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
