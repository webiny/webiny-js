---
name: api-list-groups
category: api/cms
type: UseCase
class: ListGroupsUseCase
import: webiny/api/cms/group
description: >
  Programmatically list groups.
---

# List Groups

Programmatically list groups.

**Import:** `import { ListGroupsUseCase } from "webiny/api/cms/group";`

## Types

```typescript
import { ListGroupsUseCase } from "webiny/api/cms/group";

// ListGroupsUseCase.Interface
type Interface = IListGroupsUseCase;

// ListGroupsUseCase.Error
type Error = UseCaseError;

// ListGroupsUseCase.Return
type Return = Promise<Result<CmsGroup[], UseCaseError>>;

// ListGroupsUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListGroupsUseCase } from "webiny/api/cms/group";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-groups.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
