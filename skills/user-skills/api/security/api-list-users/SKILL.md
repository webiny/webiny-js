---
name: api-list-users
category: api/security
type: UseCase
class: ListUsersUseCase
import: webiny/api/security/user
description: >
  Programmatically list users.
---

# List Users

Programmatically list users.

**Import:** `import { ListUsersUseCase } from "webiny/api/security/user";`

## Types

```typescript
import { ListUsersUseCase } from "webiny/api/security/user";

// ListUsersUseCase.Interface

// ListUsersUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListUsersUseCase } from "webiny/api/security/user";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-users.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
