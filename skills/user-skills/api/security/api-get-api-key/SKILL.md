---
name: api-get-api-key
category: api/security
type: UseCase
class: GetApiKeyUseCase
import: webiny/api/security/api-key
description: >
  Programmatically get apikey.
---

# Get Api Key

Programmatically get apikey.

**Import:** `import { GetApiKeyUseCase } from "webiny/api/security/api-key";`

## Types

```typescript
import { GetApiKeyUseCase } from "webiny/api/security/api-key";

// GetApiKeyUseCase.Interface

// GetApiKeyUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetApiKeyUseCase } from "webiny/api/security/api-key";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-api-key.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
