---
name: api-settings-before-update
category: api/file-manager
type: EventHandler
class: SettingsBeforeUpdateEventHandler
import: webiny/api/file-manager/settings
description: >
  Intercept settings update before it is persisted. Validate, transform, or reject.
---

# Settings Before Update

Intercept settings update before it is persisted. Validate, transform, or reject.

**Import:** `import { SettingsBeforeUpdateEventHandler as Handler } from "webiny/api/file-manager/settings";`
**Fires:** Before settings is updated
**Timing:** before

## Types

```typescript
import { SettingsBeforeUpdateEventHandler as Handler } from "webiny/api/file-manager/settings";

// SettingsBeforeUpdateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// SettingsBeforeUpdateEventHandler.Event
// Event payload:
export interface SettingsBeforeUpdatePayload {
    original: FileManagerSettings;
    settings: FileManagerSettings;
    input: UpdateSettingsInput;
}

// SettingsBeforeUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { SettingsBeforeUpdateEventHandler as Handler } from "webiny/api/file-manager/settings";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/settings-before-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-settings-after-update` — react after settings update
- `dependency-injection` — inject Logger, BuildParams, and other services
