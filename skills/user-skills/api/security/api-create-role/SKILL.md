---
name: api-create-role
category: api/security
type: UseCase
class: CreateRoleUseCase
import: webiny/api/security/role
description: >
  Programmatically create role.
---

# Create Role

Programmatically create role.

**Import:** `import { CreateRoleUseCase } from "webiny/api/security/role";`

## Types

```typescript
import { CreateRoleUseCase } from "webiny/api/security/role";

// CreateRoleUseCase.Interface

// CreateRoleUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CreateRoleUseCase } from "webiny/api/security/role";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/create-role.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
