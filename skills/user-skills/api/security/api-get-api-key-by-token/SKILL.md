---
name: api-get-api-key-by-token
category: api/security
type: UseCase
class: GetApiKeyByTokenUseCase
import: webiny/api/security/api-key
description: >
  Programmatically get apikeybytoken.
---

# Get Api Key By Token

Programmatically get apikeybytoken.

**Import:** `import { GetApiKeyByTokenUseCase } from "webiny/api/security/api-key";`

## Types

```typescript
import { GetApiKeyByTokenUseCase } from "webiny/api/security/api-key";

// GetApiKeyByTokenUseCase.Interface

// GetApiKeyByTokenUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetApiKeyByTokenUseCase } from "webiny/api/security/api-key";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-api-key-by-token.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
