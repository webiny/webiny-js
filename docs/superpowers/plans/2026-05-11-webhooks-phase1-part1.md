# Webhooks Phase 1 — `api-webhooks` Core Package (Part 1 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `packages/api-webhooks` package with package scaffold, domain types, shared abstractions, and CMS model definitions.

**Architecture:** A new standalone package that owns the Webhook and WebhookDelivery CMS models, the background task for HTTP delivery, the WebhookDispatcher that routes domain events to tasks, and all CRUD/secret/event GraphQL operations. Bridge packages (phases 2-5) depend on this package — this package does not depend on them.

**Tech Stack:** TypeScript ESM, `@webiny/feature/api` DI container, `@webiny/api-headless-cms` for CMS model storage, `@webiny/tasks` background task runner, `node:crypto` HMAC-SHA256.

**Continued in:**
- Part 2: `2026-05-11-webhooks-phase1-part2.md` — Tasks 5-7 (implementations + tests)
- Part 3: `2026-05-11-webhooks-phase1-part3.md` — Tasks 8-10 (use cases)
- Part 4: `2026-05-11-webhooks-phase1-part4.md` — Tasks 11-12 (GraphQL + Extension + exports)

---

## File Map

```
packages/api-webhooks/
├── package.json
├── tsconfig.json
├── index.ts
├── src/
│   ├── domain/
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── errors.ts
│   ├── abstractions/
│   │   ├── WebhookDispatcher.ts
│   │   ├── WebhookEventProvider.ts
│   │   └── WebhookSignPayload.ts
│   ├── models/
│   │   ├── WebhookModel.ts
│   │   ├── WebhookDeliveryModel.ts
│   │   └── WebhookSettingsModel.ts
│   ├── features/
│   │   ├── WebhookSignPayload/      (part 2)
│   │   ├── WebhookDispatcher/       (part 2)
│   │   ├── SendWebhookTask/         (part 2)
│   │   ├── CreateWebhook/           (part 3)
│   │   ├── GetWebhook/              (part 3)
│   │   ├── ListWebhooks/            (part 3)
│   │   ├── UpdateWebhook/           (part 3)
│   │   ├── DeleteWebhook/           (part 3)
│   │   ├── CreateWebhookDelivery/   (part 3)
│   │   ├── GetWebhookDelivery/      (part 3)
│   │   ├── ListWebhookDeliveries/   (part 3)
│   │   ├── ResendWebhookDelivery/   (part 3)
│   │   ├── GetWebhookSecret/        (part 3)
│   │   ├── RotateWebhookSecret/     (part 3)
│   │   └── ListAvailableWebhookEvents/ (part 3)
│   ├── graphql/                     (part 4)
│   ├── exports/api/webhooks.ts      (part 4)
│   └── Extension.ts                 (part 4)
└── __tests__/                       (part 2)
```

---

## Task 1: Package scaffold

**Files:**
- Create: `packages/api-webhooks/package.json`
- Create: `packages/api-webhooks/tsconfig.json`
- Create: `packages/api-webhooks/index.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@webiny/api-webhooks",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./*": "./*"
  },
  "description": "Webhooks feature for Webiny",
  "keywords": [
    "api-webhooks:base"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git",
    "directory": "packages/api-webhooks"
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
export { Extension } from "./src/Extension.js";
export { WebhookDispatcher } from "./src/abstractions/WebhookDispatcher.js";
export { WebhookEventProvider } from "./src/abstractions/WebhookEventProvider.js";
export { WebhookSignPayload } from "./src/abstractions/WebhookSignPayload.js";
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
git add packages/api-webhooks/package.json packages/api-webhooks/tsconfig.json packages/api-webhooks/index.ts
git commit -m "feat(api-webhooks): add package scaffold"
```

---

## Task 2: Domain types, constants, and errors

**Files:**
- Create: `packages/api-webhooks/src/domain/types.ts`
- Create: `packages/api-webhooks/src/domain/constants.ts`
- Create: `packages/api-webhooks/src/domain/errors.ts`

- [ ] **Step 1: Create `src/domain/constants.ts`**

```ts
export const WEBHOOK_MODEL_ID = "webhook";
export const WEBHOOK_DELIVERY_MODEL_ID = "webhookDelivery";
export const WEBHOOK_SETTINGS_MODEL_ID = "webhookSettings";
export const WEBHOOK_SETTINGS_ENTRY_ID = "webhookSettings";
export const SEND_WEBHOOK_TASK = "sendWebhook";
export const WEBHOOK_DELIVERY_RETENTION_DAYS = 90;
```

- [ ] **Step 2: Create `src/domain/types.ts`**

```ts
export interface IWebhookValues {
    name: string;
    slug: string;
    endpointUrl: string;
    description?: string;
    enabled: boolean;
    events: string[];
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

export interface IWebhookSettingsValues {
    secret: string;
}

export interface IWebhookSettings {
    id: string;
    values: IWebhookSettingsValues;
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

- [ ] **Step 3: Create `src/domain/errors.ts`**

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

export class WebhookSettingsNotFoundError extends BaseError {
    constructor() {
        super("Webhook settings not found.", "WEBHOOK_SETTINGS_NOT_FOUND");
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
yarn build -p @webiny/api-webhooks 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add packages/api-webhooks/src/domain/
git commit -m "feat(api-webhooks): add domain types, constants, and errors"
```

---

## Task 3: Shared abstractions

**Files:**
- Create: `packages/api-webhooks/src/abstractions/WebhookDispatcher.ts`
- Create: `packages/api-webhooks/src/abstractions/WebhookEventProvider.ts`
- Create: `packages/api-webhooks/src/abstractions/WebhookSignPayload.ts`

- [ ] **Step 1: Create `src/abstractions/WebhookDispatcher.ts`**

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface IWebhookDispatcher {
    dispatch(eventName: string, data: object): Promise<void>;
}

/** Routes a domain event to all matching enabled webhooks via background tasks. */
export const WebhookDispatcher = createAbstraction<IWebhookDispatcher>(
    "Webhooks/WebhookDispatcher"
);

export namespace WebhookDispatcher {
    export type Interface = IWebhookDispatcher;
}
```

- [ ] **Step 2: Create `src/abstractions/WebhookEventProvider.ts`**

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { IWebhookEventDefinition } from "~/domain/types.js";

export interface IWebhookEventProvider {
    getAvailableEvents(): Promise<IWebhookEventDefinition[]>;
}

/** Implemented by each bridge package; contributes subscribable events to the UI event picker. */
export const WebhookEventProvider = createAbstraction<IWebhookEventProvider>(
    "Webhooks/WebhookEventProvider"
);

export namespace WebhookEventProvider {
    export type Interface = IWebhookEventProvider;
}
```

- [ ] **Step 3: Create `src/abstractions/WebhookSignPayload.ts`**

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface IWebhookSignPayload {
    /** Returns Stripe-format signature header value: `t={timestamp},v1={hmac-sha256}` */
    sign(rawBody: string, timestamp: number): Promise<string>;
}

/** Signs webhook payloads using HMAC-SHA256 with the tenant's webhook secret. */
export const WebhookSignPayload = createAbstraction<IWebhookSignPayload>(
    "Webhooks/WebhookSignPayload"
);

export namespace WebhookSignPayload {
    export type Interface = IWebhookSignPayload;
}
```

- [ ] **Step 4: Build**

```bash
yarn build -p @webiny/api-webhooks 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add packages/api-webhooks/src/abstractions/
git commit -m "feat(api-webhooks): add shared abstractions (WebhookDispatcher, WebhookEventProvider, WebhookSignPayload)"
```

---

## Task 4: CMS Models

**Files:**
- Create: `packages/api-webhooks/src/models/WebhookModel.ts`
- Create: `packages/api-webhooks/src/models/WebhookDeliveryModel.ts`
- Create: `packages/api-webhooks/src/models/WebhookSettingsModel.ts`

The models are private/system — registered in code, invisible in the content editor. They use the builder tags `["$publishing:false", "$hidden:true"]`.

`WebhookSettings` is a singleton model (one entry per tenant, accessed by fixed id `"webhookSettings"`).

- [ ] **Step 1: Create `src/models/WebhookModel.ts`**

```ts
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WEBHOOK_MODEL_ID } from "~/domain/constants.js";

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
                .defaultValue(true)
                .renderer("switch"),
            events: fields
                .text()
                .list()
                .label("Events")
                .defaultValue([])
                .renderer("textInputs", {
                    multiValue: { addValueButtonLabel: "Add Event" }
                })
        }));

        return [model];
    }
}

export default ModelFactory.createImplementation({
    implementation: WebhookModelFactory,
    dependencies: []
});
```

- [ ] **Step 2: Create `src/models/WebhookDeliveryModel.ts`**

Compressed fields (`payload`, `requestHeaders`, `responseBody`) store `JSON.stringify(ICompressedValue)` in longText fields.

```ts
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/domain/constants.js";

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

- [ ] **Step 3: Create `src/models/WebhookSettingsModel.ts`**

Singleton model — one entry per tenant, accessed by the fixed entry id `WEBHOOK_SETTINGS_ENTRY_ID = "webhookSettings"`.

```ts
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WEBHOOK_SETTINGS_MODEL_ID } from "~/domain/constants.js";

class WebhookSettingsModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder
            .public({
                modelId: WEBHOOK_SETTINGS_MODEL_ID,
                name: "Webhook Settings",
                group: "hidden"
            })
            .description("Stores the per-tenant webhook signing secret.")
            .singularApiName("WebhookSettings")
            .pluralApiName("WebhookSettings")
            .tags(["$publishing:false", "$hidden:true"]);

        model.fields(fields => ({
            secret: fields
                .text()
                .label("Secret")
                .required()
                .description("HMAC-SHA256 signing secret in whsec_<random> format.")
                .renderer("textInput")
        }));

        return [model];
    }
}

export default ModelFactory.createImplementation({
    implementation: WebhookSettingsModelFactory,
    dependencies: []
});
```

- [ ] **Step 4: Build**

```bash
yarn build -p @webiny/api-webhooks 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add packages/api-webhooks/src/models/
git commit -m "feat(api-webhooks): add CMS models (Webhook, WebhookDelivery, WebhookSettings)"
```

---

**Continue in Part 2:** `docs/superpowers/plans/2026-05-11-webhooks-phase1-part2.md`
