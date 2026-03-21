---
name: api-update-role
category: api/security
type: UseCase
class: UpdateRoleUseCase
import: webiny/api/security/role
description: >
  Programmatically update role.
---

# Update Role

Programmatically update role.

**Import:** `import { UpdateRoleUseCase } from "webiny/api/security/role";`

## Types

```typescript
import { UpdateRoleUseCase } from "webiny/api/security/role";

// UpdateRoleUseCase.Interface

// UpdateRoleUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UpdateRoleUseCase } from "webiny/api/security/role";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/update-role.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
