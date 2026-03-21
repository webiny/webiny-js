---
name: api-create-api-key
category: api/security
type: UseCase
class: CreateApiKeyUseCase
import: webiny/api/security/api-key
description: >
  Programmatically create apikey.
---

# Create Api Key

Programmatically create apikey.

**Import:** `import { CreateApiKeyUseCase } from "webiny/api/security/api-key";`

## Types

```typescript
import { CreateApiKeyUseCase } from "webiny/api/security/api-key";

// CreateApiKeyUseCase.Interface

// CreateApiKeyUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CreateApiKeyUseCase } from "webiny/api/security/api-key";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/create-api-key.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
