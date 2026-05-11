# Webhooks Phase 5 — `api-tenant-manager-webhooks` Tenant Bridge

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `packages/api-tenant-manager-webhooks` — the bridge package that hooks into tenant lifecycle events and feeds them into the webhook dispatcher. Because `tenant-manager` does not yet dispatch domain events for create/update/delete, this plan first adds those events to `tenant-manager`, then wires the bridge.

**Architecture:**
1. Modify `packages/tenant-manager` to add `TenantAfterCreateEvent`, `TenantAfterUpdateEvent`, `TenantAfterDeleteEvent` domain events and their handler abstractions.
2. Create `packages/api-tenant-manager-webhooks` — depends on `tenant-manager` (events) and `api-webhooks` (dispatcher).

**Prerequisite:** Phase 1 (`api-webhooks`) must be complete.

---

## File Map

```
packages/tenant-manager/
└── src/
    ├── api/
    │   └── features/
    │       ├── CreateTenant/
    │       │   ├── events.ts           ← NEW
    │       │   └── CreateTenantUseCase.ts  ← MODIFIED
    │       ├── UpdateTenant/
    │       │   ├── events.ts           ← NEW
    │       │   └── UpdateTenantUseCase.ts  ← MODIFIED
    │       └── DeleteTenantOnEntryDelete/
    │           ├── events.ts           ← NEW
    │           └── DeleteTenantOnEntryDeleteHandler.ts  ← MODIFIED
    └── exports/
        └── api/
            └── tenant-manager.ts       ← MODIFIED (add 3 exports)

packages/api-tenant-manager-webhooks/
├── package.json
├── tsconfig.json
├── index.ts
└── src/
    ├── TmWebhookEventProvider.ts
    ├── handlers/
    │   ├── OnTenantCreatedHandler.ts
    │   ├── OnTenantUpdatedHandler.ts
    │   └── OnTenantDeletedHandler.ts
    └── Extension.ts
```

---

## Task 1: Add `TenantAfterCreateEvent` to `tenant-manager`

**Files:**
- Create: `packages/tenant-manager/src/api/features/CreateTenant/events.ts`
- Modify: `packages/tenant-manager/src/api/features/CreateTenant/CreateTenantUseCase.ts`

- [ ] **Step 1: Create `CreateTenant/events.ts`**

```ts
import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { Tenant } from "~/shared/Tenant.js";

export interface TenantAfterCreatePayload {
    tenant: Tenant;
}

export class TenantAfterCreateEvent extends DomainEvent<TenantAfterCreatePayload> {
    eventType = "tenant.afterCreate" as const;

    getHandlerAbstraction() {
        return TenantAfterCreateEventHandler;
    }
}

export const TenantAfterCreateEventHandler = createAbstraction<
    IEventHandler<TenantAfterCreateEvent>
>("TenantManager/TenantAfterCreateEventHandler");

export namespace TenantAfterCreateEventHandler {
    export type Interface = IEventHandler<TenantAfterCreateEvent>;
    export type Event = TenantAfterCreateEvent;
}
```

- [ ] **Step 2: Replace `CreateTenant/CreateTenantUseCase.ts` with the version that dispatches the event**

Full file content (adds `EventPublisher` dependency and dispatches `TenantAfterCreateEvent` after successful persistence):

```ts
import {
    CreateTenantUseCase as UseCaseAbstraction,
    ICreateTenantInput,
    CreateTenantRepository
} from "./abstractions.js";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { Tenant } from "~/shared/Tenant.js";
import { TenantId } from "~/api/domain/TenantId.js";
import { TenantAfterCreateEvent } from "./events.js";

class CreateTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: CreateTenantRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(input: ICreateTenantInput): Promise<Result<Tenant, UseCaseAbstraction.Error>> {
        if (!this.identityContext.getPermission("tm.tenant")) {
            return Result.fail(
                new NotAuthorizedError({
                    message: "Not authorized to create tenants!"
                })
            );
        }

        const tenant = Tenant.from({
            id: TenantId.from(input.id),
            values: {
                name: input.name,
                description: input.description || "(no description)",
                extensions: input.extensions ?? {},
                status: "disabled",
                isInstalled: false
            }
        });

        const result = await this.repository.execute(tenant);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(new TenantAfterCreateEvent({ tenant: result.value }));
        return Result.ok(result.value);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: CreateTenantUseCase,
    dependencies: [IdentityContext, CreateTenantRepository, EventPublisher]
});
```

---

## Task 2: Add `TenantAfterUpdateEvent` to `tenant-manager`

**Files:**
- Create: `packages/tenant-manager/src/api/features/UpdateTenant/events.ts`
- Modify: `packages/tenant-manager/src/api/features/UpdateTenant/UpdateTenantUseCase.ts`

- [ ] **Step 1: Create `UpdateTenant/events.ts`**

```ts
import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { Tenant } from "~/shared/Tenant.js";

export interface TenantAfterUpdatePayload {
    tenant: Tenant;
}

export class TenantAfterUpdateEvent extends DomainEvent<TenantAfterUpdatePayload> {
    eventType = "tenant.afterUpdate" as const;

    getHandlerAbstraction() {
        return TenantAfterUpdateEventHandler;
    }
}

export const TenantAfterUpdateEventHandler = createAbstraction<
    IEventHandler<TenantAfterUpdateEvent>
>("TenantManager/TenantAfterUpdateEventHandler");

export namespace TenantAfterUpdateEventHandler {
    export type Interface = IEventHandler<TenantAfterUpdateEvent>;
    export type Event = TenantAfterUpdateEvent;
}
```

- [ ] **Step 2: Replace `UpdateTenant/UpdateTenantUseCase.ts` with the version that dispatches the event**

Full file content (adds `EventPublisher` dependency and dispatches `TenantAfterUpdateEvent` after successful update):

```ts
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { Tenant } from "~/shared/Tenant.js";
import {
    UpdateTenantUseCase as UseCaseAbstraction,
    UpdateTenantRepository,
    UpdateTenantInput
} from "./abstractions.js";
import { TenantAfterUpdateEvent } from "./events.js";

class UpdateTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private repository: UpdateTenantRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(
        id: string,
        input: UpdateTenantInput
    ): Promise<Result<Tenant, UseCaseAbstraction.Error>> {
        const result = await this.repository.execute(id, input);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(new TenantAfterUpdateEvent({ tenant: result.value }));
        return Result.ok(result.value);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: UpdateTenantUseCase,
    dependencies: [UpdateTenantRepository, EventPublisher]
});
```

---

## Task 3: Add `TenantAfterDeleteEvent` to `tenant-manager`

Tenant deletion is triggered by deleting the CMS entry for the tenant. The existing `DeleteTenantOnEntryDeleteHandler` subscribes to the generic `EntryAfterDeleteEventHandler` and filters by model ID. This task adds a `TenantAfterDeleteEvent` dispatched from that handler after the api-core tenant is deleted.

**Files:**
- Create: `packages/tenant-manager/src/api/features/DeleteTenantOnEntryDelete/events.ts`
- Modify: `packages/tenant-manager/src/api/features/DeleteTenantOnEntryDelete/DeleteTenantOnEntryDeleteHandler.ts`

- [ ] **Step 1: Create `DeleteTenantOnEntryDelete/events.ts`**

```ts
import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";

export interface TenantAfterDeletePayload {
    tenantId: string;
}

export class TenantAfterDeleteEvent extends DomainEvent<TenantAfterDeletePayload> {
    eventType = "tenant.afterDelete" as const;

    getHandlerAbstraction() {
        return TenantAfterDeleteEventHandler;
    }
}

export const TenantAfterDeleteEventHandler = createAbstraction<
    IEventHandler<TenantAfterDeleteEvent>
>("TenantManager/TenantAfterDeleteEventHandler");

export namespace TenantAfterDeleteEventHandler {
    export type Interface = IEventHandler<TenantAfterDeleteEvent>;
    export type Event = TenantAfterDeleteEvent;
}
```

- [ ] **Step 2: Replace `DeleteTenantOnEntryDeleteHandler.ts` with the version that dispatches the event**

Full file content (adds `EventPublisher` dependency and dispatches `TenantAfterDeleteEvent` after successful api-core deletion):

```ts
import { EntryAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.js";
import { DeleteTenantUseCase } from "@webiny/api-core/features/tenancy/DeleteTenant";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";
import { TenantAfterDeleteEvent } from "./events.js";

class DeleteTenantOnEntryDeleteHandler implements EntryAfterDeleteEventHandler.Interface {
    constructor(
        private deleteTenant: DeleteTenantUseCase.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async handle(event: EntryAfterDeleteEventHandler.Event): Promise<void> {
        const { entry, model } = event.payload;

        if (model.modelId !== TENANT_MODEL_ID) {
            return;
        }

        if (!event.payload.permanent) {
            return;
        }

        try {
            await this.deleteTenant.execute(entry.entryId);
            await this.eventPublisher.publish(
                new TenantAfterDeleteEvent({ tenantId: entry.entryId })
            );
        } catch (error) {
            console.error(`Failed to delete tenant ${entry.entryId}!`, error);
        }
    }
}

export default EntryAfterDeleteEventHandler.createImplementation({
    implementation: DeleteTenantOnEntryDeleteHandler,
    dependencies: [DeleteTenantUseCase, EventPublisher]
});
```

---

## Task 4: Export new event handlers from `tenant-manager`

Add three exports to `packages/tenant-manager/src/exports/api/tenant-manager.ts`.

**Files:**
- Modify: `packages/tenant-manager/src/exports/api/tenant-manager.ts`

- [ ] **Step 1: Add event handler exports**

Append to the end of `packages/tenant-manager/src/exports/api/tenant-manager.ts`:

```ts
export { TenantAfterCreateEventHandler } from "~/api/features/CreateTenant/events.js";
export { TenantAfterUpdateEventHandler } from "~/api/features/UpdateTenant/events.js";
export { TenantAfterDeleteEventHandler } from "~/api/features/DeleteTenantOnEntryDelete/events.js";
```

- [ ] **Step 2: Build `tenant-manager` to verify no TypeScript errors**

```bash
yarn build -p @webiny/tenant-manager 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add packages/tenant-manager/
git commit -m "feat(tenant-manager): add TenantAfterCreate/Update/Delete domain events"
```

---

## Task 5: Bridge package scaffold

**Files:**
- Create: `packages/api-tenant-manager-webhooks/package.json`
- Create: `packages/api-tenant-manager-webhooks/tsconfig.json`
- Create: `packages/api-tenant-manager-webhooks/index.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@webiny/api-tenant-manager-webhooks",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./*": "./*"
  },
  "description": "Tenant lifecycle webhook bridge for Webiny",
  "keywords": [
    "api-tenant-manager-webhooks:base"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git",
    "directory": "packages/api-tenant-manager-webhooks"
  },
  "license": "MIT",
  "dependencies": {
    "@webiny/api-webhooks": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/tenant-manager": "0.0.0"
  },
  "devDependencies": {
    "@webiny/build-tools": "0.0.0",
    "@webiny/project-utils": "0.0.0",
    "typescript": "6.0.3"
  },
  "publishConfig": {
    "access": "public",
    "directory": "dist"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "include": ["src"],
  "references": [
    { "path": "../api-webhooks" },
    { "path": "../feature" },
    { "path": "../tenant-manager" }
  ],
  "compilerOptions": {
    "rootDirs": ["./src"],
    "outDir": "./dist",
    "declarationDir": "./dist",
    "paths": {
      "~/*": ["./src/*"],
      "@webiny/api-webhooks/*": ["../api-webhooks/src/*"],
      "@webiny/api-webhooks": ["../api-webhooks/src"],
      "@webiny/feature/*": ["../feature/src/*"],
      "@webiny/feature": ["../feature/src"],
      "@webiny/tenant-manager/*": ["../tenant-manager/src/*"],
      "@webiny/tenant-manager": ["../tenant-manager/src"]
    }
  }
}
```

- [ ] **Step 3: Create `index.ts`**

```ts
export { Extension } from "./src/Extension.js";
```

- [ ] **Step 4: Install and regenerate tsconfigs**

```bash
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
```

- [ ] **Step 5: Commit scaffold**

```bash
git add packages/api-tenant-manager-webhooks/
git commit -m "feat(api-tenant-manager-webhooks): add package scaffold"
```

---

## Task 6: `TmWebhookEventProvider`

Static event provider — returns 3 hardcoded tenant events.

**Files:**
- Create: `packages/api-tenant-manager-webhooks/src/TmWebhookEventProvider.ts`

- [ ] **Step 1: Create `src/TmWebhookEventProvider.ts`**

```ts
import { WebhookEventProvider } from "@webiny/api-webhooks/src/abstractions/WebhookEventProvider.js";
import type { IWebhookEventDefinition } from "@webiny/api-webhooks/src/domain/types.js";

const STATIC_EVENTS: IWebhookEventDefinition[] = [
    {
        app: "tenantManager",
        modelId: "tenant",
        eventName: "tenant.entry.created",
        label: "Tenant: Created"
    },
    {
        app: "tenantManager",
        modelId: "tenant",
        eventName: "tenant.entry.updated",
        label: "Tenant: Updated"
    },
    {
        app: "tenantManager",
        modelId: "tenant",
        eventName: "tenant.entry.deleted",
        label: "Tenant: Deleted"
    }
];

class TmWebhookEventProviderImpl implements WebhookEventProvider.Interface {
    async getAvailableEvents(): Promise<IWebhookEventDefinition[]> {
        return STATIC_EVENTS;
    }
}

export default WebhookEventProvider.createImplementation({
    implementation: TmWebhookEventProviderImpl,
    dependencies: []
});
```

---

## Task 7: Tenant lifecycle event handlers

**Note on payloads:**
- `TenantAfterCreatePayload`: `{ tenant: Tenant }`
- `TenantAfterUpdatePayload`: `{ tenant: Tenant }`
- `TenantAfterDeletePayload`: `{ tenantId: string }` — the Tenant object is no longer available after deletion

All handlers import from `@webiny/tenant-manager/exports/api/tenant-manager.js`.

**Files:**
- Create: `packages/api-tenant-manager-webhooks/src/handlers/OnTenantCreatedHandler.ts`
- Create: `packages/api-tenant-manager-webhooks/src/handlers/OnTenantUpdatedHandler.ts`
- Create: `packages/api-tenant-manager-webhooks/src/handlers/OnTenantDeletedHandler.ts`

- [ ] **Step 1: Create `src/handlers/OnTenantCreatedHandler.ts`**

```ts
import {
    TenantAfterCreateEventHandler
} from "@webiny/tenant-manager/exports/api/tenant-manager.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnTenantCreatedHandlerImpl implements TenantAfterCreateEventHandler.Interface {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

    async handle(event: TenantAfterCreateEventHandler.Event): Promise<void> {
        const { tenant } = event.payload;
        await this.webhookDispatcher.dispatch("tenant.entry.created", {
            modelId: "tenant",
            tenantId: tenant.id,
            tenant
        });
    }
}

export default TenantAfterCreateEventHandler.createImplementation({
    implementation: OnTenantCreatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
```

- [ ] **Step 2: Create `src/handlers/OnTenantUpdatedHandler.ts`**

```ts
import {
    TenantAfterUpdateEventHandler
} from "@webiny/tenant-manager/exports/api/tenant-manager.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnTenantUpdatedHandlerImpl implements TenantAfterUpdateEventHandler.Interface {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

    async handle(event: TenantAfterUpdateEventHandler.Event): Promise<void> {
        const { tenant } = event.payload;
        await this.webhookDispatcher.dispatch("tenant.entry.updated", {
            modelId: "tenant",
            tenantId: tenant.id,
            tenant
        });
    }
}

export default TenantAfterUpdateEventHandler.createImplementation({
    implementation: OnTenantUpdatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
```

- [ ] **Step 3: Create `src/handlers/OnTenantDeletedHandler.ts`**

```ts
import {
    TenantAfterDeleteEventHandler
} from "@webiny/tenant-manager/exports/api/tenant-manager.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnTenantDeletedHandlerImpl implements TenantAfterDeleteEventHandler.Interface {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

    async handle(event: TenantAfterDeleteEventHandler.Event): Promise<void> {
        const { tenantId } = event.payload;
        await this.webhookDispatcher.dispatch("tenant.entry.deleted", {
            modelId: "tenant",
            tenantId
        });
    }
}

export default TenantAfterDeleteEventHandler.createImplementation({
    implementation: OnTenantDeletedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
```

---

## Task 8: Extension and final build

**Files:**
- Create: `packages/api-tenant-manager-webhooks/src/Extension.ts`

- [ ] **Step 1: Create `src/Extension.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import TmWebhookEventProvider from "./TmWebhookEventProvider.js";
import OnTenantCreatedHandler from "./handlers/OnTenantCreatedHandler.js";
import OnTenantUpdatedHandler from "./handlers/OnTenantUpdatedHandler.js";
import OnTenantDeletedHandler from "./handlers/OnTenantDeletedHandler.js";

export const Extension = createFeature({
    name: "TmWebhooks",
    register(container) {
        container.register(TmWebhookEventProvider);
        container.register(OnTenantCreatedHandler);
        container.register(OnTenantUpdatedHandler);
        container.register(OnTenantDeletedHandler);
    }
});
```

- [ ] **Step 2: Build**

```bash
yarn build -p @webiny/api-tenant-manager-webhooks 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 3: Run before-commit checklist**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
```

- [ ] **Step 4: Commit**

```bash
git add packages/api-tenant-manager-webhooks/ packages/tenant-manager/
git commit -m "feat(api-tenant-manager-webhooks): tenant lifecycle webhook bridge"
```

---

**All phases complete.** All bridge packages are now ready. To wire everything into an API handler, register the `Extension` from each bridge package alongside `api-webhooks`'s `Extension` in the application's API handler configuration.
