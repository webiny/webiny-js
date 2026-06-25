# Webhook Deliveries: Filter-by-Webhook via Route Navigation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the webhook deliveries drawer with route-based navigation to `/webhooks/deliveries?webhookId=<id>`, adding a Webhook dropdown to the deliveries page filter bar.

**Architecture:** The "Deliveries" button on the webhook edit form navigates to the deliveries route with a `webhookId` query param. The deliveries page presenter reads this param, pre-selects the webhook in a new dropdown filter, and applies `webhookId_eq` to the query. The entire drawer-based `WebhookDeliveries/` directory is deleted; shared components are relocated into `WebhookDeliveriesPage/`.

**Tech Stack:** TypeScript, React, MobX, Webiny DI (`createAbstraction`/`createImplementation`/`createFeature`)

**Key paths (all relative to `packages/webhooks/src/admin/`):**
- `presentation/WebhookDeliveriesPage/` — the deliveries page (target of changes)
- `presentation/WebhookDeliveries/` — the drawer (to be deleted)
- `presentation/WebhookForm/` — the edit form (remove drawer, add navigation)
- `Webhooks.tsx` — top-level feature registrations
- `routes.ts` — route definitions

---

### Task 1: Move shared components from `WebhookDeliveries/` into `WebhookDeliveriesPage/`

Four files in the drawer directory are imported by the page. Move them before deleting the drawer.

**Files:**
- Move: `presentation/WebhookDeliveries/WebhookDeliveriesDataSource.ts` → `presentation/WebhookDeliveriesPage/WebhookDeliveriesDataSource.ts`
- Move: `presentation/WebhookDeliveries/components/DeliveryAccordionRow.tsx` → `presentation/WebhookDeliveriesPage/components/DeliveryAccordionRow.tsx`
- Move: `presentation/WebhookDeliveries/components/DeliveryDetailContent.tsx` → `presentation/WebhookDeliveriesPage/components/DeliveryDetailContent.tsx`
- Move: `presentation/WebhookDeliveries/components/statusVariant.ts` → `presentation/WebhookDeliveriesPage/components/statusVariant.ts`
- Modify: `presentation/WebhookDeliveriesPage/WebhookDeliveriesPagePresenter.ts` (update import)
- Modify: `presentation/WebhookDeliveriesPage/components/DeliveryList.tsx` (update import)

- [ ] **Step 1: Copy the four files to their new locations**

Copy each file as-is (no content changes yet):
- `WebhookDeliveriesDataSource.ts` → `presentation/WebhookDeliveriesPage/WebhookDeliveriesDataSource.ts`
- `DeliveryAccordionRow.tsx` → `presentation/WebhookDeliveriesPage/components/DeliveryAccordionRow.tsx`
- `DeliveryDetailContent.tsx` → `presentation/WebhookDeliveriesPage/components/DeliveryDetailContent.tsx`
- `statusVariant.ts` → `presentation/WebhookDeliveriesPage/components/statusVariant.ts`

- [ ] **Step 2: Update imports in the moved `DeliveryAccordionRow.tsx`**

The file imports `DeliveryDetailContent` and `statusVariant` from sibling paths. Since they are now co-located, update to relative imports:

```tsx
import { DeliveryDetailContent } from "./DeliveryDetailContent.js";
import { statusVariant } from "./statusVariant.js";
```

These imports are already relative and identical in the new location — no change needed.

- [ ] **Step 3: Update import in `WebhookDeliveriesPagePresenter.ts`**

Change the `WebhookDeliveriesDataSource` import from:
```ts
import { WebhookDeliveriesDataSource } from "~/admin/presentation/WebhookDeliveries/WebhookDeliveriesDataSource.js";
```
to:
```ts
import { WebhookDeliveriesDataSource } from "./WebhookDeliveriesDataSource.js";
```

- [ ] **Step 4: Update import in `DeliveryList.tsx`**

Change the `DeliveryAccordionRow` import from:
```tsx
import { DeliveryAccordionRow } from "~/admin/presentation/WebhookDeliveries/components/DeliveryAccordionRow.js";
```
to:
```tsx
import { DeliveryAccordionRow } from "./DeliveryAccordionRow.js";
```

- [ ] **Step 5: Verify the build**

```bash
yarn build -p @webiny/webhooks 2>&1 | tail -30
```

Expected: successful build with no import errors.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "refactor: move shared delivery components into WebhookDeliveriesPage"
```

---

### Task 2: Delete the `WebhookDeliveries/` drawer directory and remove its registrations

**Files:**
- Delete: entire `presentation/WebhookDeliveries/` directory
- Modify: `presentation/WebhookForm/components/WebhookFormView.tsx` (remove drawer import and usage)
- Modify: `Webhooks.tsx` (remove `WebhookDeliveriesPresenterFeature` registration)

- [ ] **Step 1: Remove drawer usage from `WebhookFormView.tsx`**

Remove the `WebhookDeliveriesDrawer` import:
```tsx
// DELETE this line:
import { WebhookDeliveriesDrawer } from "~/admin/presentation/WebhookDeliveries/components/WebhookDeliveriesDrawer.js";
```

Remove the drawer JSX block (lines 84-90). The entire `<>...</>` fragment wrapper is no longer needed — unwrap to just the outer `<div>`:

The component return should become:
```tsx
return (
    <div className="flex flex-col h-main-content">
        <div className="flex items-center justify-between py-sm px-md">
            <Heading level={5}>
                {vm.isNew ? "Create Webhook" : (vm.webhook?.name ?? "Edit Webhook")}
            </Heading>
            <div className="flex gap-sm">
                {!vm.isNew ? (
                    <Button variant="secondary" onClick={() => presenter.openDeliveries()}>
                        Deliveries
                    </Button>
                ) : null}
                <Button variant="secondary" onClick={() => goToRoute(Routes.List)}>
                    Cancel
                </Button>
                <HasPermission entity="webhook" action="edit">
                    <Button
                        variant="primary"
                        onClick={() => void presenter.save()}
                        disabled={vm.saving}
                    >
                        {vm.saving ? "Saving..." : "Save"}
                    </Button>
                </HasPermission>
            </div>
        </div>
        <Separator />

        <div className="p-lg">
            <>
                <FormErrors form={vm.form} />
                <FormView name="Webhook" form={vm.form} renderers={renderers} />
                <SigningSecret presenter={presenter} />
            </>
        </div>
    </div>
);
```

Note: the `presenter.openDeliveries()` call is still there — we'll replace it in Task 4.

- [ ] **Step 2: Remove `WebhookDeliveriesPresenterFeature` from `Webhooks.tsx`**

Remove the import:
```tsx
// DELETE:
import { WebhookDeliveriesPresenterFeature } from "./presentation/WebhookDeliveries/index.js";
```

Remove the registration:
```tsx
// DELETE:
<RegisterFeature feature={WebhookDeliveriesPresenterFeature} />
```

- [ ] **Step 3: Delete the `WebhookDeliveries/` directory**

```bash
rm -rf packages/webhooks/src/admin/presentation/WebhookDeliveries
```

- [ ] **Step 4: Verify the build**

```bash
yarn build -p @webiny/webhooks 2>&1 | tail -30
```

Expected: successful build.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "refactor: remove webhook deliveries drawer"
```

---

### Task 3: Clean up `WebhookFormPresenter` — remove drawer state

**Files:**
- Modify: `presentation/WebhookForm/abstractions.ts`
- Modify: `presentation/WebhookForm/WebhookFormPresenter.ts`

- [ ] **Step 1: Update `abstractions.ts`**

Remove `showDeliveries` from the view model interface:
```ts
export interface IWebhookFormViewModel {
    loading: boolean;
    saving: boolean;
    isNew: boolean;
    webhook: Webhook | null;
    permissions: {
        canEdit: boolean;
        canDelete: boolean;
    };
    form: IFormVM;
}
```

Remove `openDeliveries` and `closeDeliveries` from the presenter interface:
```ts
export interface IWebhookFormPresenter {
    vm: IWebhookFormViewModel;
    init(id: string): void;
    save(): Promise<void>;
    deleteWebhook(): Promise<void>;
}
```

- [ ] **Step 2: Update `WebhookFormPresenter.ts`**

Remove the `_showDeliveries` field declaration:
```ts
// DELETE:
private _showDeliveries = false;
```

Remove `showDeliveries` from the `vm` getter:
```ts
public get vm(): IWebhookFormViewModel {
    return {
        loading: this._loading,
        saving: this._saving,
        isNew: this._isNew,
        webhook: this._webhook,
        permissions: {
            canEdit: this.permissions.canEdit("webhook"),
            canDelete: this.permissions.canDelete("webhook")
        },
        form: this._form.vm
    };
}
```

Remove the two methods:
```ts
// DELETE both:
public openDeliveries(): void {
    this._showDeliveries = true;
}

public closeDeliveries(): void {
    this._showDeliveries = false;
}
```

- [ ] **Step 3: Verify the build**

```bash
yarn build -p @webiny/webhooks 2>&1 | tail -30
```

Expected: successful build.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "refactor: remove delivery drawer state from WebhookFormPresenter"
```

---

### Task 4: Wire "Deliveries" button to route navigation

**Files:**
- Modify: `presentation/WebhookForm/components/WebhookFormView.tsx`

- [ ] **Step 1: Replace the Deliveries button onClick**

Change:
```tsx
{!vm.isNew ? (
    <Button variant="secondary" onClick={() => presenter.openDeliveries()}>
        Deliveries
    </Button>
) : null}
```

To:
```tsx
{!vm.isNew && vm.webhook ? (
    <Button
        variant="secondary"
        onClick={() => goToRoute(Routes.Deliveries, { webhookId: vm.webhook!.id })}
    >
        Deliveries
    </Button>
) : null}
```

The `goToRoute` and `Routes` are already imported. The router's `RouteUrl.fromPattern` puts non-path params into the query string, so this produces `/webhooks/deliveries?webhookId=<id>`.

- [ ] **Step 2: Verify the build**

```bash
yarn build -p @webiny/webhooks 2>&1 | tail -30
```

Expected: successful build.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: navigate to deliveries route with webhookId filter"
```

---

### Task 5: Add webhook filter to `WebhookDeliveriesPagePresenter`

**Files:**
- Modify: `presentation/WebhookDeliveriesPage/abstractions.ts`
- Modify: `presentation/WebhookDeliveriesPage/WebhookDeliveriesPagePresenter.ts`
- Modify: `presentation/WebhookDeliveriesPage/feature.ts`

- [ ] **Step 1: Update `abstractions.ts`**

Add `webhookId` to the filters interface:
```ts
export interface IDeliveryPageFilters {
    webhookId: string | null;
    app: string | null;
    entity: string | null;
    eventName: string | null;
    status: string[];
}
```

Add `availableWebhooks` to the view model:
```ts
export interface IWebhookDeliveriesPageViewModel {
    availableWebhooks: IDeliveryFilterOption[];
    availableApps: IDeliveryFilterOption[];
    availableEntities: IDeliveryFilterOption[];
    availableEventNames: IDeliveryFilterOption[];
    filters: IDeliveryPageFilters;
    list: IListViewModel<WebhookDelivery>;
    expandedDeliveryId: string | null;
    resendingIds: Set<string>;
    loading: boolean;
    error: string | null;
}
```

Add `setWebhookFilter` and update `init` signature on the presenter interface:
```ts
export interface IWebhookDeliveriesPagePresenter {
    vm: IWebhookDeliveriesPageViewModel;
    init(webhookId?: string): Promise<void>;
    setWebhookFilter(webhookId: string | null): void;
    setAppFilter(app: string | null): void;
    setEntityFilter(entity: string | null): void;
    setEventFilter(eventName: string | null): void;
    setStatusFilter(status: string[]): void;
    expandDelivery(id: string | null): void;
    loadMore(): Promise<void>;
    resend(id: string): Promise<void>;
}
```

- [ ] **Step 2: Update `WebhookDeliveriesPagePresenter.ts`**

Add the `ListWebhooksUseCase` import:
```ts
import {
    ListWebhooksUseCase
} from "~/admin/features/ListWebhooks/abstractions.js";
```

Add webhook tracking state. Update `_filters` default to include `webhookId: null`:
```ts
private _filters: IDeliveryPageFilters = {
    webhookId: null,
    app: null,
    entity: null,
    eventName: null,
    status: []
};
private _availableWebhooks: IDeliveryFilterOption[] = [];
```

Add `ListWebhooksUseCase` to the constructor:
```ts
constructor(
    private readonly listPresenter: ListPresenter.Interface<WebhookDelivery>,
    private readonly listDeliveriesUseCase: ListWebhookDeliveriesUseCase.Interface,
    private readonly listAvailableEventsUseCase: ListAvailableEventsUseCase.Interface,
    private readonly resendDeliveryUseCase: ResendWebhookDeliveryUseCase.Interface,
    private readonly listWebhooksUseCase: ListWebhooksUseCase.Interface
) {
    makeAutoObservable(this, { vm: computed });
}
```

Update the `vm` getter to include `availableWebhooks`:
```ts
get vm(): IWebhookDeliveriesPageViewModel {
    return {
        availableWebhooks: this._availableWebhooks,
        availableApps: this._computeAvailableApps(),
        availableEntities: this._computeAvailableEntities(),
        availableEventNames: this._computeAvailableEventNames(),
        filters: { ...this._filters },
        list: this.listPresenter.vm,
        expandedDeliveryId: this._expandedDeliveryId,
        resendingIds: new Set(this._resendingIds),
        loading: this._loading,
        error: this._error
    };
}
```

Update `init` to accept optional `webhookId` and fetch webhooks:
```ts
public async init(webhookId?: string): Promise<void> {
    runInAction(() => {
        this._loading = true;
        this._error = null;
        if (webhookId) {
            this._filters = { ...this._filters, webhookId };
        }
    });
    try {
        const [events, webhooksResult] = await Promise.all([
            this.listAvailableEventsUseCase.execute(),
            this.listWebhooksUseCase.execute({ limit: 1000 })
        ]);
        runInAction(() => {
            this._availableEvents = events;
            this._availableWebhooks = webhooksResult.items.map(w => ({
                value: w.id,
                label: w.name
            }));
        });
    } catch (err) {
        runInAction(() => {
            this._error = err instanceof Error ? err.message : "Failed to load events.";
        });
    } finally {
        runInAction(() => {
            this._loading = false;
        });
    }
    runInAction(() => {
        this._applyFilters();
    });
}
```

Add the `setWebhookFilter` method:
```ts
public setWebhookFilter(webhookId: string | null): void {
    this._filters = { ...this._filters, webhookId };
    this._expandedDeliveryId = null;
    this._applyFilters();
}
```

Update `_buildWhere` to include `webhookId_eq`:
```ts
private _buildWhere(): ListWebhookDeliveriesWhere {
    const where: ListWebhookDeliveriesWhere = {};

    if (this._filters.webhookId) {
        where.webhookId_eq = this._filters.webhookId;
    }

    const { app, entity, eventName } = this._filters;

    if (app || entity || eventName) {
        const matching = this._availableEvents.filter(event => {
            if (app && event.app !== app) {
                return false;
            }
            if (entity && event.entity !== entity) {
                return false;
            }
            if (eventName && event.eventName !== eventName) {
                return false;
            }
            return true;
        });
        if (matching.length > 0) {
            where.eventType_in = matching.map(e => e.eventName);
        }
    }

    if (this._filters.status.length > 0) {
        where.status_in = this._filters.status;
    }

    return where;
}
```

- [ ] **Step 3: Update `feature.ts` to register `ListWebhooksFeature` dependencies**

The `ListWebhooksUseCase` dependency must be resolvable in the container. The `WebhookDeliveriesPage` component already creates a scoped container and registers features. We need to add `ListWebhooksFeature` there (done in Task 6). The `feature.ts` file itself doesn't need changes — the DI wiring resolves from the container at runtime.

- [ ] **Step 4: Update the dependencies array in the `createImplementation` call**

```ts
export const WebhookDeliveriesPagePresenter = Abstraction.createImplementation({
    implementation: WebhookDeliveriesPagePresenterImpl,
    dependencies: [
        ListPresenter,
        ListWebhookDeliveriesUseCase,
        ListAvailableEventsUseCase,
        ResendWebhookDeliveryUseCase,
        ListWebhooksUseCase
    ]
});
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add webhook filter to deliveries page presenter"
```

---

### Task 6: Update `WebhookDeliveriesPage` component and `DeliveryFilters`

**Files:**
- Modify: `presentation/WebhookDeliveriesPage/components/WebhookDeliveriesPage.tsx`
- Modify: `presentation/WebhookDeliveriesPage/components/DeliveryFilters.tsx`

- [ ] **Step 1: Read `webhookId` from route params in `WebhookDeliveriesPage.tsx`**

Add `useRoute` import and read the param:

```tsx
import React, { useMemo, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature, useRoute } from "@webiny/app";
import { Button, Heading, Skeleton, Text } from "@webiny/admin-ui";
import { ListWebhookDeliveriesFeature } from "~/admin/features/listWebhookDeliveries/feature.js";
import { ListAvailableEventsFeature } from "~/admin/features/listAvailableEvents/feature.js";
import { ResendWebhookDeliveryFeature } from "~/admin/features/resendWebhookDelivery/feature.js";
import { ListWebhooksFeature } from "~/admin/features/ListWebhooks/feature.js";
import { WebhookDeliveriesPagePresenterFeature } from "../feature.js";
import { Routes } from "~/admin/routes.js";
import { DeliveryFilters } from "./DeliveryFilters.js";
import { DeliveryList } from "./DeliveryList.js";

const WebhookDeliveriesPageInner = observer(function WebhookDeliveriesPageInner() {
    const { presenter } = useFeature(WebhookDeliveriesPagePresenterFeature);
    const { route } = useRoute(Routes.Deliveries);
    const webhookId = route?.params?.webhookId as string | undefined;

    useEffect(() => {
        void presenter.init(webhookId);
    }, [presenter, webhookId]);

    const { vm } = presenter;

    if (vm.loading && vm.list.rows.length === 0) {
        return (
            <div className="flex flex-col gap-sm p-md">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    if (vm.error) {
        return (
            <div className="flex flex-col items-center gap-sm p-md">
                <Text>{vm.error}</Text>
                <Button variant="secondary" onClick={() => void presenter.init()}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-main-content">
            <div className="p-md pb-0 flex flex-col gap-md">
                <Heading level={4}>Delivery Log</Heading>
                <DeliveryFilters presenter={presenter} />
            </div>
            <DeliveryList presenter={presenter} />
        </div>
    );
});

export const WebhookDeliveriesPage = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ListWebhookDeliveriesFeature.register(child);
        ListAvailableEventsFeature.register(child);
        ResendWebhookDeliveryFeature.register(child);
        ListWebhooksFeature.register(child);
        WebhookDeliveriesPagePresenterFeature.register(child);
        return child;
    }, [container]);

    return (
        <DiContainerProvider container={scopedContainer}>
            <WebhookDeliveriesPageInner />
        </DiContainerProvider>
    );
};
```

- [ ] **Step 2: Add the Webhook dropdown to `DeliveryFilters.tsx`**

Add a Webhook `Select` as the first column. Adjust grid to 5 columns (2+2+2+2+2 = 10 of 12, fitting well):

```tsx
import React from "react";
import { observer } from "mobx-react-lite";
import { Grid, MultiSelect, Select } from "@webiny/admin-ui";
import type { IWebhookDeliveriesPagePresenter } from "../abstractions.js";

interface DeliveryFiltersProps {
    presenter: IWebhookDeliveriesPagePresenter;
}

const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "delivering", label: "Delivering" },
    { value: "delivered", label: "Delivered" },
    { value: "failed", label: "Failed" }
];

export const DeliveryFilters = observer(function DeliveryFilters({
    presenter
}: DeliveryFiltersProps) {
    const { vm } = presenter;
    return (
        <Grid className="py-sm">
            <Grid.Column span={2}>
                <Select
                    placeholder="All webhooks"
                    value={vm.filters.webhookId ?? ""}
                    options={vm.availableWebhooks}
                    onChange={value => presenter.setWebhookFilter(value || null)}
                    displayResetAction={true}
                    onValueReset={() => presenter.setWebhookFilter(null)}
                />
            </Grid.Column>
            <Grid.Column span={2}>
                <Select
                    placeholder="All apps"
                    value={vm.filters.app ?? ""}
                    options={vm.availableApps}
                    onChange={value => presenter.setAppFilter(value || null)}
                    displayResetAction={true}
                    onValueReset={() => presenter.setAppFilter(null)}
                />
            </Grid.Column>
            <Grid.Column span={2}>
                <Select
                    placeholder="All entities"
                    value={vm.filters.entity ?? ""}
                    options={vm.availableEntities}
                    onChange={value => presenter.setEntityFilter(value || null)}
                    disabled={!vm.filters.app}
                    displayResetAction={true}
                    onValueReset={() => presenter.setEntityFilter(null)}
                />
            </Grid.Column>
            <Grid.Column span={2}>
                <Select
                    placeholder="All events"
                    value={vm.filters.eventName ?? ""}
                    options={vm.availableEventNames}
                    onChange={value => presenter.setEventFilter(value || null)}
                    disabled={!vm.filters.app}
                    displayResetAction={true}
                    onValueReset={() => presenter.setEventFilter(null)}
                />
            </Grid.Column>
            <Grid.Column span={2}>
                <MultiSelect
                    placeholder="All statuses"
                    value={vm.filters.status}
                    options={STATUS_OPTIONS}
                    onChange={values => presenter.setStatusFilter(values)}
                />
            </Grid.Column>
        </Grid>
    );
});
```

- [ ] **Step 3: Verify the build**

```bash
yarn build -p @webiny/webhooks 2>&1 | tail -30
```

Expected: successful build.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add webhook dropdown filter to deliveries page"
```

---

### Task 7: Run pre-commit checks and final commit

**Files:** All modified files across previous tasks.

- [ ] **Step 1: Run the full pre-commit checklist**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
```

If any step fixes something, rerun from the top.

- [ ] **Step 2: Verify the build one final time**

```bash
yarn build -p @webiny/webhooks 2>&1 | tail -30
```

- [ ] **Step 3: Squash into a single commit (or keep as-is per preference)**

If individual commits were made per task, the branch is ready for PR. If a single commit is preferred:

```bash
git reset --soft HEAD~N
git commit -m "refactor: replace webhook deliveries drawer with route-based filtering"
```
