# Webhooks Phase 3 — Website Builder Bridge (`webhooks/features/websiteBuilder`)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `websiteBuilder` feature folder inside `packages/webhooks/src/api/features/` that hooks into Website Builder page lifecycle events and feeds them into the webhook dispatcher.

**Architecture:** Feature folder inside `packages/webhooks` — no separate package. Depends on `api-website-builder` (events) and `api-core` (dispatcher abstraction). Neither depends on this folder. Static event provider (5 hardcoded events for `pbPage`). The bridge's `feature.ts` is imported by `packages/webhooks/src/api/Extension.ts`.

**Prerequisite:** Phase 1 (`webhooks` core) must be complete.

---

## File Map

```
packages/webhooks/src/api/features/websiteBuilder/
├── abstractions.ts
├── WbWebhookEventProvider.ts
├── handlers/
│   ├── OnPageCreatedHandler.ts
│   ├── OnPageUpdatedHandler.ts
│   ├── OnPageDeletedHandler.ts
│   ├── OnPagePublishedHandler.ts
│   └── OnPageUnpublishedHandler.ts
└── feature.ts
```

---

## Task 1: `WbWebhookEventProvider`

Static event provider — returns 5 hardcoded events for `pbPage` (no async lookups needed).

**Files:**
- Create: `packages/webhooks/src/api/features/websiteBuilder/WbWebhookEventProvider.ts`

- [ ] **Step 1: Create `src/api/features/websiteBuilder/WbWebhookEventProvider.ts`**

```ts
import { WebhookEventProvider } from "~/api/abstractions/WebhookEventProvider.js";
import type { IWebhookEventDefinition } from "~/api/domain/types.js";

const STATIC_EVENTS: IWebhookEventDefinition[] = [
    {
        app: "websiteBuilder",
        modelId: "pbPage",
        eventName: "pbPage.entry.created",
        label: "Page: Entry Created"
    },
    {
        app: "websiteBuilder",
        modelId: "pbPage",
        eventName: "pbPage.entry.updated",
        label: "Page: Entry Updated"
    },
    {
        app: "websiteBuilder",
        modelId: "pbPage",
        eventName: "pbPage.entry.deleted",
        label: "Page: Entry Deleted"
    },
    {
        app: "websiteBuilder",
        modelId: "pbPage",
        eventName: "pbPage.entry.published",
        label: "Page: Entry Published"
    },
    {
        app: "websiteBuilder",
        modelId: "pbPage",
        eventName: "pbPage.entry.unpublished",
        label: "Page: Entry Unpublished"
    }
];

class WbWebhookEventProviderImpl implements WebhookEventProvider.Interface {
    async getAvailableEvents(): Promise<IWebhookEventDefinition[]> {
        return STATIC_EVENTS;
    }
}

export default WebhookEventProvider.createImplementation({
    implementation: WbWebhookEventProviderImpl,
    dependencies: []
});
```

---

## Task 2: Page lifecycle event handlers

One handler per WB page action. Each calls `IWebhookDispatcher.dispatch()` with the event name and page data.

**Note on payloads:**
- `PageAfterCreatePayload`: `{ page: WbPage }`
- `PageAfterUpdatePayload`: `{ original: WbPage, input: { id, data }, page: WbPage }`
- `PageAfterDeletePayload`: `{ page: WbPage }`
- `PageAfterPublishPayload`: `{ page: WbPage }`
- `PageAfterUnpublishPayload`: `{ page: WbPage }`

All handlers import from `@webiny/api-website-builder/exports/api/website-builder/page.js`.

**Files:**
- Create: `packages/webhooks/src/api/features/websiteBuilder/handlers/OnPageCreatedHandler.ts`
- Create: `packages/webhooks/src/api/features/websiteBuilder/handlers/OnPageUpdatedHandler.ts`
- Create: `packages/webhooks/src/api/features/websiteBuilder/handlers/OnPageDeletedHandler.ts`
- Create: `packages/webhooks/src/api/features/websiteBuilder/handlers/OnPagePublishedHandler.ts`
- Create: `packages/webhooks/src/api/features/websiteBuilder/handlers/OnPageUnpublishedHandler.ts`

- [ ] **Step 1: Create `src/api/features/websiteBuilder/handlers/OnPageCreatedHandler.ts`**

```ts
import {
    PageAfterCreateEventHandler
} from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import { IWebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";

class OnPageCreatedHandlerImpl implements PageAfterCreateEventHandler.Interface {
    constructor(private webhookDispatcher: IWebhookDispatcher) {}

    async handle(event: PageAfterCreateEventHandler.Event): Promise<void> {
        const { page } = event.payload;
        await this.webhookDispatcher.dispatch("pbPage.entry.created", {
            modelId: "pbPage",
            pageId: page.id,
            page
        });
    }
}

export default PageAfterCreateEventHandler.createImplementation({
    implementation: OnPageCreatedHandlerImpl,
    dependencies: [IWebhookDispatcher]
});
```

- [ ] **Step 2: Create `src/api/features/websiteBuilder/handlers/OnPageUpdatedHandler.ts`**

```ts
import {
    PageAfterUpdateEventHandler
} from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import { IWebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";

class OnPageUpdatedHandlerImpl implements PageAfterUpdateEventHandler.Interface {
    constructor(private webhookDispatcher: IWebhookDispatcher) {}

    async handle(event: PageAfterUpdateEventHandler.Event): Promise<void> {
        const { page } = event.payload;
        await this.webhookDispatcher.dispatch("pbPage.entry.updated", {
            modelId: "pbPage",
            pageId: page.id,
            page
        });
    }
}

export default PageAfterUpdateEventHandler.createImplementation({
    implementation: OnPageUpdatedHandlerImpl,
    dependencies: [IWebhookDispatcher]
});
```

- [ ] **Step 3: Create `src/api/features/websiteBuilder/handlers/OnPageDeletedHandler.ts`**

```ts
import {
    PageAfterDeleteEventHandler
} from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import { IWebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";

class OnPageDeletedHandlerImpl implements PageAfterDeleteEventHandler.Interface {
    constructor(private webhookDispatcher: IWebhookDispatcher) {}

    async handle(event: PageAfterDeleteEventHandler.Event): Promise<void> {
        const { page } = event.payload;
        await this.webhookDispatcher.dispatch("pbPage.entry.deleted", {
            modelId: "pbPage",
            pageId: page.id,
            page
        });
    }
}

export default PageAfterDeleteEventHandler.createImplementation({
    implementation: OnPageDeletedHandlerImpl,
    dependencies: [IWebhookDispatcher]
});
```

- [ ] **Step 4: Create `src/api/features/websiteBuilder/handlers/OnPagePublishedHandler.ts`**

```ts
import {
    PageAfterPublishEventHandler
} from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import { IWebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";

class OnPagePublishedHandlerImpl implements PageAfterPublishEventHandler.Interface {
    constructor(private webhookDispatcher: IWebhookDispatcher) {}

    async handle(event: PageAfterPublishEventHandler.Event): Promise<void> {
        const { page } = event.payload;
        await this.webhookDispatcher.dispatch("pbPage.entry.published", {
            modelId: "pbPage",
            pageId: page.id,
            page
        });
    }
}

export default PageAfterPublishEventHandler.createImplementation({
    implementation: OnPagePublishedHandlerImpl,
    dependencies: [IWebhookDispatcher]
});
```

- [ ] **Step 5: Create `src/api/features/websiteBuilder/handlers/OnPageUnpublishedHandler.ts`**

```ts
import {
    PageAfterUnpublishEventHandler
} from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import { IWebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";

class OnPageUnpublishedHandlerImpl implements PageAfterUnpublishEventHandler.Interface {
    constructor(private webhookDispatcher: IWebhookDispatcher) {}

    async handle(event: PageAfterUnpublishEventHandler.Event): Promise<void> {
        const { page } = event.payload;
        await this.webhookDispatcher.dispatch("pbPage.entry.unpublished", {
            modelId: "pbPage",
            pageId: page.id,
            page
        });
    }
}

export default PageAfterUnpublishEventHandler.createImplementation({
    implementation: OnPageUnpublishedHandlerImpl,
    dependencies: [IWebhookDispatcher]
});
```

---

## Task 3: `feature.ts` and registration in main `Extension.ts`

**Files:**
- Create: `packages/webhooks/src/api/features/websiteBuilder/feature.ts`
- Modify: `packages/webhooks/src/api/Extension.ts`

- [ ] **Step 1: Create `src/api/features/websiteBuilder/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import WbWebhookEventProvider from "./WbWebhookEventProvider.js";
import OnPageCreatedHandler from "./handlers/OnPageCreatedHandler.js";
import OnPageUpdatedHandler from "./handlers/OnPageUpdatedHandler.js";
import OnPageDeletedHandler from "./handlers/OnPageDeletedHandler.js";
import OnPagePublishedHandler from "./handlers/OnPagePublishedHandler.js";
import OnPageUnpublishedHandler from "./handlers/OnPageUnpublishedHandler.js";

export const websiteBuilderWebhooksFeature = createFeature({
    name: "WbWebhooks",
    register(container) {
        container.register(WbWebhookEventProvider);
        container.register(OnPageCreatedHandler);
        container.register(OnPageUpdatedHandler);
        container.register(OnPageDeletedHandler);
        container.register(OnPagePublishedHandler);
        container.register(OnPageUnpublishedHandler);
    }
});
```

- [ ] **Step 2: Import and register `websiteBuilderWebhooksFeature` in `src/api/Extension.ts`**

Add the import:

```ts
import { websiteBuilderWebhooksFeature } from "~/api/features/websiteBuilder/feature.js";
```

And include `websiteBuilderWebhooksFeature` in the features array (or container registration) inside `Extension.ts`.

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
git commit -m "feat(webhooks): WB page lifecycle webhook bridge"
```

---

**Next:** Phase 4 — `docs/superpowers/plans/2026-05-11-webhooks-phase4-fm-bridge.md`
