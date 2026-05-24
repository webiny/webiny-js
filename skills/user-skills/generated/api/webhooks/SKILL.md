---
name: webiny-api-webhooks-catalog
context: webiny-api
description: >
  api/webhooks — 15 abstractions.
---

# api/webhooks

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---

**Name:** `createWebhooks`
**Import:** `import { createWebhooks } from "webiny/api/webhooks"`
**Source:** `@webiny/webhooks/api/index.ts`

---

**Name:** `IListMeta`
**Kind:** type
**Import:** `import type { IListMeta } from "webiny/api/webhooks"`
**Source:** `@webiny/webhooks/api/features/ListWebhooks/abstractions.ts`

---

**Name:** `IWebhookPayload`
**Kind:** type
**Import:** `import type { IWebhookPayload } from "webiny/api/webhooks"`
**Source:** `@webiny/webhooks/api/features/SendWebhookTask/types.ts`

---

**Name:** `Webhook`
**Kind:** type
**Import:** `import type { Webhook } from "webiny/api/webhooks"`
**Source:** `@webiny/webhooks/api/domain/Webhook.ts`

---

**Name:** `WebhookCmsEntry`
**Kind:** type
**Import:** `import type { WebhookCmsEntry } from "webiny/api/webhooks"`
**Source:** `@webiny/webhooks/api/domain/Webhook.ts`

---

**Name:** `WebhookCmsEntryValues`
**Kind:** type
**Import:** `import type { WebhookCmsEntryValues } from "webiny/api/webhooks"`
**Source:** `@webiny/webhooks/api/domain/Webhook.ts`

---

**Name:** `WebhookDelivery`
**Kind:** type
**Import:** `import type { WebhookDelivery } from "webiny/api/webhooks"`
**Source:** `@webiny/webhooks/api/domain/WebhookDelivery.ts`

---

**Name:** `WebhookDeliveryCmsEntry`
**Kind:** type
**Import:** `import type { WebhookDeliveryCmsEntry } from "webiny/api/webhooks"`
**Source:** `@webiny/webhooks/api/domain/WebhookDelivery.ts`

---

**Name:** `WebhookDeliveryCmsEntryValues`
**Kind:** type
**Import:** `import type { WebhookDeliveryCmsEntryValues } from "webiny/api/webhooks"`
**Source:** `@webiny/webhooks/api/domain/WebhookDelivery.ts`

---

**Name:** `WebhookDeliveryStatus`
**Kind:** type
**Import:** `import type { WebhookDeliveryStatus } from "webiny/api/webhooks"`
**Source:** `@webiny/webhooks/api/domain/WebhookDelivery.ts`

---

**Name:** `WebhookDispatcher`
**Import:** `import { WebhookDispatcher } from "webiny/api/webhooks"`
**Source:** `@webiny/api-core/features/webhooks/index.ts`
**Description:** Routes a domain event to all matching enabled webhooks via background tasks.

---

**Name:** `WebhookFactory`
**Import:** `import { WebhookFactory } from "webiny/api/webhooks"`
**Source:** `@webiny/api-core/features/webhooks/index.ts`

---

**Name:** `WebhookProvider`
**Import:** `import { WebhookProvider } from "webiny/api/webhooks"`
**Source:** `@webiny/api-core/features/webhooks/index.ts`

---

**Name:** `WebhookSignPayload`
**Import:** `import { WebhookSignPayload } from "webiny/api/webhooks"`
**Source:** `@webiny/api-core/features/webhooks/index.ts`
**Description:** Signs webhook payloads using the Standard Webhooks spec (https://www.standardwebhooks.com).

---

**Name:** `WebhookVerifyPayload`
**Import:** `import { WebhookVerifyPayload } from "webiny/api/webhooks"`
**Source:** `@webiny/api-core/features/webhooks/index.ts`
**Description:** Verifies incoming webhook payloads using the Standard Webhooks spec (https://www.standardwebhooks.com).

---
