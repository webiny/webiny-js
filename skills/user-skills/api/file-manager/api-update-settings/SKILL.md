---
name: api-update-settings
category: api/file-manager
type: UseCase
class: UpdateSettingsUseCase
import: webiny/api/file-manager/settings
description: >
  Programmatically update settings.
---

# Update Settings

Programmatically update settings.

**Import:** `import { UpdateSettingsUseCase } from "webiny/api/file-manager/settings";`

## Types

```typescript
import { UpdateSettingsUseCase } from "webiny/api/file-manager/settings";

// UpdateSettingsUseCase.Interface
type Interface = IUpdateSettingsUseCase;

// UpdateSettingsUseCase.Error
type Error = UseCaseError;

// UpdateSettingsUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UpdateSettingsUseCase } from "webiny/api/file-manager/settings";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/update-settings.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
