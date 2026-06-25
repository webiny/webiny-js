# Webhook Deliveries Page

**Date:** 2026-05-20
**Branch:** bruno/fix/webhooks-models-list
**Status:** Approved (rev 2 — post code-review fixes)

## Goal

Add a global webhook deliveries page to the admin UI where users can browse all deliveries across all webhooks, filter by app/entity/event/status, and inspect each delivery's full detail inline via an accordion. Delivery detail components must be reusable across accordion, drawer, and dialog contexts.

## Architecture Overview

Three layers of change:

1. **API** — remove the required `webhookId` top-level arg from `listWebhookDeliveries`; expose a `where` GraphQL input that maps directly to the existing `IListWebhookDeliveriesInputWhere` use-case type; add `responseHeaders` to the GraphQL delivery type
2. **SDK** — update method signature and query to match; add `responseHeaders` to the TypeScript type and selection set
3. **Admin UI** — extract reusable `DeliveryDetailContent`, build new deliveries page with presenter and filter bar

### Reusable delivery detail component tree

```
DeliveryDetailContent          ← pure: takes WebhookDelivery, renders all fields
       ↑
  used by:
       ├── DeliveryAccordionRow ← inline expand/collapse wrapper (new page)
       ├── DeliveryDetail       ← existing drawer wrapper (refactored to delegate here)
       └── DeliveryDialog       ← future modal wrapper (not built now)
```

The resend button and close button stay in each wrapper — not in `DeliveryDetailContent`.

## API Changes

### `listWebhookDeliveries` — GraphQL schema

Replace the current signature:

```graphql
# before
listWebhookDeliveries(webhookId: ID!, limit: Int, after: String): WebhookDeliveryListResponse!
```

with:

```graphql
# after
listWebhookDeliveries(
    where: WebhookDeliveryListWhereInput
    limit: Int
    after: String
): WebhookDeliveryListResponse!

input WebhookDeliveryListWhereInput {
    webhookId_eq: ID
    eventType_in: [String!]
    status_in: [String!]
}
```

These three operators map directly to the existing `IListWebhookDeliveriesInputWhere` type (which already extends `IdInterfaceGenerator<"webhookId">`, `TextInterfaceGenerator<"eventType">`, and `TextInterfaceGenerator<WebhookDeliveryStatus>`). The resolver passes `args.where` straight to the use case — no translation layer needed.

The existing drawer calls `listWebhookDeliveries(webhookId: ...)` — update its gateway to pass `where: { webhookId_eq: id }` instead.

### `WebhookDelivery` GraphQL type

Add the missing field:

```graphql
type WebhookDelivery {
    # ... existing fields ...
    responseHeaders: JSON    # was missing; stored compressed, decompressed by transformer
}
```

### SDK `listWebhookDeliveries`

Three changes:

1. `ListWebhookDeliveriesParams`: replace `webhookId: string` with `where?: { webhookId_eq?: string; eventType_in?: string[]; status_in?: string[] }`
2. `WebhookDelivery` type: add `responseHeaders: unknown | null`
3. GraphQL selection set: add `responseHeaders`; same change needed in `getWebhookDelivery` if it shares the type

## Admin UI

### New reusable component: `DeliveryDetailContent`

Location: `packages/webhooks/src/admin/presentation/WebhookDeliveries/components/DeliveryDetailContent.tsx`

Props: `delivery: WebhookDelivery`

Renders a summary row (always visible) plus these independently collapsible sections:

| Section | Content | Default state |
|---|---|---|
| Summary | HTTP status code, status badge, response time (ms), created date | always visible |
| Payload | JSON block | expanded |
| Request headers | JSON block | collapsed |
| Response headers | JSON block | collapsed |
| Response body | text block | collapsed |

Uses `Accordion` from `@webiny/admin-ui` for the collapsible sections internally.

### Refactor: `DeliveryDetail.tsx`

Replace its inline field rendering with `<DeliveryDetailContent delivery={delivery} />`. The close `IconButton` and resend `Button` stay in this wrapper unchanged.

### New component: `DeliveryAccordionRow`

Location: `packages/webhooks/src/admin/presentation/WebhookDeliveries/components/DeliveryAccordionRow.tsx`

A thin wrapper around `Accordion.Item` from `@webiny/admin-ui`:

- `title`: event type string
- `subtitle`: status `Tag` + HTTP code + response time
- `actions`: resend `Accordion.Item.Action` (icon button)
- `children`: `<DeliveryDetailContent delivery={delivery} />`
- `open` / `onOpenChange`: controlled externally by the presenter

`Accordion` does not have a built-in "single open" mode — the presenter enforces it by tracking `expandedDeliveryId` and passing `open={expandedDeliveryId === delivery.id}` to each row. Clicking an already-open row passes `false` to `onOpenChange`, collapsing it.

The existing `WebhookDeliveriesDrawer` continues to use `DataTable` — `DeliveryAccordionRow` is only used on the new deliveries page.

### New page: `WebhookDeliveriesPage`

Location: `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/`

Files:

```
WebhookDeliveriesPagePresenter.ts   ← filter state, available events, accordion, pagination
feature.ts                          ← DI wiring
components/
  WebhookDeliveriesPage.tsx         ← page root
  DeliveryFilters.tsx               ← filter bar
```

**Route:** `/webhooks/deliveries`

Added to `packages/webhooks/src/admin/routes.ts` as `Routes.Deliveries`, and registered in `WebhookRoutes.tsx` **before** `Routes.Form` to prevent the `/webhooks/:id` pattern from capturing it. The existing `/webhooks/settings` route already uses this ordering — follow the same pattern.

**Filter bar (`DeliveryFilters.tsx`):**

| Filter | Type | Data source |
|---|---|---|
| App | single-select dropdown | distinct `app` values from `listAvailableWebhookEvents` |
| Entity | single-select dropdown | `entity` values for selected app; cleared when app changes |
| Event | single-select dropdown | `eventName` values for selected app+entity; cleared when entity changes |
| Status | multi-select | hardcoded: `pending`, `delivering`, `delivered`, `failed` |

**Partial filter semantics:**

The presenter translates filter selections into the `eventType_in` array by matching against the loaded `availableEvents` list:

- App selected, no entity/event → include all `eventName` values where `event.app === selectedApp`
- App + entity, no event → include all `eventName` values where `app` and `entity` both match
- App + entity + event → include the single matching `eventName`
- No app selected → omit `eventType_in` entirely (backend returns all deliveries)
- Status selected → pass `status_in: [...]`; omit when empty

**On filter change:** reset cursor to `null` (fresh first page), collapse any open accordion item (`expandedDeliveryId = null`), replace the delivery list with the new results.

**Pagination:** "Load more" button below the accordion. Uses `WebhookDeliveriesDataSource` cursor-based pagination. The button is hidden when `hasMoreItems` is `false`.

**Delivery list:** An `Accordion` (from `@webiny/admin-ui`) where each item is a `DeliveryAccordionRow`.

**Loading / empty / error states:**

- Initial load: show a spinner in place of the accordion
- Empty result (no deliveries or no matches for current filter): show an empty-state message ("No deliveries found")
- API error: show an inline error message with a retry button
- "Load more" in-flight: disable the button and show a spinner on it
- Resend in-flight: disable the resend button on the affected row

### Presenter: `WebhookDeliveriesPagePresenter`

State managed (MobX observable):

- `availableEvents: WebhookEvent[]` — loaded once on `init()`
- `filters: { app: string | null; entity: string | null; eventName: string | null; status: string[] }` — current selections
- `expandedDeliveryId: string | null` — which accordion row is open
- delegates list/pagination to `ListPresenter` (existing abstraction) with the translated `where` input

Actions:

- `init()` — loads available events and first page of deliveries in parallel
- `setAppFilter(app)` — sets app, clears entity, event; triggers fresh fetch
- `setEntityFilter(entity)` — sets entity, clears event; triggers fresh fetch
- `setEventFilter(eventName)` — triggers fresh fetch
- `setStatusFilter(status[])` — triggers fresh fetch
- `expandDelivery(id)` — toggles accordion row (set to `null` if already open)
- `loadMore()` — appends next page
- `resend(id)` — calls resend use case, then refreshes the current page (same `where` + `after: null`)

### Feature wiring

`WebhookDeliveriesPageFeature` registers:

- `ListWebhookDeliveriesFeature`
- `ListAvailableEventsFeature` ← admin-side name; file: `packages/webhooks/src/admin/features/listAvailableEvents/feature.ts`
- `ResendWebhookDeliveryFeature`
- `WebhookDeliveriesPagePresenterFeature`

## Data Flow

```
mount → init()
  → listAvailableWebhookEvents()     → populate filter dropdowns
  → listWebhookDeliveries(where: {}) → populate accordion (all deliveries)

filter change → setXxxFilter()
  → translate filters → eventType_in[], status_in[]
  → reset cursor, collapse expanded row
  → listWebhookDeliveries(where: { eventType_in, status_in })
  → replace accordion items

row click → expandDelivery(id)
  → set expandedDeliveryId (or null if same row)
  → Accordion.Item open/close via controlled props

load more → loadMore()
  → listWebhookDeliveries(where: ..., after: cursor)
  → append items to accordion

resend(id) → resend use case
  → refresh: listWebhookDeliveries(where: ..., after: null)
  → replace accordion items (preserves expanded row)

drawer (existing, unchanged behaviour) → WebhookDeliveriesDrawer
  → gateway updated: listWebhookDeliveries(where: { webhookId_eq: id })
```

## What is NOT in scope

- `DeliveryDialog` wrapper (future — `DeliveryDetailContent` is ready for it)
- Bulk resend
- Export / download
- Search by payload content
- Delivery analytics / metrics
- The existing per-webhook drawer (stays as-is; only the gateway call changes)
