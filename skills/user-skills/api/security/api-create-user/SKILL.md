---
name: api-create-user
category: api/security
type: UseCase
class: CreateUserUseCase
import: webiny/api/security/user
description: >
  Programmatically create user.
---

# Create User

Programmatically create user.

**Import:** `import { CreateUserUseCase } from "webiny/api/security/user";`

## Types

```typescript
import { CreateUserUseCase } from "webiny/api/security/user";

// CreateUserUseCase.Interface

// CreateUserUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CreateUserUseCase } from "webiny/api/security/user";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/create-user.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
