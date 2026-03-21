---
name: api-delete-user
category: api/security
type: UseCase
class: DeleteUserUseCase
import: webiny/api/security/user
description: >
  Programmatically delete user.
---

# Delete User

Programmatically delete user.

**Import:** `import { DeleteUserUseCase } from "webiny/api/security/user";`

## Types

```typescript
import { DeleteUserUseCase } from "webiny/api/security/user";

// DeleteUserUseCase.Interface

// DeleteUserUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { DeleteUserUseCase } from "webiny/api/security/user";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/delete-user.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
