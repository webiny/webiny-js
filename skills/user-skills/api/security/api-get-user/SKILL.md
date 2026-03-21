---
name: api-get-user
category: api/security
type: UseCase
class: GetUserUseCase
import: webiny/api/security/user
description: >
  Programmatically get user.
---

# Get User

Programmatically get user.

**Import:** `import { GetUserUseCase } from "webiny/api/security/user";`

## Types

```typescript
import { GetUserUseCase } from "webiny/api/security/user";

// GetUserUseCase.Interface

// GetUserUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetUserUseCase } from "webiny/api/security/user";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-user.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
