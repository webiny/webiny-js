# Webhook Delivery Retention Setting

## Overview

Add a user-configurable `deliveryRetentionDays` field to the webhook settings model. This replaces the hardcoded `WEBHOOK_DELIVERY_RETENTION_DAYS = 90` constant and allows users to control how long delivery records are retained before DynamoDB TTL removes them.

- **Min:** 0 (delete immediately)
- **Max:** `WEBHOOK_DELIVERY_MAX_RETENTION_DAYS` (currently 3650 — 10 years)
- **Default (unset):** `WEBHOOK_DELIVERY_MAX_RETENTION_DAYS`
- **DynamoDB TTL wiring:** handled by the CMS storage layer, out of scope here

---

## Constants (`packages/webhooks/src/api/domain/constants.ts`)

Add:
```ts
export const WEBHOOK_DELIVERY_MAX_RETENTION_DAYS = 3650;
```

Remove `WEBHOOK_DELIVERY_RETENTION_DAYS = 90`.

---

## API Layer

### CMS Model (`WebhookSettingsModel.ts`)

Add a `number` field `deliveryRetentionDays`:
- Not required, not encrypted
- Validation: min 0, max `WEBHOOK_DELIVERY_MAX_RETENTION_DAYS`

### Domain type (`WebhookSettings.ts`)

```ts
export interface IWebhookSettings {
    signingSecret: string | undefined;
    deliveryRetentionDays: number | undefined;
}
```

### GraphQL schema (`WebhookSettingsSchema.ts`)

Add to `WebhookSettings` type:
```graphql
deliveryRetentionDays: Int
```

Add to `UpdateWebhookSettingsInput`:
```graphql
deliveryRetentionDays: Int
```

### Zod validation (`UpdateWebhookSettingsUseCase`)

Add to input schema:
```ts
deliveryRetentionDays: z.number().int().min(0).max(WEBHOOK_DELIVERY_MAX_RETENTION_DAYS).optional()
```

### Use cases — `expiresAt` computation

`WebhookDispatcher`, `ResendWebhookDeliveryUseCase`, and `TriggerWebhookUseCase` each:

1. Inject `GetWebhookSettingsRepository` as a new dependency
2. Call `getWebhookSettingsRepository.execute()` before creating the delivery
3. Compute:
   ```ts
   const retentionDays = settings.deliveryRetentionDays ?? WEBHOOK_DELIVERY_MAX_RETENTION_DAYS;
   const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();
   ```

---

## Admin Layer

### Shared type (`packages/webhooks/src/admin/shared/types.ts`)

```ts
export interface WebhookSettings {
    signingSecret: string | undefined;
    deliveryRetentionDays: number | undefined;
}
```

### Gateways

- `GetWebhookSettingsGateway` — add `deliveryRetentionDays` to the GraphQL query fields
- `UpdateWebhookSettingsGateway` — add `deliveryRetentionDays` to the mutation input and response fields

### Presenter (`WebhookSettingsPresenter.ts`)

Add a number field to the `FormModel`:
- Label: `Delivery Retention (days)`
- Description: `How long to keep delivery logs. Set to 0 to delete immediately. Maximum ${WEBHOOK_DELIVERY_MAX_RETENTION_DAYS} days.`
- Placeholder: `${WEBHOOK_DELIVERY_MAX_RETENTION_DAYS}`
- Validation: min 0, max `WEBHOOK_DELIVERY_MAX_RETENTION_DAYS`

---

## Out of Scope

- DynamoDB TTL attribute wiring (handled by CMS storage layer)
- Migration of existing delivery records
