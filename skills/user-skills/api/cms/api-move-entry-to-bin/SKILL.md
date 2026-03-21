---
name: api-move-entry-to-bin
category: api/cms
type: UseCase
class: MoveEntryToBinUseCase
import: webiny/api/cms/entry
description: >
  Programmatically move entrytobin.
---

# Move Entry To Bin

Programmatically move entrytobin.

**Import:** `import { MoveEntryToBinUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { MoveEntryToBinUseCase } from "webiny/api/cms/entry";

// MoveEntryToBinUseCase.Interface
type Interface = IMoveEntryToBinUseCase;

// MoveEntryToBinUseCase.Error
type Error = UseCaseError;

// MoveEntryToBinUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { MoveEntryToBinUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/move-entry-to-bin.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
