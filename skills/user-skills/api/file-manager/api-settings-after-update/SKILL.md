---
name: api-settings-after-update
category: api/file-manager
type: EventHandler
class: SettingsAfterUpdateEventHandler
import: webiny/api/file-manager/settings
description: >
  React after settings is updated. Side effects, notifications, external sync.
---

# Settings After Update

React after settings is updated. Side effects, notifications, external sync.

**Import:** `import { SettingsAfterUpdateEventHandler as Handler } from "webiny/api/file-manager/settings";`
**Fires:** After settings is updated
**Timing:** after

## Types

```typescript
import { SettingsAfterUpdateEventHandler as Handler } from "webiny/api/file-manager/settings";

// SettingsAfterUpdateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// SettingsAfterUpdateEventHandler.Event
// Event payload:
export interface SettingsAfterUpdatePayload {
    original: FileManagerSettings;
    settings: FileManagerSettings;
    input: UpdateSettingsInput;
}

// SettingsAfterUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { SettingsAfterUpdateEventHandler as Handler } from "webiny/api/file-manager/settings";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/settings-after-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-settings-before-update` — intercept before settings update
- `dependency-injection` — inject Logger, BuildParams, and other services
