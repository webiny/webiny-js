---
name: webiny-event-handler-pattern
context: webiny-api
description: >
  Generic EventHandler implementation pattern — handle method, event payloads, filtering, DI.
  Use this skill to understand how to implement any Webiny EventHandler (before/after hooks).
---

# EventHandler Pattern

## What It Is

An **EventHandler** reacts to domain events in the Webiny lifecycle (e.g., `EntryBeforeCreateEventHandler`, `TenantAfterDeleteEventHandler`). Each handler is a DI abstraction with a single `handle` method.

## Naming Convention

- `{Entity}Before{Operation}EventHandler` — fires before persistence, can validate/transform/reject
- `{Entity}After{Operation}EventHandler` — fires after persistence, for side effects

## Interface Shape

Every EventHandler follows this pattern:

```ts
interface SomeEventHandler.Interface {
    handle(event: SomeEventHandler.Event): Promise<void>;
}
```

The `Event` is a `DomainEvent<Payload>` where the payload contains the entity and input data.

## How to Implement

```ts
import { SomeEventHandler } from "webiny/api/<category>";

class MyHandler implements SomeEventHandler.Interface {
    async handle(event: SomeEventHandler.Event) {
        const { entity, input } = event.payload;

        // For CMS handlers: always filter by model
        // if (model.modelId !== "myModel") return;

        // Your logic here
    }
}

export default SomeEventHandler.createImplementation({
    implementation: MyHandler,
    dependencies: []
});
```

## Injecting Dependencies

EventHandlers can depend on UseCases or other abstractions:

```ts
import { SomeEventHandler } from "webiny/api/<category>";
import { SomeUseCase } from "webiny/api/<category>";

class MyHandler implements SomeEventHandler.Interface {
    constructor(private someUseCase: SomeUseCase.Interface) {}

    async handle(event: SomeEventHandler.Event) {
        // Use the injected dependency
        const result = await this.someUseCase.execute({ /* ... */ });
    }
}

export default SomeEventHandler.createImplementation({
    implementation: MyHandler,
    dependencies: [SomeUseCase]
});
```

## Registration

```tsx
<Api.Extension src={"@/extensions/my-handler.ts"} />
```

Deploy with: `yarn webiny deploy api --env=dev`

## Resolving Types

To see the exact event payload types for a specific EventHandler, read the `sourceFilePath` from the catalog. The abstractions file contains:

- The `Interface` — `IEventHandler<DomainEvent<Payload>>`
- The namespace with `Interface` and `Event` type aliases

The corresponding `events.ts` file (sibling to `abstractions.ts`) contains the full payload interface.

## Key Rules

- **Before handlers**: payload may be mutable — write to it to set computed fields. Throw to reject the operation.
- **After handlers**: payload reflects persisted state — do not mutate. Use for side effects.
- **Filter by entity**: handlers fire for ALL entities of that type. Always check `modelId`, `entity type`, etc.
- DI constructor parameter order must match the `dependencies` array order exactly
- Use `.js` extensions in import paths (ES modules)
