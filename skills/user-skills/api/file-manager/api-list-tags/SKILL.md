---
name: api-list-tags
category: api/file-manager
type: UseCase
class: ListTagsUseCase
import: webiny/api/file-manager/file
description: >
  Programmatically list tags.
---

# List Tags

Programmatically list tags.

**Import:** `import { ListTagsUseCase } from "webiny/api/file-manager/file";`

## Types

```typescript
import { ListTagsUseCase } from "webiny/api/file-manager/file";

// ListTagsUseCase.Interface
type Interface = IListTagsUseCase;

// ListTagsUseCase.Error
type Error = UseCaseError;

// ListTagsUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListTagsUseCase } from "webiny/api/file-manager/file";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-tags.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
