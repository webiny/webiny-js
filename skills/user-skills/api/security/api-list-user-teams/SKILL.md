---
name: api-list-user-teams
category: api/security
type: UseCase
class: ListUserTeamsUseCase
import: webiny/api/security/user
description: >
  Programmatically list userteams.
---

# List User Teams

Programmatically list userteams.

**Import:** `import { ListUserTeamsUseCase } from "webiny/api/security/user";`

## Types

```typescript
import { ListUserTeamsUseCase } from "webiny/api/security/user";

// ListUserTeamsUseCase.Interface

// ListUserTeamsUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListUserTeamsUseCase } from "webiny/api/security/user";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-user-teams.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
