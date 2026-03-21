---
name: api-create-tenant
category: api/tenancy
type: UseCase
class: CreateTenantUseCase
import: webiny/api/tenancy
description: >
  Programmatically create tenant.
---

# Create Tenant

Programmatically create tenant.

**Import:** `import { CreateTenantUseCase } from "webiny/api/tenancy";`

## Types

```typescript
import { CreateTenantUseCase } from "webiny/api/tenancy";

// CreateTenantUseCase.Interface

// CreateTenantUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CreateTenantUseCase } from "webiny/api/tenancy";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/create-tenant.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
