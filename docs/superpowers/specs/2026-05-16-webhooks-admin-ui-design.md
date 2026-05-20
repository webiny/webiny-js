# Webhooks Admin UI — Design Spec

## Overview

Admin UI for managing webhooks within the Webiny admin panel. Lives in `packages/webhooks/src/admin/` alongside the existing API layer. Follows the 3-layer architecture pattern (Gateway → UseCase → Presenter) using `WebinySdk` for API communication, shared `ListPresenter` for list views, and `FormModel` for the create/edit form.

## Directory Structure

```
packages/webhooks/src/admin/
├── Extension.tsx
├── routes.ts
├── features/
│   ├── listWebhooks/
│   │   ├── abstractions.ts
│   │   ├── ListWebhooksGateway.ts
│   │   ├── ListWebhooksUseCase.ts
│   │   ├── feature.ts
│   │   └── index.ts
│   ├── getWebhook/
│   │   ├── abstractions.ts
│   │   ├── GetWebhookGateway.ts
│   │   ├── GetWebhookUseCase.ts
│   │   ├── feature.ts
│   │   └── index.ts
│   ├── createWebhook/
│   │   ├── abstractions.ts
│   │   ├── CreateWebhookGateway.ts
│   │   ├── CreateWebhookUseCase.ts
│   │   ├── feature.ts
│   │   └── index.ts
│   ├── updateWebhook/
│   │   ├── abstractions.ts
│   │   ├── UpdateWebhookGateway.ts
│   │   ├── UpdateWebhookUseCase.ts
│   │   ├── feature.ts
│   │   └── index.ts
│   ├── deleteWebhook/
│   │   ├── abstractions.ts
│   │   ├── DeleteWebhookGateway.ts
│   │   ├── DeleteWebhookUseCase.ts
│   │   ├── feature.ts
│   │   └── index.ts
│   ├── listWebhookDeliveries/
│   │   ├── abstractions.ts
│   │   ├── ListWebhookDeliveriesGateway.ts
│   │   ├── ListWebhookDeliveriesUseCase.ts
│   │   ├── feature.ts
│   │   └── index.ts
│   ├── triggerWebhook/
│   │   ├── abstractions.ts
│   │   ├── TriggerWebhookGateway.ts
│   │   ├── TriggerWebhookUseCase.ts
│   │   ├── feature.ts
│   │   └── index.ts
│   ├── resendWebhookDelivery/
│   │   ├── abstractions.ts
│   │   ├── ResendWebhookDeliveryGateway.ts
│   │   ├── ResendWebhookDeliveryUseCase.ts
│   │   ├── feature.ts
│   │   └── index.ts
│   ├── listAvailableEvents/
│   │   ├── abstractions.ts
│   │   ├── ListAvailableEventsGateway.ts
│   │   ├── ListAvailableEventsUseCase.ts
│   │   ├── feature.ts
│   │   └── index.ts
│   └── permissions/
│       ├── abstractions.ts
│       ├── feature.ts
│       └── index.ts
├── presentation/
│   ├── WebhookList/
│   │   ├── abstractions.ts
│   │   ├── WebhookListPresenter.ts
│   │   ├── WebhookListDataSource.ts
│   │   ├── feature.ts
│   │   ├── index.ts
│   │   └── components/
│   │       └── WebhookListView.tsx
│   ├── WebhookForm/
│   │   ├── abstractions.ts
│   │   ├── WebhookFormPresenter.ts
│   │   ├── feature.ts
│   │   ├── index.ts
│   │   └── components/
│   │       └── WebhookFormView.tsx
│   ├── WebhookDeliveries/
│   │   ├── abstractions.ts
│   │   ├── WebhookDeliveriesPresenter.ts
│   │   ├── WebhookDeliveriesDataSource.ts
│   │   ├── feature.ts
│   │   ├── index.ts
│   │   └── components/
│   │       └── WebhookDeliveriesDrawer.tsx
│   └── security/
│       ├── usePermissions.ts
│       └── HasPermission.tsx
└── shared/
    └── types.ts
```

## Shared Domain

The permissions schema at `packages/webhooks/src/domain/permissionsSchema.ts` is shared between API and admin. The admin permissions feature imports it directly:

```ts
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
```

Schema definition (already exists):

```ts
createPermissionSchema({
    prefix: "webhooks",
    fullAccess: true,
    entities: [
        {
            id: "webhook",
            permission: "webhooks.webhook",
            scopes: ["full"],
            actions: [{ name: "rwd" }]
        }
    ]
});
```

## Shared Types

`admin/shared/types.ts` re-exports the webhook domain types needed by the admin layer:

```ts
export interface WebhookDto {
    id: string;
    name: string;
    slug: string;
    endpointUrl: string;
    description?: string;
    enabled: boolean;
    events: string[];
    signingSecret: string;
    createdOn?: string;
    modifiedOn?: string;
}

export interface WebhookDeliveryDto {
    id: string;
    webhookId: string;
    backgroundTaskId: string | null;
    eventType: string;
    status: "pending" | "delivering" | "delivered" | "failed";
    payload: Record<string, unknown>;
    requestHeaders: Record<string, unknown> | null;
    responseTime: number | null;
    responseStatus: number | null;
    responseBody: string | null;
    expiresAt?: string;
    createdOn?: string;
}

export interface WebhookEventDto {
    app: string;
    entity: string;
    eventName: string;
    label: string;
}
```

These DTOs map directly to the SDK response types. If the SDK already exports usable types, re-export those instead of duplicating.

## Routes

```ts
// admin/routes.ts
import { Route } from "@webiny/app-admin";

export const Routes = {
    List: new Route({
        name: "Webhooks/List",
        path: "/webhooks"
    }),
    Form: new Route({
        name: "Webhooks/Form",
        path: "/webhooks/:id",
        params: zod => ({
            id: zod.string()
        })
    })
};
```

Two routes:
- `/webhooks` — list view.
- `/webhooks/:id` — create (`id = "new"`) or edit (existing ID) form. The deliveries drawer is opened from this view.

## Features Layer

All features follow the same pattern: `abstractions.ts` defines the interfaces, implementation files provide the classes, `feature.ts` wires DI. UseCases call Gateways directly (no Repository layer — the list cache is handled by `IDataSource` in the presentation layer).

### listWebhooks

```ts
// abstractions.ts
export interface IListWebhooksGateway {
    execute(params: ListWebhooksGatewayParams): Promise<ListWebhooksGatewayResult>;
}

export interface ListWebhooksGatewayParams {
    where?: { enabled?: boolean };
    limit?: number;
    after?: string;
}

export interface ListWebhooksGatewayResult {
    data: WebhookDto[];
    meta: { cursor: string | null; hasMoreItems: boolean; totalCount: number };
}

export const ListWebhooksGateway = createAbstraction<IListWebhooksGateway>("ListWebhooksGateway");
export namespace ListWebhooksGateway { export type Interface = IListWebhooksGateway; }

export interface IListWebhooksUseCase {
    execute(params: ListWebhooksGatewayParams): Promise<ListWebhooksGatewayResult>;
}

export const ListWebhooksUseCase = createAbstraction<IListWebhooksUseCase>("ListWebhooksUseCase");
export namespace ListWebhooksUseCase { export type Interface = IListWebhooksUseCase; }
```

```ts
// ListWebhooksGateway.ts
class ListWebhooksGatewayImpl implements ListWebhooksGateway.Interface {
    constructor(private sdk: WebinySdk.Interface) {}

    async execute(params: ListWebhooksGatewayParams): Promise<ListWebhooksGatewayResult> {
        const result = await this.sdk.webhooks.listWebhooks({
            where: params.where,
            limit: params.limit,
            after: params.after
        });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return { data: result.value.data, meta: result.value.meta };
    }
}

export const ListWebhooksGateway = GatewayAbstraction.createImplementation({
    implementation: ListWebhooksGatewayImpl,
    dependencies: [WebinySdk]
});
```

```ts
// ListWebhooksUseCase.ts
class ListWebhooksUseCaseImpl implements ListWebhooksUseCase.Interface {
    constructor(private gateway: ListWebhooksGateway.Interface) {}

    async execute(params: ListWebhooksGatewayParams): Promise<ListWebhooksGatewayResult> {
        return this.gateway.execute(params);
    }
}

export const ListWebhooksUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWebhooksUseCaseImpl,
    dependencies: [ListWebhooksGateway]
});
```

```ts
// feature.ts
export const ListWebhooksFeature = createFeature({
    name: "Webhooks/ListWebhooks",
    register(container) {
        container.register(ListWebhooksUseCase);
        container.register(ListWebhooksGateway).inSingletonScope();
    },
    resolve(container) {
        return { useCase: container.resolve(UseCaseAbstraction) };
    }
});
```

### getWebhook

```ts
// abstractions.ts
export interface IGetWebhookGateway {
    execute(id: string): Promise<WebhookDto>;
}

export const GetWebhookGateway = createAbstraction<IGetWebhookGateway>("GetWebhookGateway");
export namespace GetWebhookGateway { export type Interface = IGetWebhookGateway; }

export interface IGetWebhookUseCase {
    execute(id: string): Promise<WebhookDto>;
}

export const GetWebhookUseCase = createAbstraction<IGetWebhookUseCase>("GetWebhookUseCase");
export namespace GetWebhookUseCase { export type Interface = IGetWebhookUseCase; }
```

Gateway calls `sdk.webhooks.getWebhook(id)`. UseCase delegates to gateway.

### createWebhook

```ts
// abstractions.ts
export interface CreateWebhookInput {
    name: string;
    slug?: string;
    endpointUrl: string;
    description?: string;
    enabled?: boolean;
    events: string[];
}

export interface ICreateWebhookGateway {
    execute(input: CreateWebhookInput): Promise<WebhookDto>;
}

export const CreateWebhookGateway = createAbstraction<ICreateWebhookGateway>("CreateWebhookGateway");
export namespace CreateWebhookGateway { export type Interface = ICreateWebhookGateway; }

export interface ICreateWebhookUseCase {
    execute(input: CreateWebhookInput): Promise<WebhookDto>;
}

export const CreateWebhookUseCase = createAbstraction<ICreateWebhookUseCase>("CreateWebhookUseCase");
export namespace CreateWebhookUseCase { export type Interface = ICreateWebhookUseCase; }
```

Gateway calls `sdk.webhooks.createWebhook(input)`.

### updateWebhook

```ts
// abstractions.ts
export interface UpdateWebhookInput {
    name?: string;
    slug?: string;
    endpointUrl?: string;
    description?: string;
    enabled?: boolean;
    events?: string[];
    signingSecret?: string;
}

export interface IUpdateWebhookGateway {
    execute(id: string, input: UpdateWebhookInput): Promise<WebhookDto>;
}

export const UpdateWebhookGateway = createAbstraction<IUpdateWebhookGateway>("UpdateWebhookGateway");
export namespace UpdateWebhookGateway { export type Interface = IUpdateWebhookGateway; }

export interface IUpdateWebhookUseCase {
    execute(id: string, input: UpdateWebhookInput): Promise<WebhookDto>;
}

export const UpdateWebhookUseCase = createAbstraction<IUpdateWebhookUseCase>("UpdateWebhookUseCase");
export namespace UpdateWebhookUseCase { export type Interface = IUpdateWebhookUseCase; }
```

Gateway calls `sdk.webhooks.updateWebhook(id, input)`.

### deleteWebhook

```ts
// abstractions.ts
export interface IDeleteWebhookGateway {
    execute(id: string): Promise<boolean>;
}

export const DeleteWebhookGateway = createAbstraction<IDeleteWebhookGateway>("DeleteWebhookGateway");
export namespace DeleteWebhookGateway { export type Interface = IDeleteWebhookGateway; }

export interface IDeleteWebhookUseCase {
    execute(id: string): Promise<boolean>;
}

export const DeleteWebhookUseCase = createAbstraction<IDeleteWebhookUseCase>("DeleteWebhookUseCase");
export namespace DeleteWebhookUseCase { export type Interface = IDeleteWebhookUseCase; }
```

Gateway calls `sdk.webhooks.deleteWebhook(id)`.

### listWebhookDeliveries

```ts
// abstractions.ts
export interface ListWebhookDeliveriesParams {
    webhookId: string;
    limit?: number;
    after?: string;
}

export interface ListWebhookDeliveriesResult {
    data: WebhookDeliveryDto[];
    meta: { cursor: string | null; hasMoreItems: boolean; totalCount: number };
}

export interface IListWebhookDeliveriesGateway {
    execute(params: ListWebhookDeliveriesParams): Promise<ListWebhookDeliveriesResult>;
}

export const ListWebhookDeliveriesGateway =
    createAbstraction<IListWebhookDeliveriesGateway>("ListWebhookDeliveriesGateway");
export namespace ListWebhookDeliveriesGateway { export type Interface = IListWebhookDeliveriesGateway; }

export interface IListWebhookDeliveriesUseCase {
    execute(params: ListWebhookDeliveriesParams): Promise<ListWebhookDeliveriesResult>;
}

export const ListWebhookDeliveriesUseCase =
    createAbstraction<IListWebhookDeliveriesUseCase>("ListWebhookDeliveriesUseCase");
export namespace ListWebhookDeliveriesUseCase { export type Interface = IListWebhookDeliveriesUseCase; }
```

Gateway calls `sdk.webhooks.listWebhookDeliveries({ webhookId, limit, after })`.

### triggerWebhook

```ts
// abstractions.ts
export interface ITriggerWebhookGateway {
    execute(id: string, payload: Record<string, unknown>): Promise<WebhookDeliveryDto>;
}

export const TriggerWebhookGateway =
    createAbstraction<ITriggerWebhookGateway>("TriggerWebhookGateway");
export namespace TriggerWebhookGateway { export type Interface = ITriggerWebhookGateway; }

export interface ITriggerWebhookUseCase {
    execute(id: string, payload: Record<string, unknown>): Promise<WebhookDeliveryDto>;
}

export const TriggerWebhookUseCase =
    createAbstraction<ITriggerWebhookUseCase>("TriggerWebhookUseCase");
export namespace TriggerWebhookUseCase { export type Interface = ITriggerWebhookUseCase; }
```

Gateway calls `sdk.webhooks.triggerWebhook(id, payload)`.

### resendWebhookDelivery

```ts
// abstractions.ts
export interface IResendWebhookDeliveryGateway {
    execute(id: string): Promise<boolean>;
}

export const ResendWebhookDeliveryGateway =
    createAbstraction<IResendWebhookDeliveryGateway>("ResendWebhookDeliveryGateway");
export namespace ResendWebhookDeliveryGateway { export type Interface = IResendWebhookDeliveryGateway; }

export interface IResendWebhookDeliveryUseCase {
    execute(id: string): Promise<boolean>;
}

export const ResendWebhookDeliveryUseCase =
    createAbstraction<IResendWebhookDeliveryUseCase>("ResendWebhookDeliveryUseCase");
export namespace ResendWebhookDeliveryUseCase { export type Interface = IResendWebhookDeliveryUseCase; }
```

Gateway calls `sdk.webhooks.resendWebhookDelivery(id)`.

### listAvailableEvents

```ts
// abstractions.ts
export interface IListAvailableEventsGateway {
    execute(): Promise<WebhookEventDto[]>;
}

export const ListAvailableEventsGateway =
    createAbstraction<IListAvailableEventsGateway>("ListAvailableEventsGateway");
export namespace ListAvailableEventsGateway { export type Interface = IListAvailableEventsGateway; }

export interface IListAvailableEventsUseCase {
    execute(): Promise<WebhookEventDto[]>;
}

export const ListAvailableEventsUseCase =
    createAbstraction<IListAvailableEventsUseCase>("ListAvailableEventsUseCase");
export namespace ListAvailableEventsUseCase { export type Interface = IListAvailableEventsUseCase; }
```

Gateway calls `sdk.webhooks.listAvailableWebhookEvents()`.

### permissions

```ts
// abstractions.ts
import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const WebhookPermissions = createPermissionsAbstraction(WEBHOOK_PERMISSIONS_SCHEMA);

export namespace WebhookPermissions {
    export type Interface = Permissions<typeof WEBHOOK_PERMISSIONS_SCHEMA>;
}
```

```ts
// feature.ts
import { createPermissionsFeature } from "@webiny/app-admin/exports/admin/security.js";
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { WebhookPermissions } from "./abstractions.js";

export const WebhookPermissionsFeature = createPermissionsFeature(
    WEBHOOK_PERMISSIONS_SCHEMA,
    WebhookPermissions
);
```

## Presentation Layer

### WebhookList

The list presenter composes the shared `ListPresenter` from `app-admin` and adds webhook-specific actions (delete, trigger test).

```ts
// abstractions.ts
export interface IWebhookListViewModel {
    list: IListViewModel<WebhookDto>;
    permissions: {
        canRead: boolean;
        canCreate: boolean;
        canEdit: boolean;
        canDelete: boolean;
    };
}

export interface IWebhookListActions extends IListActions {
    deleteWebhook(id: string): Promise<void>;
    triggerWebhook(id: string): Promise<void>;
}

export interface IWebhookListPresenter {
    vm: IWebhookListViewModel;
    actions: IWebhookListActions;
    init(): void;
}

export const WebhookListPresenter =
    createAbstraction<IWebhookListPresenter>("WebhookListPresenter");

export namespace WebhookListPresenter {
    export type Interface = IWebhookListPresenter;
    export type ViewModel = IWebhookListViewModel;
    export type Actions = IWebhookListActions;
}
```

**WebhookListPresenter** (MobX):
- Constructor injects: `ListPresenter`, `WebhookPermissions`, `DeleteWebhookUseCase`, `TriggerWebhookUseCase`.
- `init()` creates a `WebhookListDataSource` and calls `listPresenter.init({ dataSource, initialSort: { field: "createdOn", direction: "DESC" }, limit: 20 })`.
- `vm` exposes the shared `listPresenter.vm` plus permission flags.
- `actions` delegates search/sort/filter/selection/loadMore/refresh to `listPresenter.actions`, adds `deleteWebhook` and `triggerWebhook`.
- After delete/trigger, calls `listPresenter.actions.refresh()`.

**WebhookListDataSource** (`IDataSource<WebhookDto>`):
- Constructor takes `ListWebhooksUseCase`.
- `query()` calls `useCase.execute({ where: params.filters, limit, after: cursor })`.
- `loadMore()` appends results.
- MobX observable `rows`, `meta`, `loading`.

**WebhookListView** component:
- Creates a scoped DI container registering all features + presenter.
- Uses `useFeature(WebhookListPresenterFeature)` to get the presenter.
- Wrapped in `observer()`.
- Renders a `DataTable` with columns: name, endpointUrl, enabled (badge), createdOn.
- Row actions via `DropdownMenu`: Edit (navigates to `/webhooks/:id`), Trigger Test (calls `actions.triggerWebhook`), Delete (confirmation dialog + `actions.deleteWebhook`).
- Header with search input and "Create Webhook" button (navigates to `/webhooks/new`).
- Guarded by `<HasPermission entity="webhook">`.

### WebhookForm

The form presenter uses `FormModel` for field definitions and manages load/save lifecycle.

```ts
// abstractions.ts
export interface IWebhookFormViewModel {
    loading: boolean;
    saving: boolean;
    isNew: boolean;
    webhook: WebhookDto | null;
    form: IFormModel | null;
    availableEvents: WebhookEventDto[];
    permissions: {
        canEdit: boolean;
        canDelete: boolean;
    };
}

export interface IWebhookFormActions {
    save(): Promise<void>;
    deleteWebhook(): Promise<void>;
    openDeliveries(): void;
    closeDeliveries(): void;
}

export interface IWebhookFormPresenter {
    vm: IWebhookFormViewModel;
    actions: IWebhookFormActions;
    init(id: string): void;
}

export const WebhookFormPresenter =
    createAbstraction<IWebhookFormPresenter>("WebhookFormPresenter");

export namespace WebhookFormPresenter {
    export type Interface = IWebhookFormPresenter;
    export type ViewModel = IWebhookFormViewModel;
    export type Actions = IWebhookFormActions;
}
```

**WebhookFormPresenter** (MobX):
- Constructor injects: `FormModelFactory`, `WebhookPermissions`, `GetWebhookUseCase`, `CreateWebhookUseCase`, `UpdateWebhookUseCase`, `DeleteWebhookUseCase`, `ListAvailableEventsUseCase`.
- `init(id)`:
  - If `id === "new"`: sets `isNew = true`, builds empty form, loads available events.
  - Otherwise: loads webhook via `GetWebhookUseCase`, loads available events, builds form pre-populated with webhook data.
- `buildForm()` uses `FormModelFactory`:

```ts
private buildForm(webhook?: WebhookDto): IFormModel {
    return this.formModelFactory.create({
        fields: fields => ({
            name: fields.text().label("Name").required("Name is required"),
            slug: fields.text().label("Slug")
                .computedUntilDirty(form => {
                    const name = String(form.field("name").getValue() ?? "");
                    return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                }),
            endpointUrl: fields.text().label("Endpoint URL")
                .required("Endpoint URL is required")
                .placeholder("https://"),
            description: fields.text().label("Description")
                .renderer("textarea", { rows: 3 }),
            enabled: fields.boolean().label("Enabled").defaultValue(false),
            events: fields.text().list().label("Events")
                .required("At least one event is required")
                .renderer("checkboxes")
                .options(this.buildEventOptions())
        }),
        layout: layout => [
            layout.row("name", "slug"),
            layout.row("endpointUrl"),
            layout.row("description"),
            layout.row("enabled"),
            layout.separator(),
            layout.row("events")
        ]
    });
}
```

- `buildEventOptions()`: maps `availableEvents` to `{ label, value }` options. Events are grouped by `app` (e.g., "CMS", "Website Builder") in the label for clarity: `"CMS — Entry published"`.
- `save()`:
  - Validates via `form.submit()`.
  - If `isNew`: calls `CreateWebhookUseCase.execute(formData)`, then navigates to `/webhooks/:newId`.
  - Otherwise: calls `UpdateWebhookUseCase.execute(id, formData)`.
- `deleteWebhook()`: calls `DeleteWebhookUseCase.execute(id)`, navigates to `/webhooks`.
- `openDeliveries()` / `closeDeliveries()`: toggles a `showDeliveries` flag in the vm (controls the drawer).

**WebhookFormView** component:
- Creates a scoped DI container.
- Uses `useFeature(WebhookFormPresenterFeature)`.
- Reads route param `id` to call `presenter.init(id)`.
- Renders the `FormModel` fields using the standard form renderer.
- Header bar with Save button and actions dropdown (Delete, View Deliveries).
- Signing secret displayed as read-only (with copy button) for existing webhooks.
- When `vm.showDeliveries` is true, renders `<WebhookDeliveriesDrawer webhookId={id} />`.
- Guarded by `<HasPermission entity="webhook">`.

### WebhookDeliveries

Delivery log rendered in a `Drawer` panel, opened from the webhook form view.

```ts
// abstractions.ts
export interface IWebhookDeliveriesViewModel {
    list: IListViewModel<WebhookDeliveryDto>;
    selectedDelivery: WebhookDeliveryDto | null;
}

export interface IWebhookDeliveriesActions extends IListActions {
    resend(id: string): Promise<void>;
    selectDelivery(delivery: WebhookDeliveryDto | null): void;
}

export interface IWebhookDeliveriesPresenter {
    vm: IWebhookDeliveriesViewModel;
    actions: IWebhookDeliveriesActions;
    init(webhookId: string): void;
}

export const WebhookDeliveriesPresenter =
    createAbstraction<IWebhookDeliveriesPresenter>("WebhookDeliveriesPresenter");

export namespace WebhookDeliveriesPresenter {
    export type Interface = IWebhookDeliveriesPresenter;
    export type ViewModel = IWebhookDeliveriesViewModel;
    export type Actions = IWebhookDeliveriesActions;
}
```

**WebhookDeliveriesPresenter** (MobX):
- Constructor injects: `ListPresenter`, `ResendWebhookDeliveryUseCase`.
- `init(webhookId)`: creates `WebhookDeliveriesDataSource` with the webhookId, calls `listPresenter.init(...)`.
- `resend(id)`: calls `ResendWebhookDeliveryUseCase.execute(id)`, then refreshes the list.
- `selectDelivery()`: sets the selected delivery for detail viewing (status, payload, response, headers).

**WebhookDeliveriesDataSource** (`IDataSource<WebhookDeliveryDto>`):
- Constructor takes `ListWebhookDeliveriesUseCase` and `webhookId`.
- `query()` calls `useCase.execute({ webhookId, limit, after: cursor })`.

**WebhookDeliveriesDrawer** component:
- Receives `webhookId` and `open`/`onClose` props.
- Creates a scoped DI container for delivery features.
- Renders a `Drawer` with a list of deliveries.
- Each row shows: eventType, status (color-coded badge), createdOn, responseStatus.
- Clicking a delivery expands detail: payload (JSON), request headers, response body, response time.
- Resend button per delivery row.

### Security Presentation

```ts
// usePermissions.ts
import { createUsePermissions } from "@webiny/app-admin/exports/admin/security.js";
import { WebhookPermissions } from "~/admin/features/permissions/abstractions.js";

export const usePermissions = createUsePermissions(WebhookPermissions);
```

```tsx
// HasPermission.tsx
import { createHasPermission } from "@webiny/app-admin/exports/admin/security.js";
import { WebhookPermissions } from "~/admin/features/permissions/abstractions.js";
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const HasPermission = createHasPermission(WebhookPermissions, WEBHOOK_PERMISSIONS_SCHEMA);
```

## Extension Entry Point

```tsx
// Extension.tsx
import React from "react";
import { AdminConfig, RegisterFeature } from "webiny/admin";
import { ListWebhooksFeature } from "./features/listWebhooks/index.js";
import { GetWebhookFeature } from "./features/getWebhook/index.js";
import { CreateWebhookFeature } from "./features/createWebhook/index.js";
import { UpdateWebhookFeature } from "./features/updateWebhook/index.js";
import { DeleteWebhookFeature } from "./features/deleteWebhook/index.js";
import { ListWebhookDeliveriesFeature } from "./features/listWebhookDeliveries/index.js";
import { TriggerWebhookFeature } from "./features/triggerWebhook/index.js";
import { ResendWebhookDeliveryFeature } from "./features/resendWebhookDelivery/index.js";
import { ListAvailableEventsFeature } from "./features/listAvailableEvents/index.js";
import { WebhookPermissionsFeature } from "./features/permissions/index.js";
import { WebhookListPresenterFeature } from "./presentation/WebhookList/index.js";
import { WebhookFormPresenterFeature } from "./presentation/WebhookForm/index.js";
import { WebhookDeliveriesPresenterFeature } from "./presentation/WebhookDeliveries/index.js";
import { WebhookRoutes } from "./WebhookRoutes.js";
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

const { Security } = AdminConfig;

export const Extension = () => {
    return (
        <>
            {/* Headless features. */}
            <RegisterFeature feature={ListWebhooksFeature} />
            <RegisterFeature feature={GetWebhookFeature} />
            <RegisterFeature feature={CreateWebhookFeature} />
            <RegisterFeature feature={UpdateWebhookFeature} />
            <RegisterFeature feature={DeleteWebhookFeature} />
            <RegisterFeature feature={ListWebhookDeliveriesFeature} />
            <RegisterFeature feature={TriggerWebhookFeature} />
            <RegisterFeature feature={ResendWebhookDeliveryFeature} />
            <RegisterFeature feature={ListAvailableEventsFeature} />
            <RegisterFeature feature={WebhookPermissionsFeature} />
            {/* Presentation features. */}
            <RegisterFeature feature={WebhookListPresenterFeature} />
            <RegisterFeature feature={WebhookFormPresenterFeature} />
            <RegisterFeature feature={WebhookDeliveriesPresenterFeature} />
            {/* Routes + menu. */}
            <WebhookRoutes />
            {/* Security permissions UI. */}
            <AdminConfig>
                <Security.Permissions
                    name="webhooks"
                    title="Webhooks"
                    description="Manage webhook permissions."
                    schema={WEBHOOK_PERMISSIONS_SCHEMA}
                />
            </AdminConfig>
        </>
    );
};
```

## WebhookRoutes

```tsx
// WebhookRoutes.tsx
import React from "react";
import { AdminConfig } from "webiny/admin";
import { AdminLayout } from "webiny/admin/ui";
import { Routes } from "./routes.js";
import { HasPermission } from "./presentation/security/HasPermission.js";
import { WebhookListView } from "./presentation/WebhookList/components/WebhookListView.js";
import { WebhookFormView } from "./presentation/WebhookForm/components/WebhookFormView.js";

const { Menu, Route } = AdminConfig;

export const WebhookRoutes = () => {
    return (
        <AdminConfig>
            <HasPermission entity="webhook">
                <Route
                    route={Routes.List}
                    element={
                        <AdminLayout title="Webhooks">
                            <WebhookListView />
                        </AdminLayout>
                    }
                />
                <Route
                    route={Routes.Form}
                    element={
                        <AdminLayout title="Webhooks">
                            <WebhookFormView />
                        </AdminLayout>
                    }
                />
                <Menu
                    name="webhooks"
                    after="settings"
                    element={<Menu.Link text="Webhooks" to="/webhooks" />}
                />
            </HasPermission>
        </AdminConfig>
    );
};
```

## Export

```ts
// src/exports/admin/webhooks.ts
export { Extension } from "../../admin/Extension.js";
```

## Data Flow Summary

### List View
```
WebhookListView (observer)
  → useFeature(WebhookListPresenterFeature) → presenter
    → WebhookListPresenter.init()
      → WebhookListDataSource (IDataSource<WebhookDto>)
        → ListWebhooksUseCase.execute()
          → ListWebhooksGateway.execute()
            → sdk.webhooks.listWebhooks()
    → presenter.vm.list (IListViewModel<WebhookDto>)
    → presenter.actions.deleteWebhook(id)
      → DeleteWebhookUseCase.execute(id)
        → DeleteWebhookGateway.execute(id)
          → sdk.webhooks.deleteWebhook(id)
      → listPresenter.actions.refresh()
```

### Form View
```
WebhookFormView (observer)
  → useFeature(WebhookFormPresenterFeature) → presenter
    → WebhookFormPresenter.init(id)
      → GetWebhookUseCase.execute(id)           (if editing)
        → sdk.webhooks.getWebhook(id)
      → ListAvailableEventsUseCase.execute()     (always)
        → sdk.webhooks.listAvailableWebhookEvents()
      → buildForm(webhook, events)               (FormModel)
    → presenter.vm.form (IFormModel)
    → presenter.actions.save()
      → form.submit()                            (validation)
      → CreateWebhookUseCase / UpdateWebhookUseCase
        → sdk.webhooks.createWebhook / updateWebhook
```

### Deliveries Drawer
```
WebhookDeliveriesDrawer (observer)
  → useFeature(WebhookDeliveriesPresenterFeature) → presenter
    → WebhookDeliveriesPresenter.init(webhookId)
      → WebhookDeliveriesDataSource (IDataSource<WebhookDeliveryDto>)
        → ListWebhookDeliveriesUseCase.execute()
          → sdk.webhooks.listWebhookDeliveries()
    → presenter.actions.resend(deliveryId)
      → ResendWebhookDeliveryUseCase.execute(id)
        → sdk.webhooks.resendWebhookDelivery(id)
```
