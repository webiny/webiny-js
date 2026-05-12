# Webhooks Phase 4 — File Manager Bridge (`webhooks/features/fileManager`)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `fileManager` feature folder inside `packages/webhooks/src/api/features/` that hooks into File Manager file and folder lifecycle events and feeds them into the webhook dispatcher.

**Architecture:** Feature folder inside `packages/webhooks` — no separate package. Depends on `api-file-manager` (file events), `api-aco` (folder events), and `api-core` (dispatcher abstraction). Neither source package depends on this folder. Static event provider (5 hardcoded events: 2 file + 3 folder). The bridge's `feature.ts` is imported by `packages/webhooks/src/api/Extension.ts`.

**Prerequisite:** Phase 1 (`webhooks` core) must be complete.

---

## File Map

```
packages/webhooks/src/api/features/fileManager/
├── abstractions.ts
├── FmWebhookEventProvider.ts
├── handlers/
│   ├── OnFileCreatedHandler.ts
│   ├── OnFileDeletedHandler.ts
│   ├── OnFolderCreatedHandler.ts
│   ├── OnFolderUpdatedHandler.ts
│   └── OnFolderDeletedHandler.ts
└── feature.ts
```

---

## Task 1: `FmWebhookEventProvider`

Static event provider — returns 5 hardcoded events (2 file, 3 folder).

**Files:**
- Create: `packages/webhooks/src/api/features/fileManager/FmWebhookEventProvider.ts`

- [ ] **Step 1: Create `src/api/features/fileManager/FmWebhookEventProvider.ts`**

```ts
import { WebhookEventProvider } from "~/api/abstractions/WebhookEventProvider.js";
import type { IWebhookEventDefinition } from "~/api/domain/types.js";

const STATIC_EVENTS: IWebhookEventDefinition[] = [
    {
        app: "fileManager",
        modelId: "fmFile",
        eventName: "fmFile.entry.created",
        label: "File: Created"
    },
    {
        app: "fileManager",
        modelId: "fmFile",
        eventName: "fmFile.entry.deleted",
        label: "File: Deleted"
    },
    {
        app: "fileManager",
        modelId: "fmFolder",
        eventName: "fmFolder.entry.created",
        label: "Folder: Created"
    },
    {
        app: "fileManager",
        modelId: "fmFolder",
        eventName: "fmFolder.entry.updated",
        label: "Folder: Updated"
    },
    {
        app: "fileManager",
        modelId: "fmFolder",
        eventName: "fmFolder.entry.deleted",
        label: "Folder: Deleted"
    }
];

class FmWebhookEventProviderImpl implements WebhookEventProvider.Interface {
    async getAvailableEvents(): Promise<IWebhookEventDefinition[]> {
        return STATIC_EVENTS;
    }
}

export default WebhookEventProvider.createImplementation({
    implementation: FmWebhookEventProviderImpl,
    dependencies: []
});
```

---

## Task 2: File lifecycle event handlers

File events are imported from `@webiny/api-file-manager/exports/api/file-manager/file.js`.

**Note on payloads:**
- `FileAfterCreatePayload`: `{ file: File, meta?: Record<string, any> }`
- `FileAfterDeletePayload`: `{ file: File }`

The `File` type is the domain file object with an `id` field.

**Files:**
- Create: `packages/webhooks/src/api/features/fileManager/handlers/OnFileCreatedHandler.ts`
- Create: `packages/webhooks/src/api/features/fileManager/handlers/OnFileDeletedHandler.ts`

- [ ] **Step 1: Create `src/api/features/fileManager/handlers/OnFileCreatedHandler.ts`**

```ts
import {
    FileAfterCreateEventHandler
} from "@webiny/api-file-manager/exports/api/file-manager/file.js";
import { IWebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";

class OnFileCreatedHandlerImpl implements FileAfterCreateEventHandler.Interface {
    constructor(private webhookDispatcher: IWebhookDispatcher) {}

    async handle(event: FileAfterCreateEventHandler.Event): Promise<void> {
        const { file } = event.payload;
        await this.webhookDispatcher.dispatch("fmFile.entry.created", {
            modelId: "fmFile",
            fileId: file.id,
            file
        });
    }
}

export default FileAfterCreateEventHandler.createImplementation({
    implementation: OnFileCreatedHandlerImpl,
    dependencies: [IWebhookDispatcher]
});
```

- [ ] **Step 2: Create `src/api/features/fileManager/handlers/OnFileDeletedHandler.ts`**

```ts
import {
    FileAfterDeleteEventHandler
} from "@webiny/api-file-manager/exports/api/file-manager/file.js";
import { IWebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";

class OnFileDeletedHandlerImpl implements FileAfterDeleteEventHandler.Interface {
    constructor(private webhookDispatcher: IWebhookDispatcher) {}

    async handle(event: FileAfterDeleteEventHandler.Event): Promise<void> {
        const { file } = event.payload;
        await this.webhookDispatcher.dispatch("fmFile.entry.deleted", {
            modelId: "fmFile",
            fileId: file.id,
            file
        });
    }
}

export default FileAfterDeleteEventHandler.createImplementation({
    implementation: OnFileDeletedHandlerImpl,
    dependencies: [IWebhookDispatcher]
});
```

---

## Task 3: Folder lifecycle event handlers

Folder events are imported from `@webiny/api-aco/exports/api/aco/folder.js`. Folders live in `api-aco`, not `api-file-manager`.

**Note on payloads:**
- `FolderAfterCreatePayload`: `{ folder: Folder }`
- `FolderAfterUpdatePayload`: `{ original: Folder, folder: Folder, input: Record<string, any> }`
- `FolderAfterDeletePayload`: `{ folder: Folder }`

The `Folder` type is the ACO folder domain object with an `id` field.

**Files:**
- Create: `packages/webhooks/src/api/features/fileManager/handlers/OnFolderCreatedHandler.ts`
- Create: `packages/webhooks/src/api/features/fileManager/handlers/OnFolderUpdatedHandler.ts`
- Create: `packages/webhooks/src/api/features/fileManager/handlers/OnFolderDeletedHandler.ts`

- [ ] **Step 1: Create `src/api/features/fileManager/handlers/OnFolderCreatedHandler.ts`**

```ts
import {
    FolderAfterCreateEventHandler
} from "@webiny/api-aco/exports/api/aco/folder.js";
import { IWebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";

class OnFolderCreatedHandlerImpl implements FolderAfterCreateEventHandler.Interface {
    constructor(private webhookDispatcher: IWebhookDispatcher) {}

    async handle(event: FolderAfterCreateEventHandler.Event): Promise<void> {
        const { folder } = event.payload;
        await this.webhookDispatcher.dispatch("fmFolder.entry.created", {
            modelId: "fmFolder",
            folderId: folder.id,
            folder
        });
    }
}

export default FolderAfterCreateEventHandler.createImplementation({
    implementation: OnFolderCreatedHandlerImpl,
    dependencies: [IWebhookDispatcher]
});
```

- [ ] **Step 2: Create `src/api/features/fileManager/handlers/OnFolderUpdatedHandler.ts`**

```ts
import {
    FolderAfterUpdateEventHandler
} from "@webiny/api-aco/exports/api/aco/folder.js";
import { IWebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";

class OnFolderUpdatedHandlerImpl implements FolderAfterUpdateEventHandler.Interface {
    constructor(private webhookDispatcher: IWebhookDispatcher) {}

    async handle(event: FolderAfterUpdateEventHandler.Event): Promise<void> {
        const { folder } = event.payload;
        await this.webhookDispatcher.dispatch("fmFolder.entry.updated", {
            modelId: "fmFolder",
            folderId: folder.id,
            folder
        });
    }
}

export default FolderAfterUpdateEventHandler.createImplementation({
    implementation: OnFolderUpdatedHandlerImpl,
    dependencies: [IWebhookDispatcher]
});
```

- [ ] **Step 3: Create `src/api/features/fileManager/handlers/OnFolderDeletedHandler.ts`**

```ts
import {
    FolderAfterDeleteEventHandler
} from "@webiny/api-aco/exports/api/aco/folder.js";
import { IWebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";

class OnFolderDeletedHandlerImpl implements FolderAfterDeleteEventHandler.Interface {
    constructor(private webhookDispatcher: IWebhookDispatcher) {}

    async handle(event: FolderAfterDeleteEventHandler.Event): Promise<void> {
        const { folder } = event.payload;
        await this.webhookDispatcher.dispatch("fmFolder.entry.deleted", {
            modelId: "fmFolder",
            folderId: folder.id,
            folder
        });
    }
}

export default FolderAfterDeleteEventHandler.createImplementation({
    implementation: OnFolderDeletedHandlerImpl,
    dependencies: [IWebhookDispatcher]
});
```

---

## Task 4: `feature.ts` and registration in main `Extension.ts`

**Files:**
- Create: `packages/webhooks/src/api/features/fileManager/feature.ts`
- Modify: `packages/webhooks/src/api/Extension.ts`

- [ ] **Step 1: Create `src/api/features/fileManager/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import FmWebhookEventProvider from "./FmWebhookEventProvider.js";
import OnFileCreatedHandler from "./handlers/OnFileCreatedHandler.js";
import OnFileDeletedHandler from "./handlers/OnFileDeletedHandler.js";
import OnFolderCreatedHandler from "./handlers/OnFolderCreatedHandler.js";
import OnFolderUpdatedHandler from "./handlers/OnFolderUpdatedHandler.js";
import OnFolderDeletedHandler from "./handlers/OnFolderDeletedHandler.js";

export const fileManagerWebhooksFeature = createFeature({
    name: "FmWebhooks",
    register(container) {
        container.register(FmWebhookEventProvider);
        container.register(OnFileCreatedHandler);
        container.register(OnFileDeletedHandler);
        container.register(OnFolderCreatedHandler);
        container.register(OnFolderUpdatedHandler);
        container.register(OnFolderDeletedHandler);
    }
});
```

- [ ] **Step 2: Import and register `fileManagerWebhooksFeature` in `src/api/Extension.ts`**

Add the import:

```ts
import { fileManagerWebhooksFeature } from "~/api/features/fileManager/feature.js";
```

And include `fileManagerWebhooksFeature` in the features array (or container registration) inside `Extension.ts`.

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
git commit -m "feat(webhooks): FM file and folder lifecycle webhook bridge"
```

---

**Next:** Phase 5 — `docs/superpowers/plans/2026-05-11-webhooks-phase5-tm-bridge.md`
