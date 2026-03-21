---
name: api-update-group
category: api/cms
type: UseCase
class: UpdateGroupUseCase
import: webiny/api/cms/group
description: >
  Programmatically update group.
---

# Update Group

Programmatically update group.

**Import:** `import { UpdateGroupUseCase } from "webiny/api/cms/group";`

## Types

```typescript
import { UpdateGroupUseCase } from "webiny/api/cms/group";

// UpdateGroupUseCase.Interface
type Interface = IUpdateGroupUseCase;

// UpdateGroupUseCase.Input
type Input = CmsGroupUpdateInput;

// UpdateGroupUseCase.Error
type Error = UseCaseError;

// UpdateGroupUseCase.Return
type Return = Promise<Result<CmsGroup, UseCaseError>>;

// UpdateGroupUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UpdateGroupUseCase } from "webiny/api/cms/group";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/update-group.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
