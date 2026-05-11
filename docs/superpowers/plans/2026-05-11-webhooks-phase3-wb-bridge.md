# Webhooks Phase 3 — `api-website-builder-webhooks` WB Bridge

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `packages/api-website-builder-webhooks` — the bridge package that hooks into Website Builder page lifecycle events and feeds them into the webhook dispatcher.

**Architecture:** Pure bridge — depends on both `api-website-builder` (events) and `api-webhooks` (dispatcher). Neither depends on this package. Static event provider (5 hardcoded events for `pbPage`).

**Prerequisite:** Phase 1 (`api-webhooks`) must be complete.

---

## File Map

```
packages/api-website-builder-webhooks/
├── package.json
├── tsconfig.json
├── index.ts
└── src/
    ├── WbWebhookEventProvider.ts
    ├── handlers/
    │   ├── OnPageCreatedHandler.ts
    │   ├── OnPageUpdatedHandler.ts
    │   ├── OnPageDeletedHandler.ts
    │   ├── OnPagePublishedHandler.ts
    │   └── OnPageUnpublishedHandler.ts
    └── Extension.ts
```

---

## Task 1: Package scaffold

**Files:**
- Create: `packages/api-website-builder-webhooks/package.json`
- Create: `packages/api-website-builder-webhooks/tsconfig.json`
- Create: `packages/api-website-builder-webhooks/index.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@webiny/api-website-builder-webhooks",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./*": "./*"
  },
  "description": "Website Builder page webhook bridge for Webiny",
  "keywords": [
    "api-website-builder-webhooks:base"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git",
    "directory": "packages/api-website-builder-webhooks"
  },
  "license": "MIT",
  "dependencies": {
    "@webiny/api-website-builder": "0.0.0",
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
    { "path": "../api-website-builder" },
    { "path": "../api-webhooks" },
    { "path": "../feature" }
  ],
  "compilerOptions": {
    "rootDirs": ["./src"],
    "outDir": "./dist",
    "declarationDir": "./dist",
    "paths": {
      "~/*": ["./src/*"],
      "@webiny/api-website-builder/*": ["../api-website-builder/src/*"],
      "@webiny/api-website-builder": ["../api-website-builder/src"],
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
git add packages/api-website-builder-webhooks/
git commit -m "feat(api-website-builder-webhooks): add package scaffold"
```

---

## Task 2: `WbWebhookEventProvider`

Static event provider — returns 5 hardcoded events for `pbPage` (no async lookups needed).

**Files:**
- Create: `packages/api-website-builder-webhooks/src/WbWebhookEventProvider.ts`

- [ ] **Step 1: Create `src/WbWebhookEventProvider.ts`**

```ts
import { WebhookEventProvider } from "@webiny/api-webhooks/src/abstractions/WebhookEventProvider.js";
import type { IWebhookEventDefinition } from "@webiny/api-webhooks/src/domain/types.js";

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

## Task 3: Page lifecycle event handlers

One handler per WB page action. Each calls `WebhookDispatcher.dispatch()` with the event name and page data.

**Note on payloads:**
- `PageAfterCreatePayload`: `{ page: WbPage }`
- `PageAfterUpdatePayload`: `{ original: WbPage, input: { id, data }, page: WbPage }`
- `PageAfterDeletePayload`: `{ page: WbPage }`
- `PageAfterPublishPayload`: `{ page: WbPage }`
- `PageAfterUnpublishPayload`: `{ page: WbPage }`

All handlers import from `@webiny/api-website-builder/exports/api/website-builder/page.js`.

**Files:**
- Create: `packages/api-website-builder-webhooks/src/handlers/OnPageCreatedHandler.ts`
- Create: `packages/api-website-builder-webhooks/src/handlers/OnPageUpdatedHandler.ts`
- Create: `packages/api-website-builder-webhooks/src/handlers/OnPageDeletedHandler.ts`
- Create: `packages/api-website-builder-webhooks/src/handlers/OnPagePublishedHandler.ts`
- Create: `packages/api-website-builder-webhooks/src/handlers/OnPageUnpublishedHandler.ts`

- [ ] **Step 1: Create `src/handlers/OnPageCreatedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    PageAfterCreateEventHandler
} from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnPageCreatedHandlerImpl implements PageAfterCreateEventHandler.Interface {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

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
    dependencies: [WebhookDispatcher]
});
```

- [ ] **Step 2: Create `src/handlers/OnPageUpdatedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    PageAfterUpdateEventHandler
} from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnPageUpdatedHandlerImpl implements PageAfterUpdateEventHandler.Interface {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

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
    dependencies: [WebhookDispatcher]
});
```

- [ ] **Step 3: Create `src/handlers/OnPageDeletedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    PageAfterDeleteEventHandler
} from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnPageDeletedHandlerImpl implements PageAfterDeleteEventHandler.Interface {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

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
    dependencies: [WebhookDispatcher]
});
```

- [ ] **Step 4: Create `src/handlers/OnPagePublishedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    PageAfterPublishEventHandler
} from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnPagePublishedHandlerImpl implements PageAfterPublishEventHandler.Interface {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

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
    dependencies: [WebhookDispatcher]
});
```

- [ ] **Step 5: Create `src/handlers/OnPageUnpublishedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    PageAfterUnpublishEventHandler
} from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnPageUnpublishedHandlerImpl implements PageAfterUnpublishEventHandler.Interface {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

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
    dependencies: [WebhookDispatcher]
});
```

---

## Task 4: Extension and final build

**Files:**
- Create: `packages/api-website-builder-webhooks/src/Extension.ts`

- [ ] **Step 1: Create `src/Extension.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import WbWebhookEventProvider from "./WbWebhookEventProvider.js";
import OnPageCreatedHandler from "./handlers/OnPageCreatedHandler.js";
import OnPageUpdatedHandler from "./handlers/OnPageUpdatedHandler.js";
import OnPageDeletedHandler from "./handlers/OnPageDeletedHandler.js";
import OnPagePublishedHandler from "./handlers/OnPagePublishedHandler.js";
import OnPageUnpublishedHandler from "./handlers/OnPageUnpublishedHandler.js";

export const Extension = createFeature({
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

- [ ] **Step 2: Build**

```bash
yarn build -p @webiny/api-website-builder-webhooks 2>&1 | tail -20
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
git add packages/api-website-builder-webhooks/
git commit -m "feat(api-website-builder-webhooks): WB page lifecycle webhook bridge"
```

---

**Next:** Phase 4 — `docs/superpowers/plans/2026-05-11-webhooks-phase4-fm-bridge.md`
