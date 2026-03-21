---
name: api-get-settings
category: api/file-manager
type: UseCase
class: GetSettingsUseCase
import: webiny/api/file-manager/settings
description: >
  Programmatically get settings.
---

# Get Settings

Programmatically get settings.

**Import:** `import { GetSettingsUseCase } from "webiny/api/file-manager/settings";`

## Types

```typescript
import { GetSettingsUseCase } from "webiny/api/file-manager/settings";

// GetSettingsUseCase.Interface
type Interface = IGetSettingsUseCase;

// GetSettingsUseCase.Error
type Error = UseCaseError;

// GetSettingsUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetSettingsUseCase } from "webiny/api/file-manager/settings";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-settings.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
