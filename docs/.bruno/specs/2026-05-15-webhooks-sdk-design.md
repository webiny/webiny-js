# Webhooks SDK Design

Add webhooks support to `packages/sdk` so programmatic consumers can manage webhooks, deliveries, events, and triggers without writing GraphQL directly.

## Scope

10 operations covering the full webhooks GraphQL API:

| Method | Params | Returns |
|--------|--------|---------|
| `getWebhook` | `{ id }` | `Webhook` |
| `listWebhooks` | `{ where?, limit?, after? }` | `{ data: Webhook[], meta }` |
| `createWebhook` | `{ name, endpointUrl, events, slug?, description?, enabled? }` | `Webhook` |
| `updateWebhook` | `{ id, name?, slug?, endpointUrl?, description?, enabled?, events? }` | `Webhook` |
| `deleteWebhook` | `{ id }` | `boolean` |
| `getWebhookDelivery` | `{ id }` | `WebhookDelivery` |
| `listWebhookDeliveries` | `{ webhookId, limit?, after? }` | `{ data: WebhookDelivery[], meta }` |
| `resendWebhookDelivery` | `{ id }` | `boolean` |
| `triggerWebhook` | `{ id, payload }` | `WebhookDelivery` |
| `listAvailableWebhookEvents` | none | `WebhookEvent[]` |

All methods return `Promise<Result<T, HttpError | ApiError | NetworkError | ValidationError>>`. Methods without params omit `ValidationError` from the union.

## Domain Types

Defined in `methods/webhooks/webhooksTypes.ts`:

```typescript
interface Webhook {
    id: string;
    name: string;
    slug: string;
    endpointUrl: string;
    description: string | null;
    enabled: boolean;
    events: string[];
    signingSecret: string;
    createdOn: string | null;
    modifiedOn: string | null;
}

interface WebhookDelivery {
    id: string;
    webhookId: string;
    backgroundTaskId: string | null;
    eventType: string;
    status: string;
    payload: unknown;
    requestHeaders: unknown;
    responseTime: number | null;
    responseStatus: number | null;
    responseBody: string | null;
    expiresAt: string | null;
    createdOn: string | null;
}

interface WebhookEvent {
    app: string;
    entity: string;
    eventName: string;
    label: string;
}
```

## File Layout

```
packages/sdk/src/
├── WebhooksSdk.ts                              # SDK class (10 methods)
├── methods/webhooks/
│   ├── webhooksTypes.ts                        # Webhook, WebhookDelivery, WebhookEvent
│   ├── schemas.ts                              # Zod schemas for all validated methods
│   ├── getWebhook.ts                           # + GetWebhookParams
│   ├── listWebhooks.ts                         # + ListWebhooksParams, ListWebhooksResult
│   ├── createWebhook.ts                        # + CreateWebhookParams
│   ├── updateWebhook.ts                        # + UpdateWebhookParams
│   ├── deleteWebhook.ts                        # + DeleteWebhookParams
│   ├── getWebhookDelivery.ts                   # + GetWebhookDeliveryParams
│   ├── listWebhookDeliveries.ts                # + ListWebhookDeliveriesParams, ListWebhookDeliveriesResult
│   ├── resendWebhookDelivery.ts                # + ResendWebhookDeliveryParams
│   ├── triggerWebhook.ts                       # + TriggerWebhookParams
│   └── listAvailableWebhookEvents.ts           # no params
└── index.ts                                    # updated exports
```

## Conventions

Follows the existing SDK patterns exactly:

- **SDK class**: holds `config` + `fetchFn`, delegates to standalone method functions.
- **Method functions**: accept `(config, fetchFn, params?)`, return `Promise<Result<T, E>>`.
- **Validation**: methods with params use `createMethod` HOF + Zod schemas from `schemas.ts`.
- **GraphQL namespace**: all operations nest under `webhooks` (e.g., `responseData.webhooks.getWebhook`).
- **List pagination**: list methods return `{ data: T[], meta: { cursor, hasMoreItems, totalCount } }`.
- **Boolean responses**: `deleteWebhook` and `resendWebhookDelivery` return `boolean` (matching `BooleanResponse` in the GraphQL schema).
- **Error handling**: propagate `executeGraphQL` failures, then check for `.error` in the GraphQL response envelope.

## Integration Points

- `WebhooksSdk` is composed into `Webiny.ts` as `public readonly webhooks: WebhooksSdk`.
- All types, params, and the SDK class are re-exported from `index.ts`.

## Zod Schemas

One schema per validated method in `schemas.ts`:

- `getWebhookSchema`: `{ id: z.string().min(1) }`
- `listWebhooksSchema`: `{ where?: { enabled?: boolean }, limit?: number, after?: string }`
- `createWebhookSchema`: `{ name: z.string().min(1), endpointUrl: z.string().url(), events: z.array(z.string()).min(1), slug?: string, description?: string, enabled?: boolean }`
- `updateWebhookSchema`: `{ id: z.string().min(1), name?: string, slug?: string, endpointUrl?: string.url(), description?: string, enabled?: boolean, events?: string[] }`
- `deleteWebhookSchema`: `{ id: z.string().min(1) }`
- `getWebhookDeliverySchema`: `{ id: z.string().min(1) }`
- `listWebhookDeliveriesSchema`: `{ webhookId: z.string().min(1), limit?: number, after?: string }`
- `resendWebhookDeliverySchema`: `{ id: z.string().min(1) }`
- `triggerWebhookSchema`: `{ id: z.string().min(1), payload: z.record(z.string(), z.unknown()) }`

## Out of Scope

- Admin UI gateway/repository/presenter layers (separate task).
- Tests for the SDK methods (follow-up).
