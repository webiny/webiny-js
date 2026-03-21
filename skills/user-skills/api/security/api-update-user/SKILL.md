---
name: api-update-user
category: api/security
type: UseCase
class: UpdateUserUseCase
import: webiny/api/security/user
description: >
  Programmatically update user.
---

# Update User

Programmatically update user.

**Import:** `import { UpdateUserUseCase } from "webiny/api/security/user";`

## Types

```typescript
import { UpdateUserUseCase } from "webiny/api/security/user";

// UpdateUserUseCase.Interface

// UpdateUserUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UpdateUserUseCase } from "webiny/api/security/user";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/update-user.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
