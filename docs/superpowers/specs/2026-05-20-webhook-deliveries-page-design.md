# Webhook Deliveries Page

**Date:** 2026-05-20
**Branch:** bruno/fix/webhooks-models-list
**Status:** Approved

## Goal

Add a global webhook deliveries page to the admin UI where users can browse all deliveries across all webhooks, filter by app/entity/event/status, and inspect each delivery's full detail inline via an accordion. Delivery detail components must be reusable across accordion, drawer, and dialog contexts.

## Architecture Overview

Three layers of change:

1. **API** — make `webhookId` optional on `listWebhookDeliveries` and add a `where` filter input
2. **SDK** — update method signature to match, add `responseHeaders` to fetched fields
3. **Admin UI** — extract reusable `DeliveryDetailContent`, build new page with presenter

### Reusable delivery detail component tree

```
DeliveryDetailContent          ← pure: takes WebhookDelivery, renders all fields
       ↑
  used by:
       ├── DeliveryAccordionRow ← inline expand/collapse wrapper
       ├── DeliveryDetail       ← existing drawer wrapper (refactored to delegate here)
       └── DeliveryDialog       ← future modal wrapper (not built now)
```

The resend button and close button stay in each wrapper — not in `DeliveryDetailContent`.

## API Changes

### `listWebhookDeliveries` query

Make `webhookId` optional and add a `where` input:

```graphql
listWebhookDeliveries(
    webhookId: ID              # was ID!, now optional
    where: WebhookDeliveryWhereInput
    limit: Int
    after: String
): WebhookDeliveryListResponse!

input WebhookDeliveryWhereInput {
    eventTypes: [String!]      # list of eventName strings (e.g. "cms.entry.article.created")
    status: [String!]          # "pending" | "delivering" | "delivered" | "failed"
}
```

No new CMS model fields. The existing `eventType` field on deliveries already stores the `eventName` string (e.g. `cms.entry.article.created`). Filtering maps `eventTypes` to a CMS `eventType_in` query, and `status` to `status_in`.

### SDK `listWebhookDeliveries`

- Make `webhookId` optional in `ListWebhookDeliveriesParams`
- Add `where?: { eventTypes?: string[]; status?: string[] }` param
- Add `responseHeaders` to the GraphQL selection set (currently missing)

## Admin UI

### New reusable component: `DeliveryDetailContent`

Location: `packages/webhooks/src/admin/presentation/WebhookDeliveries/components/DeliveryDetailContent.tsx`

Props: `delivery: WebhookDelivery`

Renders these collapsible sections (each independently expandable):

| Section | Content | Default state |
|---|---|---|
| Summary | response time, HTTP status, status badge, created date | always visible |
| Payload | JSON block | expanded |
| Request headers | JSON block | collapsed |
| Response headers | JSON block | collapsed |
| Response body | text block | collapsed |

### Refactor: `DeliveryDetail.tsx`

Replace its inline field rendering with `<DeliveryDetailContent delivery={delivery} />`. The close button and resend button stay in this wrapper.

### New component: `DeliveryAccordionRow`

Location: `packages/webhooks/src/admin/presentation/WebhookDeliveries/components/DeliveryAccordionRow.tsx`

A thin wrapper around `Accordion.Item` (from `@webiny/admin-ui`) that maps a `WebhookDelivery` to the accordion's props:

- `title`: event type string
- `subtitle`: status badge + HTTP code + response time + created date
- `actions`: resend `IconButton`
- `children`: `<DeliveryDetailContent delivery={delivery} />`

The `open`/`onOpenChange` props are controlled externally by the presenter (one open at a time).

The existing `WebhookDeliveriesDrawer` continues to use `DataTable` — `DeliveryAccordionRow` is only used on the new deliveries page.

### New page: `WebhookDeliveriesPage`

Location: `packages/webhooks/src/admin/presentation/WebhookDeliveriesPage/`

Files:
- `WebhookDeliveriesPagePresenter.ts` — manages filter state, available events, data source, accordion state
- `feature.ts` — DI wiring
- `components/WebhookDeliveriesPage.tsx` — page root
- `components/DeliveryFilters.tsx` — filter bar component

**Route:** `/webhooks/deliveries` — added to existing webhooks admin routes.

**Filter bar:**

| Filter | Type | Data source |
|---|---|---|
| App | single-select dropdown | `listAvailableWebhookEvents` (distinct apps) |
| Entity | single-select dropdown | cascades from selected app |
| Event | single-select dropdown | cascades from selected app + entity |
| Status | multi-select | hardcoded: pending, delivering, delivered, failed |

Selecting app clears entity and event. Selecting entity clears event. Each change triggers a fresh delivery list fetch.

The presenter translates the selected app/entity/event into a list of matching `eventName` strings from the loaded available events, then passes them as `where.eventTypes` to the data source.

**Delivery list:** An `Accordion` (from `@webiny/admin-ui`) where each item is a `DeliveryAccordionRow`. The `DataTable` component is not used here — the Accordion natively supports inline expand/collapse.

**Pagination:** "Load more" button below the accordion using existing cursor-based pagination (`WebhookDeliveriesDataSource`).

**Accordion behaviour:** clicking an item expands it inline; clicking again or clicking another item collapses the current one. Controlled via `expandedDeliveryId` in the presenter.

### Presenter: `WebhookDeliveriesPagePresenter`

State managed:
- `availableEvents: WebhookEvent[]` — loaded once on mount
- `filters: { app, entity, eventName, status[] }` — current filter selection
- `expandedDeliveryId: string | null` — which row is open
- delegates list/pagination state to the existing `ListPresenter` abstraction

Actions:
- `init()` — loads available events, loads first page of deliveries
- `setAppFilter(app)`, `setEntityFilter(entity)`, `setEventFilter(eventName)`, `setStatusFilter(status[])`
- `expandDelivery(id)` — toggle accordion row
- `loadMore()` — cursor-based next page
- `resend(id)`

### Feature wiring

`WebhookDeliveriesPageFeature` registers:
- `ListWebhookDeliveriesFeature`
- `ListAvailableWebhookEventsFeature`
- `ResendWebhookDeliveryFeature`
- `WebhookDeliveriesPagePresenterFeature`

## Data Flow

```
mount → init()
  → listAvailableWebhookEvents()    → populate filter dropdowns
  → listWebhookDeliveries(no filter) → populate table

filter change → setXxxFilter()
  → translate filters to eventTypes[]
  → listWebhookDeliveries(where: { eventTypes, status })
  → replace table rows

row click → expandDelivery(id)
  → render DeliveryAccordionRow inline

load more → loadMore()
  → listWebhookDeliveries(after: cursor)
  → append to table rows
```

## What is NOT in scope

- `DeliveryDialog` wrapper (future — `DeliveryDetailContent` is ready for it)
- Bulk resend
- Export / download
- Search by payload content
- Delivery analytics / metrics
- Per-webhook deliveries page (the existing drawer covers this)
