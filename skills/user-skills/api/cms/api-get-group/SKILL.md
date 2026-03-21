---
name: api-get-group
category: api/cms
type: UseCase
class: GetGroupUseCase
import: webiny/api/cms/group
description: >
  Programmatically get group.
---

# Get Group

Programmatically get group.

**Import:** `import { GetGroupUseCase } from "webiny/api/cms/group";`

## Types

```typescript
import { GetGroupUseCase } from "webiny/api/cms/group";

// GetGroupUseCase.Interface
type Interface = IGetGroupUseCase;

// GetGroupUseCase.Error
type Error = UseCaseError;

// GetGroupUseCase.Return
type Return = Promise<Result<CmsGroup, UseCaseError>>;

// GetGroupUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetGroupUseCase } from "webiny/api/cms/group";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-group.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
