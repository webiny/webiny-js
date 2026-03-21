---
name: api-delete-tenant
category: api/tenancy
type: UseCase
class: DeleteTenantUseCase
import: webiny/api/tenancy
description: >
  Programmatically delete tenant.
---

# Delete Tenant

Programmatically delete tenant.

**Import:** `import { DeleteTenantUseCase } from "webiny/api/tenancy";`

## Types

```typescript
import { DeleteTenantUseCase } from "webiny/api/tenancy";

// DeleteTenantUseCase.Interface

// DeleteTenantUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { DeleteTenantUseCase } from "webiny/api/tenancy";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/delete-tenant.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
