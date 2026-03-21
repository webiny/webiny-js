---
name: api-create-group
category: api/cms
type: UseCase
class: CreateGroupUseCase
import: webiny/api/cms/group
description: >
  Programmatically create group.
---

# Create Group

Programmatically create group.

**Import:** `import { CreateGroupUseCase } from "webiny/api/cms/group";`

## Types

```typescript
import { CreateGroupUseCase } from "webiny/api/cms/group";

// CreateGroupUseCase.Interface
type Interface = ICreateGroupUseCase;

// CreateGroupUseCase.Input
type Input = CmsGroupCreateInput;

// CreateGroupUseCase.Error
type Error = UseCaseError;

// CreateGroupUseCase.Return
type Return = Promise<Result<CmsGroup, UseCaseError>>;

// CreateGroupUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CreateGroupUseCase } from "webiny/api/cms/group";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/create-group.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
