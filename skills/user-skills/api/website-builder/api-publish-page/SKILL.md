---
name: api-publish-page
category: api/website-builder
type: UseCase
class: PublishPageUseCase
import: webiny/api/website-builder/page
description: >
  Programmatically publish page.
---

# Publish Page

Programmatically publish page.

**Import:** `import { PublishPageUseCase } from "webiny/api/website-builder/page";`

## Types

```typescript
import { PublishPageUseCase } from "webiny/api/website-builder/page";

// PublishPageUseCase.Interface
type Interface = IPublishPageUseCase;

// PublishPageUseCase.Error
type Error = UseCaseError;

// PublishPageUseCase.Return
type Return = Promise<Result<WbPage, UseCaseError>>;

// PublishPageUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PublishPageUseCase } from "webiny/api/website-builder/page";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/publish-page.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
