# Webhooks Phase 2 — CMS Bridge (`webhooks/features/cms`)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `cms` feature folder inside `packages/webhooks/src/api/features/` that hooks into CMS entry lifecycle events and feeds them into the webhook dispatcher. Registers one event handler per CMS action and a dynamic event provider that lists all user content models.

**Architecture:** Feature folder inside `packages/webhooks` — no separate package. Depends on `api-headless-cms` (events) and `api-core` (dispatcher abstraction). Neither depends on this folder. Contains no CMS models of its own. The bridge's `feature.ts` is imported by `packages/webhooks/src/api/Extension.ts`.

**Prerequisite:** Phase 1 (`webhooks` core) must be complete.

---

## File Map

```
packages/webhooks/src/api/features/cms/
├── abstractions.ts
├── CmsWebhookEventProvider.ts
├── handlers/
│   ├── OnEntryCreatedHandler.ts
│   ├── OnEntryUpdatedHandler.ts
│   ├── OnEntryDeletedHandler.ts
│   ├── OnEntryPublishedHandler.ts
│   └── OnEntryUnpublishedHandler.ts
└── feature.ts
```

---

## Task 1: `CmsWebhookEventProvider`

Dynamically lists all user-defined content models and generates 5 webhook events per model. Skips system/hidden models (those tagged with `$hidden:true`).

**Files:**
- Create: `packages/webhooks/src/api/features/cms/CmsWebhookEventProvider.ts`

- [ ] **Step 1: Create `src/api/features/cms/CmsWebhookEventProvider.ts`**

```ts
import { WebhookEventProvider } from "~/api/abstractions/WebhookEventProvider.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import type { IWebhookEventDefinition } from "~/api/domain/types.js";

const ENTRY_ACTIONS = ["created", "updated", "deleted", "published", "unpublished"] as const;

class CmsWebhookEventProviderImpl implements WebhookEventProvider.Interface {
    constructor(
        private listModelsUseCase: ListModelsUseCase.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async getAvailableEvents(): Promise<IWebhookEventDefinition[]> {
        const modelsResult = await this.identityContext.withoutAuthorization(() =>
            this.listModelsUseCase.execute({ includePlugins: true, includePrivate: false })
        );

        if (modelsResult.isFail()) {
            return [];
        }

        const events: IWebhookEventDefinition[] = [];

        for (const model of modelsResult.value) {
            // Skip system/hidden models (webhook, webhookDelivery, webhookSettings, tenant, etc.)
            if (model.tags?.includes("$hidden:true")) {
                continue;
            }

            for (const action of ENTRY_ACTIONS) {
                events.push({
                    app: "cms",
                    modelId: model.modelId,
                    eventName: `${model.modelId}.entry.${action}`,
                    label: `${model.name}: Entry ${action.charAt(0).toUpperCase() + action.slice(1)}`
                });
            }
        }

        return events;
    }
}

export default WebhookEventProvider.createImplementation({
    implementation: CmsWebhookEventProviderImpl,
    dependencies: [ListModelsUseCase, IdentityContext]
});
```

---

## Task 2: Entry lifecycle event handlers

One handler per CMS entry action. Each handler calls `IWebhookDispatcher.dispatch()` with the event name and relevant data.

**Files:**
- Create: `packages/webhooks/src/api/features/cms/handlers/OnEntryCreatedHandler.ts`
- Create: `packages/webhooks/src/api/features/cms/handlers/OnEntryUpdatedHandler.ts`
- Create: `packages/webhooks/src/api/features/cms/handlers/OnEntryDeletedHandler.ts`
- Create: `packages/webhooks/src/api/features/cms/handlers/OnEntryPublishedHandler.ts`
- Create: `packages/webhooks/src/api/features/cms/handlers/OnEntryUnpublishedHandler.ts`

- [ ] **Step 1: Create `src/api/features/cms/handlers/OnEntryPublishedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    EntryAfterPublishEventHandler,
    type EntryAfterPublishEvent
} from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { IWebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";

class OnEntryPublishedHandlerImpl implements IEventHandler<EntryAfterPublishEvent> {
    constructor(private webhookDispatcher: IWebhookDispatcher) {}

    async handle(event: EntryAfterPublishEvent): Promise<void> {
        const { entry, model } = event.payload;
        await this.webhookDispatcher.dispatch(`${model.modelId}.entry.published`, {
            modelId: model.modelId,
            entryId: entry.entryId,
            entry
        });
    }
}

export default EntryAfterPublishEventHandler.createImplementation({
    implementation: OnEntryPublishedHandlerImpl,
    dependencies: [IWebhookDispatcher]
});
```

- [ ] **Step 2: Create `src/api/features/cms/handlers/OnEntryCreatedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    EntryAfterCreateEventHandler,
    type EntryAfterCreateEvent
} from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { IWebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";

class OnEntryCreatedHandlerImpl implements IEventHandler<EntryAfterCreateEvent> {
    constructor(private webhookDispatcher: IWebhookDispatcher) {}

    async handle(event: EntryAfterCreateEvent): Promise<void> {
        const { entry, model } = event.payload;
        await this.webhookDispatcher.dispatch(`${model.modelId}.entry.created`, {
            modelId: model.modelId,
            entryId: entry.entryId,
            entry
        });
    }
}

export default EntryAfterCreateEventHandler.createImplementation({
    implementation: OnEntryCreatedHandlerImpl,
    dependencies: [IWebhookDispatcher]
});
```

- [ ] **Step 3: Create `src/api/features/cms/handlers/OnEntryUpdatedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    EntryAfterUpdateEventHandler,
    type EntryAfterUpdateEvent
} from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { IWebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";

class OnEntryUpdatedHandlerImpl implements IEventHandler<EntryAfterUpdateEvent> {
    constructor(private webhookDispatcher: IWebhookDispatcher) {}

    async handle(event: EntryAfterUpdateEvent): Promise<void> {
        const { entry, model } = event.payload;
        await this.webhookDispatcher.dispatch(`${model.modelId}.entry.updated`, {
            modelId: model.modelId,
            entryId: entry.entryId,
            entry
        });
    }
}

export default EntryAfterUpdateEventHandler.createImplementation({
    implementation: OnEntryUpdatedHandlerImpl,
    dependencies: [IWebhookDispatcher]
});
```

- [ ] **Step 4: Create `src/api/features/cms/handlers/OnEntryDeletedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    EntryAfterDeleteEventHandler,
    type EntryAfterDeleteEvent
} from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { IWebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";

class OnEntryDeletedHandlerImpl implements IEventHandler<EntryAfterDeleteEvent> {
    constructor(private webhookDispatcher: IWebhookDispatcher) {}

    async handle(event: EntryAfterDeleteEvent): Promise<void> {
        const { entry, model } = event.payload;
        await this.webhookDispatcher.dispatch(`${model.modelId}.entry.deleted`, {
            modelId: model.modelId,
            entryId: entry.entryId,
            entry
        });
    }
}

export default EntryAfterDeleteEventHandler.createImplementation({
    implementation: OnEntryDeletedHandlerImpl,
    dependencies: [IWebhookDispatcher]
});
```

- [ ] **Step 5: Create `src/api/features/cms/handlers/OnEntryUnpublishedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    EntryAfterUnpublishEventHandler,
    type EntryAfterUnpublishEvent
} from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { IWebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";

class OnEntryUnpublishedHandlerImpl implements IEventHandler<EntryAfterUnpublishEvent> {
    constructor(private webhookDispatcher: IWebhookDispatcher) {}

    async handle(event: EntryAfterUnpublishEvent): Promise<void> {
        const { entry, model } = event.payload;
        await this.webhookDispatcher.dispatch(`${model.modelId}.entry.unpublished`, {
            modelId: model.modelId,
            entryId: entry.entryId,
            entry
        });
    }
}

export default EntryAfterUnpublishEventHandler.createImplementation({
    implementation: OnEntryUnpublishedHandlerImpl,
    dependencies: [IWebhookDispatcher]
});
```

---

## Task 3: `feature.ts` and registration in main `Extension.ts`

**Files:**
- Create: `packages/webhooks/src/api/features/cms/feature.ts`
- Modify: `packages/webhooks/src/api/Extension.ts`

- [ ] **Step 1: Create `src/api/features/cms/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import CmsWebhookEventProvider from "./CmsWebhookEventProvider.js";
import OnEntryCreatedHandler from "./handlers/OnEntryCreatedHandler.js";
import OnEntryUpdatedHandler from "./handlers/OnEntryUpdatedHandler.js";
import OnEntryDeletedHandler from "./handlers/OnEntryDeletedHandler.js";
import OnEntryPublishedHandler from "./handlers/OnEntryPublishedHandler.js";
import OnEntryUnpublishedHandler from "./handlers/OnEntryUnpublishedHandler.js";

export const cmsWebhooksFeature = createFeature({
    name: "CmsWebhooks",
    register(container) {
        container.register(CmsWebhookEventProvider);
        container.register(OnEntryCreatedHandler);
        container.register(OnEntryUpdatedHandler);
        container.register(OnEntryDeletedHandler);
        container.register(OnEntryPublishedHandler);
        container.register(OnEntryUnpublishedHandler);
    }
});
```

- [ ] **Step 2: Import and register `cmsWebhooksFeature` in `src/api/Extension.ts`**

Add the import:

```ts
import { cmsWebhooksFeature } from "~/api/features/cms/feature.js";
```

And include `cmsWebhooksFeature` in the features array (or container registration) inside `Extension.ts`.

- [ ] **Step 3: Build**

```bash
yarn build -p @webiny/webhooks 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 4: Run before-commit checklist**

```bash
git add .
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
```

- [ ] **Step 5: Commit**

```bash
git add packages/webhooks/
git commit -m "feat(webhooks): CMS entry lifecycle webhook bridge"
```

---

**Next:** Phase 3 — `docs/superpowers/plans/2026-05-11-webhooks-phase3-wb-bridge.md`
