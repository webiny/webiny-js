---
name: api-install-tenant
category: api/tenancy
type: UseCase
class: InstallTenantUseCase
import: webiny/api/tenancy
description: >
  Programmatically install tenant.
---

# Install Tenant

Programmatically install tenant.

**Import:** `import { InstallTenantUseCase } from "webiny/api/tenancy";`

## Types

```typescript
import { InstallTenantUseCase } from "webiny/api/tenancy";

// InstallTenantUseCase.Interface

// InstallTenantUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { InstallTenantUseCase } from "webiny/api/tenancy";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/install-tenant.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
