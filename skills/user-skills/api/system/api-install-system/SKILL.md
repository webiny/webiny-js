---
name: api-install-system
category: api/system
type: UseCase
class: InstallSystemUseCase
import: webiny/api/system
description: >
  Programmatically install system.
---

# Install System

Programmatically install system.

**Import:** `import { InstallSystemUseCase } from "webiny/api/system";`

## Types

```typescript
import { InstallSystemUseCase } from "webiny/api/system";

// InstallSystemUseCase.Interface

// InstallSystemUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { InstallSystemUseCase } from "webiny/api/system";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/install-system.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
