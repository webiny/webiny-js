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

## Architecture Rule: Always Wrap Logic in a Reusable Abstraction (MANDATORY)

**Never put business logic directly inside an EventHandler.** EventHandlers are thin orchestrators — they receive an event and delegate to an injected service (abstraction). The real logic lives in a dedicated service defined with `createAbstraction` and `createFeature`.

**Why:** Inline handler logic cannot be reused by other handlers, GraphQL resolvers, or CLI commands. Wrapping it in an abstraction makes it injectable, testable, and replaceable.

**Always follow this structure:**

```
features/
├── myService/             ← the reusable abstraction
│   ├── abstractions.ts
│   ├── feature.ts
│   └── MyService.ts
└── myHandler/             ← thin handler that injects the service
    ├── feature.ts
    └── MyHandler.ts
```

The EventHandler feature and the service feature are **registered separately** in `Extension.tsx`.

## How to Implement

```ts
import { SomeEventHandler } from "webiny/api/<category>";
import { MyService } from "../myService/abstractions.js";

// ✅ Handler is a thin orchestrator — no business logic here
class MyHandler implements SomeEventHandler.Interface {
  constructor(private myService: MyService.Interface) {}

  async handle(event: SomeEventHandler.Event) {
    const { entity } = event.payload;

    // For CMS handlers: always filter by model
    // if (entity.modelId !== "myModel") return;

    await this.myService.doWork(entity);
  }
}

export default SomeEventHandler.createImplementation({
  implementation: MyHandler,
  dependencies: [MyService]
});
```

See **webiny-api-architect** for how to define `MyService` as a proper abstraction.

## Injecting Dependencies

EventHandlers can depend on UseCases, platform services, or your own custom abstractions:

```ts
import { SomeEventHandler } from "webiny/api/<category>";
import { SomeUseCase } from "webiny/api/<category>";

class MyHandler implements SomeEventHandler.Interface {
  constructor(private someUseCase: SomeUseCase.Interface) {}

  async handle(event: SomeEventHandler.Event) {
    const result = await this.someUseCase.execute({
      /* ... */
    });
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
