---
name: api-delete-group
category: api/cms
type: UseCase
class: DeleteGroupUseCase
import: webiny/api/cms/group
description: >
  Programmatically delete group.
---

# Delete Group

Programmatically delete group.

**Import:** `import { DeleteGroupUseCase } from "webiny/api/cms/group";`

## Types

```typescript
import { DeleteGroupUseCase } from "webiny/api/cms/group";

// DeleteGroupUseCase.Interface
type Interface = IDeleteGroupUseCase;

// DeleteGroupUseCase.Error
type Error = UseCaseError;

// DeleteGroupUseCase.Return
type Return = Promise<Result<void, UseCaseError>>;

// DeleteGroupUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { DeleteGroupUseCase } from "webiny/api/cms/group";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/delete-group.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
