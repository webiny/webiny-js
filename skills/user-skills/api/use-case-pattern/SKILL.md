---
name: webiny-use-case-pattern
context: webiny-api
description: >
  Generic UseCase implementation pattern — DI, Result handling, extension registration.
  Use this skill to understand how to implement, inject, or override any Webiny UseCase.
---

# UseCase Pattern

## What It Is

A **UseCase** is a named operation that encapsulates business logic (e.g., `CreateTenantUseCase`, `PublishEntryUseCase`). Each UseCase is a DI abstraction with a single `execute` method.

## Interface Shape

Every UseCase follows this pattern:

```ts
interface SomeUseCase.Interface {
    execute(input: Input): Promise<Result<ReturnType, ErrorType>>;
}
```

- **Input** — a typed object specific to the use case
- **Result** — always returns `Result<T, E>` from `@webiny/feature/api`
- **Error** — extends `BaseError` with a unique `code`

## How to Use a UseCase

UseCases are injected as dependencies into EventHandlers or other UseCases via DI.

```ts
import { SomeUseCase } from "webiny/api/<category>";
import { SomeEventHandler } from "webiny/api/<category>";

class MyHandler implements SomeEventHandler.Interface {
    constructor(private someUseCase: SomeUseCase.Interface) {}

    async handle(event: SomeEventHandler.Event) {
        const result = await this.someUseCase.execute({ /* input */ });

        if (result.isFail()) {
            console.error(result.error.message);
            return;
        }

        const value = result.value;
        // ... use value
    }
}

export default SomeEventHandler.createImplementation({
    implementation: MyHandler,
    dependencies: [SomeUseCase]
});
```

## How to Override a UseCase

To replace the default implementation, register your own:

```ts
import { SomeUseCase } from "webiny/api/<category>";

class CustomImplementation implements SomeUseCase.Interface {
    async execute(input) {
        // Custom logic
        return Result.ok(/* ... */);
    }
}

export default SomeUseCase.createImplementation({
    implementation: CustomImplementation,
    dependencies: []
});
```

## Registration

```tsx
// In your app's configuration
<Api.Extension src={"@/extensions/my-extension.ts"} />
```

Deploy with: `yarn webiny deploy api --env=dev`

## Resolving Types

To see the exact `Input`, `Return`, and `Error` types for a specific UseCase, read the `sourceFilePath` from the catalog. The abstractions file contains:

- The `Interface` with the full method signature
- The `Errors` type union
- The namespace with `Interface` and `Errors` type aliases

## Key Rules

- Always check `result.isOk()` or `result.isFail()` before accessing `.value` or `.error`
- DI constructor parameter order must match the `dependencies` array order exactly
- Use `.js` extensions in import paths (ES modules)
