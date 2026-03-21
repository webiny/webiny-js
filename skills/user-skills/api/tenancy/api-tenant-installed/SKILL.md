---
name: api-tenant-installed
category: api/tenancy
type: EventHandler
class: TenantInstalledEventHandler
import: webiny/api/tenancy
description: >
  React when tenant is installedd.
---

# Tenant Installed

React when tenant is installedd.

**Import:** `import { TenantInstalledEventHandler as Handler } from "webiny/api/tenancy";`
**Fires:** When tenant is installedd
**Timing:** none

## Types

```typescript
import { TenantInstalledEventHandler as Handler } from "webiny/api/tenancy";

// TenantInstalledEventHandler.Interface

// TenantInstalledEventHandler.Event

// TenantInstalledEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { TenantInstalledEventHandler as Handler } from "webiny/api/tenancy";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/tenant--installed.ts"} />
```

## Notes

- This is a lifecycle event without before/after timing
- Use for reacting to system-level events

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
