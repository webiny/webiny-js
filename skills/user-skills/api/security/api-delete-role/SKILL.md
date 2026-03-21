---
name: api-delete-role
category: api/security
type: UseCase
class: DeleteRoleUseCase
import: webiny/api/security/role
description: >
  Programmatically delete role.
---

# Delete Role

Programmatically delete role.

**Import:** `import { DeleteRoleUseCase } from "webiny/api/security/role";`

## Types

```typescript
import { DeleteRoleUseCase } from "webiny/api/security/role";

// DeleteRoleUseCase.Interface

// DeleteRoleUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { DeleteRoleUseCase } from "webiny/api/security/role";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/delete-role.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
