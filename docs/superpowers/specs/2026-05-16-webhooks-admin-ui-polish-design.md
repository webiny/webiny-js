# Webhooks Admin UI Polish — Design Spec

**Date:** 2026-05-16
**Branch:** `bruno/feat/webhooks`
**Scope:** Wire the three skeleton view components to their fully-functional presenters.

## Context

Phase 4 of the webhooks feature scaffolded the admin UI with complete headless layers (9 features, 3 presenters, 3 data sources) but left the view components as structural placeholders. This spec covers wiring real UI into those skeletons.

**Reference pattern:** File Manager (`packages/app-file-manager`).

## 1. WebhookListView

**File:** `packages/webhooks/src/admin/presentation/WebhookList/components/WebhookListView.tsx`

### DataTable

Uses `DataTable` from `@webiny/admin-ui` (not ACO Table).

**Columns:**

| Key | Header | Cell | Sortable | Size |
|-----|--------|------|----------|------|
| `name` | Name | Plain text, clickable — navigates to `/webhooks/:id` | Yes | 200 |
| `endpointUrl` | Endpoint | Truncated text, monospace style | No | 250 |
| `enabled` | Status | Badge — green "Active" / gray "Disabled" | Yes | 100 |
| `createdOn` | Created | `TimeAgo` component | Yes | 120 |
| `actions` | (empty) | Dropdown menu | No | 56 |

### Row Actions

Dropdown menu per row with:

- **Edit** — navigates to `/webhooks/:id`.
- **Trigger Test** — calls `actions.triggerWebhook(id)`. Guarded by `vm.permissions.canEdit`.
- **Delete** — confirmation dialog, then `actions.deleteWebhook(id)`. Guarded by `vm.permissions.canDelete`.

### Sorting

`DataTable.onSortingChange` maps to `presenter.actions.sort.set(field, direction)`. Initial sort: `createdOn DESC` (set by presenter).

### Empty State

When `vm.list.rows` is empty and not loading: centered "No webhooks found" message with a "Create Webhook" CTA button (guarded by `canCreate`).

## 2. WebhookFormPresenter + FormView

### Presenter Changes

**File:** `packages/webhooks/src/admin/presentation/WebhookForm/WebhookFormPresenter.ts`

Add a private `_form: IFormModel` field, built in `init()` after events load. Add `_selectedEvents: Set<string>` for event checkbox state.

### FormModel Fields

| Field | Builder | Validation | Notes |
|-------|---------|-----------|-------|
| `name` | `fields.text()` | `.required("Name is required")` | Label "Name" |
| `slug` | `fields.text()` | `.required("Slug is required")` | Label "Slug". Disabled when editing (not new). |
| `endpointUrl` | `fields.text()` | `.required("Endpoint URL is required")` | Label "Endpoint URL", placeholder `https://` |
| `description` | `fields.text()` | — | Label "Description", `.renderer("textarea")` |
| `enabled` | `fields.boolean()` | — | Label "Enabled", `.defaultValue(false)` |

### Layout

```
layout.row("name", "slug")
layout.row("endpointUrl")
layout.row("description")
layout.row("enabled")
```

### Events (Custom Component, Not FormModel)

Rendered below the `FormView` as a grouped checkbox component. Events are grouped by `WebhookEvent.app` (e.g., "CMS", "Website Builder"). Each group is a collapsible section with checkboxes for individual events showing `event.label`.

The presenter holds `_selectedEvents: Set<string>` (observable). The view reads the set and calls `actions.toggleEvent(eventName)`.

Reason for not using FormModel: the `WebhookEvent` shape (app, entity, eventName, label) requires grouping logic that doesn't fit FormModel's flat options model.

### Signing Secret (Custom Component, Not FormModel)

Shown only for existing webhooks (`!vm.isNew`). Read-only field with:
- Hidden by default (masked dots).
- Click to reveal the plain text value from `vm.webhook.signingSecret`.
- Copy-to-clipboard button.

### ViewModel Additions

```ts
interface IWebhookFormViewModel {
    loading: boolean;
    saving: boolean;
    isNew: boolean;
    webhook: Webhook | null;
    showDeliveries: boolean;
    availableEvents: WebhookEvent[];
    permissions: { canEdit: boolean; canDelete: boolean };
    form: IFormVM;              // added
    selectedEvents: string[];   // added
}
```

### Actions Additions

```ts
interface IWebhookFormActions {
    save(): Promise<void>;
    deleteWebhook(): Promise<void>;
    openDeliveries(): void;
    closeDeliveries(): void;
    toggleEvent(eventName: string): void;  // added
}
```

### Save Flow

1. Call `this._form.submit()` — returns data or `false` on validation failure.
2. Merge form data with `events` array from `_selectedEvents`.
3. **New webhook:** `createWebhookUseCase.execute(merged)` → navigate to `/webhooks/:newId`.
4. **Existing webhook:** `updateWebhookUseCase.execute(id, merged)` → stay on form, refresh webhook state.

### Data Population (Existing Webhooks)

After loading the webhook in `init()`:
- Call `this._form.setData({ name, slug, endpointUrl, description, enabled })`.
- Populate `_selectedEvents` from `webhook.events`.
- Disable slug field: `this._form.field("slug").setDisabled(true)`.

## 3. WebhookDeliveriesDrawer

**File:** `packages/webhooks/src/admin/presentation/WebhookDeliveries/components/WebhookDeliveriesDrawer.tsx`

### Drawer Props

`modal={true}`, `width="900px"`. No presenter changes needed — `WebhookDeliveriesPresenter` already has `selectedDelivery` and `resend` wired.

### Two-Panel Layout

- **Left panel (flex ~1.5):** Delivery list table.
- **Right panel (flex ~1):** Selected delivery detail. Shown only when `vm.selectedDelivery` is set.

When no delivery is selected, the left panel takes full width.

### Delivery List (Left Panel)

Simple `DataTable`:

| Key | Header | Cell | Sortable | Size |
|-----|--------|------|----------|------|
| `eventType` | Event | Plain text | No | 180 |
| `status` | Status | Badge: green "delivered", yellow "pending"/"delivering", red "failed" | No | 100 |
| `responseStatus` | HTTP | Plain text ("200", "500", "—" for null) | No | 60 |
| `createdOn` | Created | `TimeAgo` | Yes | 120 |
| `actions` | (empty) | Resend icon button | No | 48 |

**Row click:** calls `actions.selectDelivery(delivery)`.

### Delivery Detail (Right Panel)

Scrollable panel shown when `vm.selectedDelivery` is not null:

- **Header:** Event type + status badge + close button (`selectDelivery(null)`).
- **Response time:** e.g., "245ms" or "—".
- **Payload:** Pretty-printed JSON in `<pre>` (read-only).
- **Request headers:** Pretty-printed JSON in `<pre>` (read-only).
- **Response body:** Plain text in `<pre>` (read-only).
- **Resend button** at the bottom — calls `actions.resend(delivery.id)`.

## Files Modified

| File | Change |
|------|--------|
| `presentation/WebhookList/components/WebhookListView.tsx` | Wire DataTable, columns, row actions, empty state |
| `presentation/WebhookForm/abstractions.ts` | Add `form`, `selectedEvents`, `toggleEvent` to interfaces |
| `presentation/WebhookForm/WebhookFormPresenter.ts` | Build FormModel, wire save, manage events state |
| `presentation/WebhookForm/components/WebhookFormView.tsx` | Render FormView, events checkboxes, signing secret |
| `presentation/WebhookDeliveries/components/WebhookDeliveriesDrawer.tsx` | Wire two-panel layout, delivery table, detail panel |

## New Files

| File | Purpose |
|------|---------|
| `presentation/WebhookForm/components/EventsSelector.tsx` | Grouped checkbox component for event selection |
| `presentation/WebhookForm/components/SigningSecret.tsx` | Reveal toggle + copy button for signing secret |
| `presentation/WebhookDeliveries/components/DeliveryDetail.tsx` | Right panel with payload/headers/response display |

## Out of Scope

- Configurable/extensible column system (no `WebhookViewConfig`).
- Bulk actions or multi-select in the list view.
- Pagination controls (ListPresenter handles infinite scroll / load-more).
- Search bar in the list view (can be added later).
