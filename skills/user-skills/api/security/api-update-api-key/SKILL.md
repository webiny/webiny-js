---
name: api-update-api-key
category: api/security
type: UseCase
class: UpdateApiKeyUseCase
import: webiny/api/security/api-key
description: >
  Programmatically update apikey.
---

# Update Api Key

Programmatically update apikey.

**Import:** `import { UpdateApiKeyUseCase } from "webiny/api/security/api-key";`

## Types

```typescript
import { UpdateApiKeyUseCase } from "webiny/api/security/api-key";

// UpdateApiKeyUseCase.Interface

// UpdateApiKeyUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UpdateApiKeyUseCase } from "webiny/api/security/api-key";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/update-api-key.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
