---
name: api-authentication-after-authentication
category: api/security
type: EventHandler
class: AfterAuthenticationEventHandler
import: webiny/api/security/authentication
description: >
  React after authentication is authenticationd. Side effects, notifications, external sync.
---

# Authentication After Authentication

React after authentication is authenticationd. Side effects, notifications, external sync.

**Import:** `import { AfterAuthenticationEventHandler as Handler } from "webiny/api/security/authentication";`
**Fires:** After authentication is authenticationd
**Timing:** after

## Types

```typescript
import { AfterAuthenticationEventHandler as Handler } from "webiny/api/security/authentication";

// AfterAuthenticationEventHandler.Interface

// AfterAuthenticationEventHandler.Event

// AfterAuthenticationEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { AfterAuthenticationEventHandler as Handler } from "webiny/api/security/authentication";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/authentication-after-authentication.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-authentication-before-authentication` — intercept before authentication authentication
- `dependency-injection` — inject Logger, BuildParams, and other services
