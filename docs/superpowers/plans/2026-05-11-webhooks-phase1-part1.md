# Webhooks Phase 1 — `webhooks` Core Package (Part 1 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `packages/webhooks` package with package scaffold, domain types, shared abstractions (in `api-core`), and CMS model definitions.

**Architecture:** A new standalone package that owns the Webhook and WebhookDelivery CMS models, the background task for HTTP delivery, the WebhookDispatcher that routes domain events to tasks, and all CRUD/event GraphQL operations. The three shared DI abstraction tokens live in `packages/api-core/src/features/webhooks/abstractions.ts`. Bridge packages (phases 2-5) depend on this package — this package does not depend on them.

**Tech Stack:** TypeScript ESM, `@webiny/feature/api` DI container, `@webiny/api-headless-cms` for CMS model storage, `@webiny/tasks` background task runner, `node:crypto` HMAC-SHA256.

**Continued in:**
- Part 2: `2026-05-11-webhooks-phase1-part2.md` — Tasks 5-7 (implementations + tests)
- Part 3: `2026-05-11-webhooks-phase1-part3.md` — Tasks 8-10 (use cases)
- Part 4: `2026-05-11-webhooks-phase1-part4.md` — Tasks 11-12 (GraphQL + Extension + exports)

---

## File Map

```
packages/api-core/src/features/webhooks/
└── abstractions.ts             ← NEW task (add to api-core)

packages/webhooks/
├── package.json
├── tsconfig.json
├── index.ts
└── src/
    └── api/
        ├── domain/
        │   ├── types.ts
        │   ├── constants.ts
        │   └── errors.ts
        ├── models/
        │   ├── WebhookModel.ts
        │   └── WebhookDeliveryModel.ts
        ├── features/
        │   ├── WebhookSignPayload/      (part 2)
        │   ├── WebhookDispatcher/       (part 2)
        │   ├── SendWebhookTask/         (part 2)
        │   ├── CreateWebhook/           (part 3)
        │   ├── GetWebhook/              (part 3)
        │   ├── ListWebhooks/            (part 3)
        │   ├── UpdateWebhook/           (part 3)
        │   ├── DeleteWebhook/           (part 3)
        │   ├── CreateWebhookDelivery/   (part 3)
        │   ├── GetWebhookDelivery/      (part 3)
        │   ├── ListWebhookDeliveries/   (part 3)
        │   ├── ResendWebhookDelivery/   (part 3)
        │   └── ListAvailableWebhookEvents/ (part 3)
        └── graphql/                     (part 4)
        └── Extension.ts                 (part 4)
__tests__/                               (part 2)
```

---

## ✅ Task 1: Shared abstraction tokens in `api-core` — DONE

**Actual structure (differs from original plan):**

Each token lives in its own subdirectory with its own `abstractions.ts`. `IWebhookEventDefinition` is defined in `api-core` (not imported from `@webiny/webhooks` — that would be circular).

```
packages/api-core/src/features/webhooks/
├── WebhookDispatcher/
│   └── abstractions.ts
├── WebhookEventProvider/
│   └── abstractions.ts    ← also owns IWebhookEventDefinition
├── WebhookSignPayload/
│   └── abstractions.ts    ← sign() returns IWebhookSignPayloadResponse { hash }
└── index.ts
```

**Key decisions:**
- `sign()` returns `IWebhookSignPayloadResponse { hash: string }` (not `string`) — extensible without breaking callers.
- `IWebhookEventDefinition` lives here, not in `@webiny/webhooks`, to avoid circular dependency.
- Committed across two commits: `09c0a4b` (initial) and `e0a4003` (sign response object).

---

## Task 2: Package scaffold

**Files:**
- Create: `packages/webhooks/package.json`
- Create: `packages/webhooks/tsconfig.json`
- Create: `packages/webhooks/index.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@webiny/webhooks",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./*": "./*"
  },
  "description": "Webhooks feature for Webiny",
  "keywords": ["webhooks:base"],
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git",
    "directory": "packages/webhooks"
  },
  "license": "MIT",
  "dependencies": {
    "@webiny/api-headless-cms": "0.0.0",
    "@webiny/api-core": "0.0.0",
    "@webiny/error": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/handler-graphql": "0.0.0",
    "@webiny/tasks": "0.0.0",
    "@webiny/utils": "0.0.0",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@webiny/api": "0.0.0",
    "@webiny/build-tools": "0.0.0",
    "@webiny/di": "0.0.0",
    "@webiny/project-utils": "0.0.0",
    "typescript": "6.0.3",
    "vitest": "^4.1.5"
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
  "include": ["src", "__tests__"],
  "references": [
    { "path": "../api-headless-cms" },
    { "path": "../api-website-builder" },
    { "path": "../api-file-manager" },
    { "path": "../api-tenant-manager" },
    { "path": "../api-core" },
    { "path": "../error" },
    { "path": "../feature" },
    { "path": "../handler-graphql" },
    { "path": "../tasks" },
    { "path": "../utils" },
    { "path": "../api" },
    { "path": "../di" }
  ],
  "compilerOptions": {
    "rootDirs": ["./src", "./__tests__"],
    "outDir": "./dist",
    "declarationDir": "./dist",
    "paths": {
      "~/*": ["./src/*"],
      "~tests/*": ["./__tests__/*"],
      "@webiny/api-headless-cms/*": ["../api-headless-cms/src/*"],
      "@webiny/api-headless-cms": ["../api-headless-cms/src"],
      "@webiny/api-website-builder/*": ["../api-website-builder/src/*"],
      "@webiny/api-website-builder": ["../api-website-builder/src"],
      "@webiny/api-file-manager/*": ["../api-file-manager/src/*"],
      "@webiny/api-file-manager": ["../api-file-manager/src"],
      "@webiny/api-tenant-manager/*": ["../api-tenant-manager/src/*"],
      "@webiny/api-tenant-manager": ["../api-tenant-manager/src"],
      "@webiny/api-core/*": ["../api-core/src/*"],
      "@webiny/api-core": ["../api-core/src"],
      "@webiny/error/*": ["../error/src/*"],
      "@webiny/error": ["../error/src"],
      "@webiny/feature/*": ["../feature/src/*"],
      "@webiny/feature": ["../feature/src"],
      "@webiny/handler-graphql/*": ["../handler-graphql/src/*"],
      "@webiny/handler-graphql": ["../handler-graphql/src"],
      "@webiny/tasks/*": ["../tasks/src/*"],
      "@webiny/tasks": ["../tasks/src"],
      "@webiny/utils/*": ["../utils/src/*"],
      "@webiny/utils": ["../utils/src"],
      "@webiny/api/*": ["../api/src/*"],
      "@webiny/api": ["../api/src"],
      "@webiny/di/*": ["../di/src/*"],
      "@webiny/di": ["../di/src"]
    }
  }
}
```

- [ ] **Step 3: Create `index.ts`**

```ts
export { Extension } from "./src/api/Extension.js";
```

- [ ] **Step 4: Install dependencies and regenerate tsconfigs**

```bash
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/webhooks/package.json packages/webhooks/tsconfig.json packages/webhooks/index.ts
git commit -m "feat(webhooks): add package scaffold"
```

---

## Task 3: Domain types, constants, and errors

**Files:**
- Create: `packages/webhooks/src/api/domain/types.ts`
- Create: `packages/webhooks/src/api/domain/constants.ts`
- Create: `packages/webhooks/src/api/domain/errors.ts`

- [ ] **Step 1: Create `src/api/domain/constants.ts`**

```ts
export const WEBHOOK_MODEL_ID = "webhook";
export const WEBHOOK_DELIVERY_MODEL_ID = "webhookDelivery";
export const SEND_WEBHOOK_TASK = "sendWebhook";
export const WEBHOOK_DELIVERY_RETENTION_DAYS = 90;
```

- [ ] **Step 2: Create `src/api/domain/types.ts`**

```ts
export interface IWebhookValues {
    name: string;
    slug: string;
    endpointUrl: string;
    description?: string;
    enabled: boolean;
    events: string[];
    signingSecret: string;
}

export interface IWebhook {
    id: string;
    values: IWebhookValues;
    createdOn?: string;
    modifiedOn?: string;
}

/** Delivery as read back from CMS (fields decompressed). */
export interface IWebhookDeliveryValues {
    webhookId: string;
    backgroundTaskId: string;
    eventType: string;
    payload: object | null;
    requestHeaders: object | null;
    responseTime: number;
    responseStatus: number;
    responseBody: string | null;
    expiresAt: string;
}

export interface IWebhookDelivery {
    id: string;
    values: IWebhookDeliveryValues;
    createdOn?: string;
}

/** Raw input for creating a delivery (before compression). */
export interface ICreateDeliveryInput {
    webhookId: string;
    backgroundTaskId: string;
    eventType: string;
    payload: object;
    requestHeaders: object;
    responseTime: number;
    responseStatus: number;
    responseBody: string;
    expiresAt: string;
}

export interface IWebhookEventDefinition {
    app: string;
    modelId: string;
    eventName: string;
    label: string;
}

export interface IListMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface IListWebhooksInput {
    where?: {
        enabled?: boolean;
        events?: string;
    };
    limit?: number;
    after?: string;
}

export interface IListWebhookDeliveriesInput {
    webhookId: string;
    limit?: number;
    after?: string;
}

/** Full JSON body sent to the endpoint. */
export interface IWebhookPayload {
    id: string;
    event: string;
    timestamp: string;
    webhookId: string;
    tenant: string;
    data: object;
}
```

- [ ] **Step 3: Create `src/api/domain/errors.ts`**

```ts
import { BaseError } from "@webiny/feature/api";

export class WebhookNotFoundError extends BaseError {
    constructor(id: string) {
        super(`Webhook "${id}" was not found.`, "WEBHOOK_NOT_FOUND");
    }
}

export class WebhookDeliveryNotFoundError extends BaseError {
    constructor(id: string) {
        super(`Webhook delivery "${id}" was not found.`, "WEBHOOK_DELIVERY_NOT_FOUND");
    }
}

export class WebhookValidationError extends BaseError {
    constructor(message: string) {
        super(message, "WEBHOOK_VALIDATION_ERROR");
    }
}

export class WebhookPersistenceError extends BaseError {
    constructor(error: Error) {
        super(error.message, "WEBHOOK_PERSISTENCE_ERROR", { error });
    }
}

export class WebhookModelNotFoundError extends BaseError {
    constructor(modelId: string) {
        super(`Webhook model "${modelId}" was not found.`, "WEBHOOK_MODEL_NOT_FOUND");
    }
}
```

- [ ] **Step 4: Build to confirm no type errors**

```bash
yarn build -p @webiny/webhooks 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add packages/webhooks/src/api/domain/
git commit -m "feat(webhooks): add domain types, constants, and errors"
```

---

## Task 4: CMS Models

**Files:**
- Create: `packages/webhooks/src/api/models/WebhookModel.ts`
- Create: `packages/webhooks/src/api/models/WebhookDeliveryModel.ts`

The models are private/system — registered in code, invisible in the content editor. They use the builder tags `["$publishing:false", "$hidden:true"]`.

- [ ] **Step 1: Create `src/api/models/WebhookModel.ts`**

Note: `enabled` defaults to `false` and `signingSecret` is a required field on the model.

```ts
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WEBHOOK_MODEL_ID } from "~/api/domain/constants.js";

class WebhookModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder
            .public({ modelId: WEBHOOK_MODEL_ID, name: "Webhook", group: "hidden" })
            .description("Stores webhook configurations.")
            .titleFieldId("name")
            .singularApiName("Webhook")
            .pluralApiName("Webhooks")
            .tags(["$publishing:false", "$hidden:true"]);

        model.fields(fields => ({
            name: fields.text().label("Name").required().renderer("textInput"),
            slug: fields
                .text()
                .label("Slug")
                .required()
                .description("URL-safe identifier, unique per tenant.")
                .renderer("textInput"),
            endpointUrl: fields
                .text()
                .label("Endpoint URL")
                .required()
                .description("HTTPS destination for POST requests.")
                .renderer("textInput"),
            description: fields.longText().label("Description").renderer("textarea"),
            enabled: fields
                .boolean()
                .label("Enabled")
                .defaultValue(false)
                .renderer("switch"),
            events: fields
                .text()
                .list()
                .label("Events")
                .defaultValue([])
                .renderer("textInputs", {
                    multiValue: { addValueButtonLabel: "Add Event" }
                }),
            signingSecret: fields
                .text()
                .label("Signing Secret")
                .required()
                .description("HMAC-SHA256 signing secret in whsec_<random> format.")
                .renderer("textInput")
        }));

        return [model];
    }
}

export default ModelFactory.createImplementation({
    implementation: WebhookModelFactory,
    dependencies: []
});
```

- [ ] **Step 2: Create `src/api/models/WebhookDeliveryModel.ts`**

Compressed fields (`payload`, `requestHeaders`, `responseBody`) store `JSON.stringify(ICompressedValue)` in longText fields.

```ts
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/api/domain/constants.js";

class WebhookDeliveryModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder
            .public({
                modelId: WEBHOOK_DELIVERY_MODEL_ID,
                name: "Webhook Delivery",
                group: "hidden"
            })
            .description("Stores webhook delivery logs.")
            .singularApiName("WebhookDelivery")
            .pluralApiName("WebhookDeliveries")
            .tags(["$publishing:false", "$hidden:true"]);

        model.fields(fields => ({
            webhookId: fields.text().label("Webhook ID").required().renderer("textInput"),
            backgroundTaskId: fields
                .text()
                .label("Background Task ID")
                .required()
                .renderer("textInput"),
            eventType: fields.text().label("Event Type").required().renderer("textInput"),
            payload: fields
                .longText()
                .label("Payload")
                .description("JSON.stringify(ICompressedValue) — full event body sent.")
                .renderer("textarea"),
            requestHeaders: fields
                .longText()
                .label("Request Headers")
                .description("JSON.stringify(ICompressedValue) — headers sent, including Webiny-Signature.")
                .renderer("textarea"),
            responseTime: fields.number().label("Response Time (ms)").renderer("number"),
            responseStatus: fields.number().label("Response Status").renderer("number"),
            responseBody: fields
                .longText()
                .label("Response Body")
                .description("JSON.stringify(ICompressedValue) — body returned by the endpoint.")
                .renderer("textarea"),
            expiresAt: fields
                .datetime()
                .label("Expires At")
                .description("Set to createdOn + 90 days. Enforces retention policy.")
                .renderer("dateTimeInput")
        }));

        return [model];
    }
}

export default ModelFactory.createImplementation({
    implementation: WebhookDeliveryModelFactory,
    dependencies: []
});
```

- [ ] **Step 3: Build**

```bash
yarn build -p @webiny/webhooks 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add packages/webhooks/src/api/models/
git commit -m "feat(webhooks): add CMS models (Webhook, WebhookDelivery)"
```

---

**Continue in Part 2:** `docs/superpowers/plans/2026-05-11-webhooks-phase1-part2.md`
