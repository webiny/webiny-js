---
name: api-delete-api-key
category: api/security
type: UseCase
class: DeleteApiKeyUseCase
import: webiny/api/security/api-key
description: >
  Programmatically delete apikey.
---

# Delete Api Key

Programmatically delete apikey.

**Import:** `import { DeleteApiKeyUseCase } from "webiny/api/security/api-key";`

## Types

```typescript
import { DeleteApiKeyUseCase } from "webiny/api/security/api-key";

// DeleteApiKeyUseCase.Interface

// DeleteApiKeyUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { DeleteApiKeyUseCase } from "webiny/api/security/api-key";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/delete-api-key.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
