# Webhooks Phase 4 — `api-file-manager-webhooks` FM Bridge

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `packages/api-file-manager-webhooks` — the bridge package that hooks into File Manager file and folder lifecycle events and feeds them into the webhook dispatcher.

**Architecture:** Pure bridge — depends on `api-file-manager` (file events), `api-aco` (folder events), and `api-webhooks` (dispatcher). Neither source package depends on this package. Static event provider (5 hardcoded events: 2 file + 3 folder).

**Prerequisite:** Phase 1 (`api-webhooks`) must be complete.

---

## File Map

```
packages/api-file-manager-webhooks/
├── package.json
├── tsconfig.json
├── index.ts
└── src/
    ├── FmWebhookEventProvider.ts
    ├── handlers/
    │   ├── OnFileCreatedHandler.ts
    │   ├── OnFileDeletedHandler.ts
    │   ├── OnFolderCreatedHandler.ts
    │   ├── OnFolderUpdatedHandler.ts
    │   └── OnFolderDeletedHandler.ts
    └── Extension.ts
```

---

## Task 1: Package scaffold

**Files:**
- Create: `packages/api-file-manager-webhooks/package.json`
- Create: `packages/api-file-manager-webhooks/tsconfig.json`
- Create: `packages/api-file-manager-webhooks/index.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@webiny/api-file-manager-webhooks",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./*": "./*"
  },
  "description": "File Manager file and folder webhook bridge for Webiny",
  "keywords": [
    "api-file-manager-webhooks:base"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git",
    "directory": "packages/api-file-manager-webhooks"
  },
  "license": "MIT",
  "dependencies": {
    "@webiny/api-aco": "0.0.0",
    "@webiny/api-file-manager": "0.0.0",
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
    { "path": "../api-aco" },
    { "path": "../api-file-manager" },
    { "path": "../api-webhooks" },
    { "path": "../feature" }
  ],
  "compilerOptions": {
    "rootDirs": ["./src"],
    "outDir": "./dist",
    "declarationDir": "./dist",
    "paths": {
      "~/*": ["./src/*"],
      "@webiny/api-aco/*": ["../api-aco/src/*"],
      "@webiny/api-aco": ["../api-aco/src"],
      "@webiny/api-file-manager/*": ["../api-file-manager/src/*"],
      "@webiny/api-file-manager": ["../api-file-manager/src"],
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
git add packages/api-file-manager-webhooks/
git commit -m "feat(api-file-manager-webhooks): add package scaffold"
```

---

## Task 2: `FmWebhookEventProvider`

Static event provider — returns 5 hardcoded events (2 file, 3 folder).

**Files:**
- Create: `packages/api-file-manager-webhooks/src/FmWebhookEventProvider.ts`

- [ ] **Step 1: Create `src/FmWebhookEventProvider.ts`**

```ts
import { WebhookEventProvider } from "@webiny/api-webhooks/src/abstractions/WebhookEventProvider.js";
import type { IWebhookEventDefinition } from "@webiny/api-webhooks/src/domain/types.js";

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

## Task 3: File lifecycle event handlers

File events are imported from `@webiny/api-file-manager/exports/api/file-manager/file.js`.

**Note on payloads:**
- `FileAfterCreatePayload`: `{ file: File, meta?: Record<string, any> }`
- `FileAfterDeletePayload`: `{ file: File }`

The `File` type is the domain file object with an `id` field.

**Files:**
- Create: `packages/api-file-manager-webhooks/src/handlers/OnFileCreatedHandler.ts`
- Create: `packages/api-file-manager-webhooks/src/handlers/OnFileDeletedHandler.ts`

- [ ] **Step 1: Create `src/handlers/OnFileCreatedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    FileAfterCreateEventHandler
} from "@webiny/api-file-manager/exports/api/file-manager/file.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnFileCreatedHandlerImpl implements FileAfterCreateEventHandler.Interface {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

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
    dependencies: [WebhookDispatcher]
});
```

- [ ] **Step 2: Create `src/handlers/OnFileDeletedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    FileAfterDeleteEventHandler
} from "@webiny/api-file-manager/exports/api/file-manager/file.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnFileDeletedHandlerImpl implements FileAfterDeleteEventHandler.Interface {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

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
    dependencies: [WebhookDispatcher]
});
```

---

## Task 4: Folder lifecycle event handlers

Folder events are imported from `@webiny/api-aco/exports/api/aco/folder.js`. Folders live in `api-aco`, not `api-file-manager`.

**Note on payloads:**
- `FolderAfterCreatePayload`: `{ folder: Folder }`
- `FolderAfterUpdatePayload`: `{ original: Folder, folder: Folder, input: Record<string, any> }`
- `FolderAfterDeletePayload`: `{ folder: Folder }`

The `Folder` type is the ACO folder domain object with an `id` field.

**Files:**
- Create: `packages/api-file-manager-webhooks/src/handlers/OnFolderCreatedHandler.ts`
- Create: `packages/api-file-manager-webhooks/src/handlers/OnFolderUpdatedHandler.ts`
- Create: `packages/api-file-manager-webhooks/src/handlers/OnFolderDeletedHandler.ts`

- [ ] **Step 1: Create `src/handlers/OnFolderCreatedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    FolderAfterCreateEventHandler
} from "@webiny/api-aco/exports/api/aco/folder.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnFolderCreatedHandlerImpl implements FolderAfterCreateEventHandler.Interface {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

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
    dependencies: [WebhookDispatcher]
});
```

- [ ] **Step 2: Create `src/handlers/OnFolderUpdatedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    FolderAfterUpdateEventHandler
} from "@webiny/api-aco/exports/api/aco/folder.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnFolderUpdatedHandlerImpl implements FolderAfterUpdateEventHandler.Interface {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

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
    dependencies: [WebhookDispatcher]
});
```

- [ ] **Step 3: Create `src/handlers/OnFolderDeletedHandler.ts`**

```ts
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    FolderAfterDeleteEventHandler
} from "@webiny/api-aco/exports/api/aco/folder.js";
import { WebhookDispatcher } from "@webiny/api-webhooks/src/abstractions/WebhookDispatcher.js";

class OnFolderDeletedHandlerImpl implements FolderAfterDeleteEventHandler.Interface {
    constructor(private webhookDispatcher: WebhookDispatcher.Interface) {}

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
    dependencies: [WebhookDispatcher]
});
```

---

## Task 5: Extension and final build

**Files:**
- Create: `packages/api-file-manager-webhooks/src/Extension.ts`

- [ ] **Step 1: Create `src/Extension.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import FmWebhookEventProvider from "./FmWebhookEventProvider.js";
import OnFileCreatedHandler from "./handlers/OnFileCreatedHandler.js";
import OnFileDeletedHandler from "./handlers/OnFileDeletedHandler.js";
import OnFolderCreatedHandler from "./handlers/OnFolderCreatedHandler.js";
import OnFolderUpdatedHandler from "./handlers/OnFolderUpdatedHandler.js";
import OnFolderDeletedHandler from "./handlers/OnFolderDeletedHandler.js";

export const Extension = createFeature({
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

- [ ] **Step 2: Build**

```bash
yarn build -p @webiny/api-file-manager-webhooks 2>&1 | tail -20
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
git add packages/api-file-manager-webhooks/
git commit -m "feat(api-file-manager-webhooks): FM file and folder lifecycle webhook bridge"
```

---

**Next:** Phase 5 — `docs/superpowers/plans/2026-05-11-webhooks-phase5-tm-bridge.md`
