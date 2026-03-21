---
name: api-list-api-keys
category: api/security
type: UseCase
class: ListApiKeysUseCase
import: webiny/api/security/api-key
description: >
  Programmatically list apikeys.
---

# List Api Keys

Programmatically list apikeys.

**Import:** `import { ListApiKeysUseCase } from "webiny/api/security/api-key";`

## Types

```typescript
import { ListApiKeysUseCase } from "webiny/api/security/api-key";

// ListApiKeysUseCase.Interface

// ListApiKeysUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListApiKeysUseCase } from "webiny/api/security/api-key";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-api-keys.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
