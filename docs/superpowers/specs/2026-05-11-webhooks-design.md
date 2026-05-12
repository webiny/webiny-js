# Webhooks — API Design Spec

**Date:** 2026-05-11
**Author:** Bruno Zorić
**Status:** Approved

---

## Overview

Webhooks allow Webiny users to receive real-time HTTP notifications when events occur within their Webiny instance. External systems subscribe to specific events and receive a POST request with the event payload at a configured endpoint.

Delivery is asynchronous — each webhook fires as an independent background task so no webhook call blocks the GraphQL response or any other webhook delivery.

---

## 1. Package Structure

Five packages — one core, four bridge packages:

```
api-webhooks                    — core feature
api-headless-cms-webhooks       — bridge: CMS entry events
api-website-builder-webhooks    — bridge: page events
api-file-manager-webhooks       — bridge: file + folder events
api-tenant-manager-webhooks     — bridge: tenant events
```

### Dependency graph (no circular dependencies)

```
api-headless-cms  ←────────────────────────────────── api-webhooks
                  ←── api-headless-cms-webhooks ──→ api-webhooks
api-website-builder ←── api-website-builder-webhooks ──→ api-webhooks
api-file-manager    ←── api-file-manager-webhooks    ──→ api-webhooks
api-tenant-manager  ←── api-tenant-manager-webhooks  ──→ api-webhooks
```

- `api-webhooks` depends on `api-headless-cms` for CMS model storage only.
- Source packages (`api-headless-cms`, `api-website-builder`, etc.) never depend on `api-webhooks`.
- Bridge packages are the only ones that depend on both sides.

---

## 2. `api-webhooks` Internals

### 2.1 Private CMS Models

Both models are private/system models — registered in code, not visible in the content editor.

**Webhook:**

| Field | Type | Notes |
|---|---|---|
| `name` | text | Display name |
| `slug` | text | URL-safe, derived from name when empty, unique per tenant |
| `endpointUrl` | text | HTTPS required; localhost HTTP allowed |
| `description` | long-text | Optional |
| `enabled` | boolean | Defaults to false; user must explicitly enable after creation |
| `events` | text[] | Multi-value. Stores full event name strings e.g. `product.entry.published` |
| `signingSecret` | text | User-defined secret used to sign the webhook payload. Required. |

**WebhookDelivery:**

| Field | Type | Notes |
|---|---|---|
| `webhookId` | text | Reference to the Webhook entry ID |
| `backgroundTaskId` | text | Reference to the background task that executed the delivery |
| `eventType` | text | Event name that triggered this delivery e.g. `product.entry.published` |
| `payload` | compressed rich-text | Full JSON body sent to the endpoint |
| `requestHeaders` | compressed rich-text | Request headers sent, including `Webiny-Signature` |
| `responseTime` | number | Duration in milliseconds |
| `responseStatus` | number | HTTP status code returned by the endpoint |
| `responseBody` | compressed rich-text | Response body from the endpoint |
| `expiresAt` | datetime | Set to `createdOn + 90 days` on every write — enforces retention policy |

### 2.2 Core Abstractions

**`WebhookDispatcher`** — called by bridge packages when a domain event fires:

```ts
interface IWebhookDispatcher {
    dispatch(eventName: string, data: object): Promise<void>;
}
```

Implementation:
1. Queries enabled `Webhook` entries where `events` contains `eventName`.
2. For each match, dispatches one `SendWebhookTask`.

**`IWebhookEventProvider`** — implemented by each bridge package; produces the available event list for the UI event picker:

```ts
interface IWebhookEventProvider {
    getAvailableEvents(): Promise<WebhookEventDefinition[]>;
}

interface WebhookEventDefinition {
    app: string;       // "cms" | "websiteBuilder" | "fileManager" | "tenantManager"
    modelId: string;   // underlying CMS model ID: "product", "pbPage", "fmFile", "tenant", etc.
    eventName: string; // full event name: "product.entry.published"
    label: string;     // human-readable: "Product: Entry Published"
}
```

`api-webhooks` collects all registered `IWebhookEventProvider` implementations via the DI container and merges them for the `listAvailableWebhookEvents` GraphQL query.

**`WebhookSignPayload`** — placeholder abstraction, internal storage mechanism deferred:

```ts
interface IWebhookSignPayload {
    sign(rawBody: string, timestamp: number): string;
    // Returns header value: "t=<timestamp>,v1=<hmac-sha256>"
}
```

Signature format matches Stripe convention: HMAC-SHA256 over `{timestamp}.{rawBody}` using the webhook's own `signingSecret`.

### 2.3 `SendWebhookTask` (Background Task)

Input: `{ webhookId, eventName, data }`

Execution steps:
1. Fetch `Webhook` entry from CMS (endpointUrl, slug, signingSecret).
2. Build full event payload:
   ```json
   {
     "id": "<entry.id>",
     "event": "<eventName>",
     "timestamp": "<ISO8601>",
     "webhookId": "<webhookId>",
     "tenant": "<tenantId>",
     "data": { ... }
   }
   ```
3. Sign: `WebhookSignPayload.sign(rawBody, timestamp)` → `Webiny-Signature` header.
4. HTTP POST to `endpointUrl`, **10-minute timeout**.
5. Write `WebhookDelivery` log entry regardless of outcome:
   - 2xx response → success
   - Non-2xx or timeout → failure
   - `expiresAt` always set to `now + 90 days`

No automatic retries. Users can manually resend from the UI.

---

## 3. Bridge Package Pattern

Each bridge package registers two things in the DI container:

### 3.1 `IWebhookEventProvider` implementation

Produces the list of subscribable events for the UI accordion.

- **CMS bridge** — dynamic: queries all content models at runtime, generates 5 events per model (`created`, `updated`, `deleted`, `published`, `unpublished`). Event name pattern: `{modelId}.entry.{action}`.
- **Other bridges** — static: hardcoded list of their model IDs and supported actions.

### 3.2 `IEventHandler` per domain event

Hooks into existing lifecycle events from the source package and calls `WebhookDispatcher`.

Example (`api-headless-cms-webhooks`):

```ts
class OnEntryPublishedHandler implements IEventHandler<EntryAfterPublishEvent> {
    async handle(event: EntryAfterPublishEvent): Promise<void> {
        const { entry, model } = event.payload;
        await this.webhookDispatcher.dispatch(
            `${model.modelId}.entry.published`,
            { modelId: model.modelId, entryId: entry.entryId, entry }
        );
    }
}
```

All four bridge packages follow this same structure — register an event provider and one handler per supported domain event.

**CMS events** (5 per content model, dynamic):
- `{modelId}.entry.created`
- `{modelId}.entry.updated`
- `{modelId}.entry.deleted`
- `{modelId}.entry.published`
- `{modelId}.entry.unpublished`

**Website Builder events** (static):
- `pbPage.entry.created`, `pbPage.entry.updated`, `pbPage.entry.deleted`, `pbPage.entry.published`, `pbPage.entry.unpublished`
- Same pattern for redirects and any other page builder models.

**File Manager events** (static):
- `fmFile.entry.created`, `fmFile.entry.deleted`
- `fmFolder.entry.created`, `fmFolder.entry.updated`, `fmFolder.entry.deleted`

**Tenant Manager events** (static):
- `tenant.entry.created`, `tenant.entry.updated`, `tenant.entry.deleted`

---

## 4. GraphQL API

All queries and mutations live in `api-webhooks`.

### Webhook CRUD
- `listWebhooks` — paginated, filterable by enabled/disabled
- `getWebhook(id)` — full detail including subscribed events
- `createWebhook(input)` — validates HTTPS (localhost exception), requires ≥1 event
- `updateWebhook(id, input)`
- `deleteWebhook(id)` — removes webhook and all its delivery log entries

### Event Picker
- `listAvailableWebhookEvents` — collects from all `IWebhookEventProvider` implementations, returns grouped list

### Testing
- `triggerWebhook(id, payload)` — fires a test delivery regardless of `enabled` state; `payload` is a free-form JSON object provided by the user; logs a `WebhookDelivery` entry like any real delivery

### Delivery Log
- `listWebhookDeliveries(webhookId)` — paginated
- `getWebhookDelivery(deliveryId)` — full detail: payload sent, headers, response status, response body
- `resendWebhookDelivery(deliveryId)` — reads original delivery's payload, dispatches a new `SendWebhookTask`, creates a new `WebhookDelivery` entry with a fresh `expiresAt`

---

## 5. End-to-End Data Flow

### Normal delivery

```
1. GraphQL mutation: publishEntry("product", entryId)
2. PublishEntryUseCase publishes EntryAfterPublishEvent
3. api-headless-cms-webhooks: OnEntryPublishedHandler.handle()
4.   → webhookDispatcher.dispatch("product.entry.published", { modelId, entryId, entry })
5.   → queries Webhook CMS model: enabled webhooks where events ∋ "product.entry.published"
6.   → for each match: dispatch SendWebhookTask({ webhookId, eventName, data })
7.   → GraphQL response returns to caller (tasks are fire-and-forget)

8. SendWebhookTask executes (async, one per webhook):
9.   → fetch Webhook entry from CMS (endpointUrl)
10.  → build full event payload
11.  → sign payload → Webiny-Signature header
12.  → HTTP POST to endpointUrl, 10min timeout
13.  → write WebhookDelivery log entry (payload, requestHeaders, responseStatus,
         responseBody, responseTime, expiresAt = now + 90 days)
```

### Resend

```
resendWebhookDelivery(deliveryId)
  → read original WebhookDelivery.payload
  → dispatch new SendWebhookTask with same payload
  → new WebhookDelivery log entry created (fresh expiresAt)
```

---

## 6. Out of Scope (Initial Version)

- Automatic retries on failure (manual resend only)
- `WebhookSignPayload` internal storage mechanism (abstraction + placeholder implementation only)
- App-layer UI (`api-*` packages only in this phase)
