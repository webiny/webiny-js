---
name: api-get-role
category: api/security
type: UseCase
class: GetRoleUseCase
import: webiny/api/security/role
description: >
  Programmatically get role.
---

# Get Role

Programmatically get role.

**Import:** `import { GetRoleUseCase } from "webiny/api/security/role";`

## Types

```typescript
import { GetRoleUseCase } from "webiny/api/security/role";

// GetRoleUseCase.Interface

// GetRoleUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetRoleUseCase } from "webiny/api/security/role";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-role.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
