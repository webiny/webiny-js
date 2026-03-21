---
name: api-get-ancestors
category: api/aco
type: UseCase
class: GetAncestorsUseCase
import: webiny/api/aco/folder
description: >
  Programmatically get ancestors.
---

# Get Ancestors

Programmatically get ancestors.

**Import:** `import { GetAncestorsUseCase } from "webiny/api/aco/folder";`

## Types

```typescript
import { GetAncestorsUseCase } from "webiny/api/aco/folder";

// GetAncestorsUseCase.Interface
type Interface = IGetAncestorsUseCase;

// GetAncestorsUseCase.Error
type Error = UseCaseError;

// GetAncestorsUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetAncestorsUseCase } from "webiny/api/aco/folder";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-ancestors.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
