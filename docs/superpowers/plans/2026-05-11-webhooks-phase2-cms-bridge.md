# Webhooks Phase 2 — `api-headless-cms-webhooks` CMS Bridge

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `packages/api-headless-cms-webhooks` — the bridge package that hooks into CMS entry lifecycle events and feeds them into the webhook dispatcher. Registers one event handler per CMS action and a dynamic event provider that lists all user content models.

**Architecture:** Pure bridge — depends on both `api-headless-cms` (events) and `api-webhooks` (dispatcher). Neither depends on this package. Contains no CMS models of its own.

**Prerequisite:** Phase 1 (`api-webhooks`) must be complete.

---

## File Map

```
packages/api-headless-cms-webhooks/
├── package.json
├── tsconfig.json
├── index.ts
└── src/
    ├── CmsWebhookEventProvider.ts
    ├── handlers/
    │   ├── OnEntryCreatedHandler.ts
    │   ├── OnEntryUpdatedHandler.ts
    │   ├── OnEntryDeletedHandler.ts
    │   ├── OnEntryPublishedHandler.ts
    │   └── OnEntryUnpublishedHandler.ts
    └── Extension.ts
```

---

## Task 1: Package scaffold

**Files:**
- Create: `packages/api-headless-cms-webhooks/package.json`
- Create: `packages/api-headless-cms-webhooks/tsconfig.json`
- Create: `packages/api-headless-cms-webhooks/index.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@webiny/api-headless-cms-webhooks",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./*": "./*"
  },
  "description": "CMS entry webhook bridge for Webiny",
  "keywords": [
    "api-headless-cms-webhooks:base"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git",
    "directory": "packages/api-headless-cms-webhooks"
  },
  "license": "MIT",
  "dependencies": {
    "@webiny/api-headless-cms": "0.0.0",
    "@webiny/api-webhooks": "0.0.0",
    "@webiny/feature": "0.0.0"
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
    { "path": "../api-headless-cms" },
    { "path": "../api-webhooks" },
    { "path": "../feature" }
  ],
  "compilerOptions": {
    "rootDirs": ["./src"],
    "outDir": "./dist",
    "declarationDir": "./dist",
    "paths": {
      "~/*": ["./src/*"],
      "@webiny/api-headless-cms/*": ["../api-headless-cms/src/*"],
      "@webiny/api-headless-cms": ["../api-headless-cms/src"],
      "@webiny/api-webhooks/*": ["../api-webhooks/src/*"],
      "@webiny/api-webhooks": ["../api-webhooks/src"],
      "@webiny/feature/*": ["../feature/src/*"],
      "@webiny/feature": ["../feature/src"]
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

- [ ] **Step 5: Commit**

```bash
git add packages/api-headless-cms-webhooks/
git commit -m "feat(api-headless-cms-webhooks): add package scaffold"
```

---

## Task 2: `CmsWebhookEventProvider`

Dynamically lists all user-defined content models and generates 5 webhook events per model. Skips system/hidden models (those tagged with `$hidden:true`).

**Files:**
- Create: `packages/api-headless-cms-webhooks/src/CmsWebhookEventProvider.ts`

- [ ] **Step 1: Create `src/CmsWebhookEventProvider.ts`**

```ts
import { WebhookEventProvider } from "@webiny/api-webhooks/src/abstractions/WebhookEventProvider.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import type { IWebhookEventDefinition } from "@webiny/api-webhooks/src/domain/types.js";

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

## Task 3: Entry lifecycle event handlers

One handler per CMS entry action. Each handler calls `WebhookDispatcher.dispatch()` with the event name and relevant data.

**Files:**
- Create: `packages/api-headless-cms-webhooks/src/handlers/OnEntryCreatedHandler.ts`
- Create: `packages/api-headless-cms-webhooks/src/handlers/OnEntryUpdatedHandler.ts`
- Create: `packages/api-headless-cms-webhooks/src/handlers/OnEntryDeletedHandler.ts`
- Create: `packages/api-headless-cms-webhooks/src/handlers/OnEntryPublishedHandler.ts`
- Create: `packages/api-headless-cms-webhooks/src/handlers/OnEntryUnpublishedHandler.ts`

- [ ] **Step 1: Create `src/handlers/OnEntryPublishedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    EntryAfterPublishEventHandler,
    type EntryAfterPublishEvent
} from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnEntryPublishedHandlerImpl implements IEventHandler<EntryAfterPublishEvent> {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

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
    dependencies: [WebhookDispatcher]
});
```

- [ ] **Step 2: Create `src/handlers/OnEntryCreatedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    EntryAfterCreateEventHandler,
    type EntryAfterCreateEvent
} from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnEntryCreatedHandlerImpl implements IEventHandler<EntryAfterCreateEvent> {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

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
    dependencies: [WebhookDispatcher]
});
```

- [ ] **Step 3: Create `src/handlers/OnEntryUpdatedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    EntryAfterUpdateEventHandler,
    type EntryAfterUpdateEvent
} from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnEntryUpdatedHandlerImpl implements IEventHandler<EntryAfterUpdateEvent> {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

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
    dependencies: [WebhookDispatcher]
});
```

- [ ] **Step 4: Create `src/handlers/OnEntryDeletedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    EntryAfterDeleteEventHandler,
    type EntryAfterDeleteEvent
} from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnEntryDeletedHandlerImpl implements IEventHandler<EntryAfterDeleteEvent> {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

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
    dependencies: [WebhookDispatcher]
});
```

- [ ] **Step 5: Create `src/handlers/OnEntryUnpublishedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    EntryAfterUnpublishEventHandler,
    type EntryAfterUnpublishEvent
} from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnEntryUnpublishedHandlerImpl implements IEventHandler<EntryAfterUnpublishEvent> {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

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
    dependencies: [WebhookDispatcher]
});
```

---

## Task 4: Extension and final build

**Files:**
- Create: `packages/api-headless-cms-webhooks/src/Extension.ts`

- [ ] **Step 1: Create `src/Extension.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import CmsWebhookEventProvider from "./CmsWebhookEventProvider.js";
import OnEntryCreatedHandler from "./handlers/OnEntryCreatedHandler.js";
import OnEntryUpdatedHandler from "./handlers/OnEntryUpdatedHandler.js";
import OnEntryDeletedHandler from "./handlers/OnEntryDeletedHandler.js";
import OnEntryPublishedHandler from "./handlers/OnEntryPublishedHandler.js";
import OnEntryUnpublishedHandler from "./handlers/OnEntryUnpublishedHandler.js";

export const Extension = createFeature({
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

- [ ] **Step 2: Build**

```bash
yarn build -p @webiny/api-headless-cms-webhooks 2>&1 | tail -20
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
git add packages/api-headless-cms-webhooks/
git commit -m "feat(api-headless-cms-webhooks): CMS entry lifecycle webhook bridge"
```

---

**Next:** Phase 3 — `docs/superpowers/plans/2026-05-11-webhooks-phase3-wb-bridge.md`
