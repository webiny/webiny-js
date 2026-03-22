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

## Resolving Types (MANDATORY)

**Before writing any code that accesses event payload properties or domain types (CmsEntry, CmsModel, etc.), you MUST read the source file listed in the catalog's `Source` field to verify the exact property names and types. Do not assume or guess property names from memory.**

To see the exact event payload types for a specific EventHandler:

1. Read the `abstractions.ts` file from the catalog `Source` path — it contains the payload interface with all property names and types.
2. Read the `events.ts` file (sibling to `abstractions.ts`) — it contains the `Interface` and `Event` type aliases.
3. If the payload references domain types (e.g., `CmsEntry`, `CmsModel`), follow the import and read that type declaration too.

Only use properties that are confirmed to exist in the source type declarations.

## Key Rules

- **Before handlers**: payload may be mutable — write to it to set computed fields. Throw to reject the operation.
- **After handlers**: payload reflects persisted state — do not mutate. Use for side effects.
- **Filter by entity**: handlers fire for ALL entities of that type. Always check `modelId`, `entity type`, etc.
- DI constructor parameter order must match the `dependencies` array order exactly
- Use `.js` extensions in import paths (ES modules)
