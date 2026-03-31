---
name: webiny-event-handler-pattern
context: webiny-api
description: >
  EventHandler implementation pattern — handle method, event payloads, filtering, DI,
  domain event definition, publishing events from UseCases, and reacting to external events.
  Use this skill to implement any Webiny EventHandler (before/after hooks) or to define
  and publish your own domain events.
---

# EventHandler Pattern

## What It Is

An **EventHandler** reacts to domain events in the Webiny lifecycle (e.g., `EntryBeforeCreateEventHandler`, `TenantAfterDeleteEventHandler`). Each handler is a DI abstraction with a single `handle` method.

## Naming Convention

- `{Entity}Before{Operation}EventHandler` — fires before persistence, can validate/transform/reject
- `{Entity}After{Operation}EventHandler` — fires after persistence, for side effects

## Interface Shape

```ts
interface SomeEventHandler.Interface {
    handle(event: SomeEventHandler.Event): Promise<void>;
}
```

The `Event` is a `DomainEvent<Payload>` where the payload contains the entity and input data.

## Architecture Rule: Always Wrap Logic in a Reusable Abstraction (MANDATORY)

**Never put business logic directly inside an EventHandler.** EventHandlers are thin orchestrators — they receive an event and delegate to an injected service or use case. The real logic lives in a dedicated abstraction.

**Why:** Inline handler logic cannot be reused by other handlers, GraphQL resolvers, or CLI commands.

**Always follow this structure:**

```
features/
├── myService/             ← the reusable abstraction
│   ├── abstractions.ts
│   ├── feature.ts
│   └── MyService.ts
└── syncOnCreate/          ← thin handler that injects the service
    ├── feature.ts
    └── EntryAfterCreateHandler.ts
```

The EventHandler feature and the service feature are **registered separately** in `Extension.ts`.

## How to Implement

```ts
import { SomeEventHandler } from "webiny/api/<category>";
import { MyService } from "../myService/abstractions.js";

// ✅ Handler is a thin orchestrator — no business logic here
class MyHandler implements SomeEventHandler.Interface {
  constructor(private myService: MyService.Interface) {}

  async handle(event: SomeEventHandler.Event) {
    const { entity, model } = event.payload;

    // For CMS handlers: ALWAYS filter by model
    if (model.modelId !== "myModel") return;

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

EventHandlers can depend on UseCases, platform services, or custom abstractions:

```ts
import { SomeEventHandler } from "webiny/api/<category>";
import { SomeUseCase } from "webiny/api/<category>";

class MyHandler implements SomeEventHandler.Interface {
  constructor(private someUseCase: SomeUseCase.Interface) {}

  async handle(event: SomeEventHandler.Event) {
    const result = await this.someUseCase.execute({ /* ... */ });
  }
}

export default SomeEventHandler.createImplementation({
  implementation: MyHandler,
  dependencies: [SomeUseCase]
});
```

---

## Defining Your Own Domain Events

When your feature needs to notify other parts of the system about important domain actions, define your own events.

### Event Payload Types (in `abstractions.ts`)

Event payloads and handler abstractions live in `abstractions.ts`. The `events.ts` file only contains the event classes.

```ts
// features/disableEntity/abstractions.ts
import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { Entity } from "~/shared/Entity.js";
// Forward declaration — actual classes are in events.ts
import type { EntityBeforeDisableEvent, EntityAfterDisableEvent } from "./events.js";

// Event Payload Types
export interface EntityBeforeDisablePayload {
    entity: Entity;
}

export interface EntityAfterDisablePayload {
    entity: Entity;
}

// Handler Abstractions — one per event
export const EntityBeforeDisableEventHandler = createAbstraction<
    IEventHandler<EntityBeforeDisableEvent>
>("MyPackage/EntityBeforeDisableEventHandler");

export namespace EntityBeforeDisableEventHandler {
    export type Interface = IEventHandler<EntityBeforeDisableEvent>;
    export type Event = EntityBeforeDisableEvent;
}

export const EntityAfterDisableEventHandler = createAbstraction<
    IEventHandler<EntityAfterDisableEvent>
>("MyPackage/EntityAfterDisableEventHandler");

export namespace EntityAfterDisableEventHandler {
    export type Interface = IEventHandler<EntityAfterDisableEvent>;
    export type Event = EntityAfterDisableEvent;
}
```

### Event Class Definition (`events.ts`)

Event classes import payload types and handler abstractions from `abstractions.ts`.

```ts
// features/disableEntity/events.ts
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import {
    EntityBeforeDisableEventHandler,
    EntityAfterDisableEventHandler
} from "./abstractions.js";
import type {
    EntityBeforeDisablePayload,
    EntityAfterDisablePayload
} from "./abstractions.js";

export class EntityBeforeDisableEvent extends DomainEvent<EntityBeforeDisablePayload> {
    eventType = "entity.beforeDisable" as const;

    getHandlerAbstraction() {
        return EntityBeforeDisableEventHandler;
    }
}

export class EntityAfterDisableEvent extends DomainEvent<EntityAfterDisablePayload> {
    eventType = "entity.afterDisable" as const;

    getHandlerAbstraction() {
        return EntityAfterDisableEventHandler;
    }
}
```

### Publishing Events from a UseCase

```ts
// features/disableEntity/DisableEntityUseCase.ts
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { EntityBeforeDisableEvent, EntityAfterDisableEvent } from "./events.js";

class DisableEntityUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisher.Interface,
        private getEntityById: GetEntityByIdUseCase.Interface,
        private updateEntity: UpdateEntityUseCase.Interface
    ) {}

    async execute(entityId: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        const getResult = await this.getEntityById.execute(entityId);
        if (getResult.isFail()) return Result.fail(getResult.error);

        const entity = getResult.value;

        // Publish BEFORE event (can be intercepted to reject)
        await this.eventPublisher.publish(new EntityBeforeDisableEvent({ entity }));

        // Perform the operation
        const updateResult = await this.updateEntity.execute(entityId, { status: "disabled" });
        if (updateResult.isFail()) return Result.fail(updateResult.error);

        // Publish AFTER event (for side effects)
        await this.eventPublisher.publish(new EntityAfterDisableEvent({ entity: updateResult.value }));

        return Result.ok();
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: DisableEntityUseCase,
    dependencies: [EventPublisher, GetEntityByIdUseCase, UpdateEntityUseCase]
});
```

---

## Reacting to External Events

To react to events from other packages (e.g., CMS entry deletion), implement the external event's handler abstraction:

```ts
// features/cleanupOnEntryDelete/CleanupOnEntryDeleteHandler.ts
import { EntryAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.js";
import { CleanupService } from "../cleanupService/abstractions.js";
import { MY_MODEL_ID } from "~/shared/constants.js";

class CleanupOnEntryDeleteHandler implements EntryAfterDeleteEventHandler.Interface {
    constructor(private cleanupService: CleanupService.Interface) {}

    async handle(event: EntryAfterDeleteEventHandler.Event): Promise<void> {
        const { entry, model } = event.payload;

        // ALWAYS filter by model — handler fires for ALL models
        if (model.modelId !== MY_MODEL_ID) return;

        if (!event.payload.permanent) return;

        await this.cleanupService.cleanup(entry.entryId);
    }
}

export default EntryAfterDeleteEventHandler.createImplementation({
    implementation: CleanupOnEntryDeleteHandler,
    dependencies: [CleanupService]
});
```

---

## Event Naming Conventions

| Artifact           | Pattern                                        | Example                            |
| ------------------ | ---------------------------------------------- | ---------------------------------- |
| `eventType`        | `"entity.beforeAction"` / `"entity.afterAction"` | `"tenant.beforeDisable"`          |
| Handler abstraction | `{Entity}{Before\|After}{Action}EventHandler` | `TenantBeforeDisableEventHandler` |
| Event class        | `{Entity}{Before\|After}{Action}Event`         | `TenantBeforeDisableEvent`        |

## Registration

**YOU MUST include the full file path with the `.ts` extension in the `src` prop.** For example, use `src={"@/extensions/my-handler.ts"}`, NOT `src={"@/extensions/my-handler"}`. Omitting the file extension will cause a build failure.

**YOU MUST use `export default` for the `createImplementation()` call** when the file is targeted directly by an Extension `src` prop. Using a named export (`export const Foo = SomeFactory.createImplementation(...)`) will cause a build failure. Named exports are only valid inside files registered via `createFeature`.

```tsx
<Api.Extension src={"@/extensions/my-handler.ts"} />
```

Deploy with: `yarn webiny deploy api --env=dev`

## Resolving Types (MANDATORY)

**Before writing any code that accesses event payload properties or domain types (CmsEntry, CmsModel, etc.), you MUST read the source file listed in the catalog's `Source` field to verify the exact property names and types. Do not assume or guess property names from memory.**

1. Read the `abstractions.ts` file from the catalog `Source` path — it contains the payload interface
2. Read the `events.ts` file (sibling to `abstractions.ts`) — it contains the `Interface` and `Event` types
3. If the payload references domain types, follow the import and read that declaration

## Key Rules

- **Before handlers**: payload may be mutable — write to it to set computed fields. Throw to reject the operation.
- **After handlers**: payload reflects persisted state — do not mutate. Use for side effects.
- **Filter by entity**: handlers fire for ALL entities of that type. Always check `modelId`, `entity type`, etc.
- **Events extend** `DomainEvent<TPayload>` with `eventType` property (not `static type`)
- **Every event must** implement `getHandlerAbstraction()` returning its handler abstraction
- **Every handler abstraction** must have a namespace with `Interface` and `Event` types
- **Payload types** live in `abstractions.ts`; event classes live in `events.ts`
- **Publish order**: before event → operation → after event
- DI constructor parameter order must match the `dependencies` array order exactly
- Use `.js` extensions in import paths (ES modules)

## Related Skills

- **webiny-api-architect** — Architecture overview, Services vs UseCases, feature naming
- **webiny-use-case-pattern** — UseCase implementation where events are published from
- **webiny-dependency-injection** — Injectable services catalog
