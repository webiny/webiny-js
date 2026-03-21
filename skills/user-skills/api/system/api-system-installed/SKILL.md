---
name: api-system-installed
category: api/system
type: EventHandler
class: SystemInstalledEventHandler
import: webiny/api/system
description: >
  React when system is installedd.
---

# System Installed

React when system is installedd.

**Import:** `import { SystemInstalledEventHandler as Handler } from "webiny/api/system";`
**Fires:** When system is installedd
**Timing:** none

## Types

```typescript
import { SystemInstalledEventHandler as Handler } from "webiny/api/system";

// SystemInstalledEventHandler.Interface

// SystemInstalledEventHandler.Event

// SystemInstalledEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { SystemInstalledEventHandler as Handler } from "webiny/api/system";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/system--installed.ts"} />
```

## Notes

- This is a lifecycle event without before/after timing
- Use for reacting to system-level events

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
