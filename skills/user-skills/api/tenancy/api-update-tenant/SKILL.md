---
name: api-update-tenant
category: api/tenancy
type: UseCase
class: UpdateTenantUseCase
import: webiny/api/tenancy
description: >
  Programmatically update tenant.
---

# Update Tenant

Programmatically update tenant.

**Import:** `import { UpdateTenantUseCase } from "webiny/api/tenancy";`

## Types

```typescript
import { UpdateTenantUseCase } from "webiny/api/tenancy";

// UpdateTenantUseCase.Interface

// UpdateTenantUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UpdateTenantUseCase } from "webiny/api/tenancy";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/update-tenant.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
