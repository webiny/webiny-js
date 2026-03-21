---
name: api-get-tenant-by-id
category: api/tenancy
type: UseCase
class: GetTenantByIdUseCase
import: webiny/api/tenancy
description: >
  Programmatically get tenantbyid.
---

# Get Tenant By Id

Programmatically get tenantbyid.

**Import:** `import { GetTenantByIdUseCase } from "webiny/api/tenancy";`

## Types

```typescript
import { GetTenantByIdUseCase } from "webiny/api/tenancy";

// GetTenantByIdUseCase.Interface

// GetTenantByIdUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetTenantByIdUseCase } from "webiny/api/tenancy";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-tenant-by-id.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
