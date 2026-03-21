---
name: api-authentication-before-authentication
category: api/security
type: EventHandler
class: BeforeAuthenticationEventHandler
import: webiny/api/security/authentication
description: >
  Intercept authentication authentication before it is persisted. Validate, transform, or reject.
---

# Authentication Before Authentication

Intercept authentication authentication before it is persisted. Validate, transform, or reject.

**Import:** `import { BeforeAuthenticationEventHandler as Handler } from "webiny/api/security/authentication";`
**Fires:** Before authentication is authenticationd
**Timing:** before

## Types

```typescript
import { BeforeAuthenticationEventHandler as Handler } from "webiny/api/security/authentication";

// BeforeAuthenticationEventHandler.Interface

// BeforeAuthenticationEventHandler.Event

// BeforeAuthenticationEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { BeforeAuthenticationEventHandler as Handler } from "webiny/api/security/authentication";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/authentication-before-authentication.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-authentication-after-authentication` — react after authentication authentication
- `dependency-injection` — inject Logger, BuildParams, and other services
