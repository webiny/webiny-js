---
name: api-list-roles
category: api/security
type: UseCase
class: ListRolesUseCase
import: webiny/api/security/role
description: >
  Programmatically list roles.
---

# List Roles

Programmatically list roles.

**Import:** `import { ListRolesUseCase } from "webiny/api/security/role";`

## Types

```typescript
import { ListRolesUseCase } from "webiny/api/security/role";

// ListRolesUseCase.Interface

// ListRolesUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListRolesUseCase } from "webiny/api/security/role";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-roles.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
