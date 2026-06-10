# Webhooks Admin UI Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the three skeleton view components (WebhookListView, WebhookFormView, WebhookDeliveriesDrawer) to their fully-functional presenters.

**Architecture:** Three MobX presenters are already complete. Views consume `presenter.vm` (observable) and call `presenter.actions.*`. The form presenter needs FormModel integration and events state. All data flows through SDK gateways.

**Tech Stack:** React, MobX, `@webiny/admin-ui` (DataTable, Tag, Drawer, FormView, CheckboxGroup, DropdownMenu), `@webiny/app-admin` (FormModelFactory, useConfirmationDialog, useSnackbar, useRouter).

---

## File Map

### Modified Files

| File | Responsibility |
|------|---------------|
| `presentation/WebhookForm/abstractions.ts` | Add `form`, `selectedEvents`, `toggleEvent` to interfaces |
| `presentation/WebhookForm/WebhookFormPresenter.ts` | Build FormModel, wire save flow, manage events state |
| `presentation/WebhookForm/components/WebhookFormView.tsx` | Render FormView, events selector, signing secret |
| `presentation/WebhookList/components/WebhookListView.tsx` | Wire DataTable with columns and row actions |
| `presentation/WebhookDeliveries/components/WebhookDeliveriesDrawer.tsx` | Wire two-panel layout with delivery table and detail |

### New Files

| File | Responsibility |
|------|---------------|
| `presentation/WebhookForm/components/EventsSelector.tsx` | Grouped checkbox component for event selection |
| `presentation/WebhookForm/components/SigningSecret.tsx` | Reveal toggle + copy button for signing secret |
| `presentation/WebhookDeliveries/components/DeliveryDetail.tsx` | Right panel: payload, headers, response display |

All paths are relative to `packages/webhooks/src/admin/`.

---

### Task 1: Update WebhookFormPresenter Abstractions

**Files:**
- Modify: `presentation/WebhookForm/abstractions.ts`

- [ ] **Step 1: Add form and events fields to IWebhookFormViewModel**

```ts
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
```

Add to `IWebhookFormViewModel`:

```ts
export interface IWebhookFormViewModel {
    loading: boolean;
    saving: boolean;
    isNew: boolean;
    webhook: Webhook | null;
    showDeliveries: boolean;
    availableEvents: WebhookEvent[];
    permissions: {
        canEdit: boolean;
        canDelete: boolean;
    };
    form: IFormVM;
    selectedEvents: string[];
}
```

- [ ] **Step 2: Add toggleEvent to IWebhookFormActions**

```ts
export interface IWebhookFormActions {
    save(): Promise<void>;
    deleteWebhook(): Promise<void>;
    openDeliveries(): void;
    closeDeliveries(): void;
    toggleEvent(eventName: string): void;
}
```

- [ ] **Step 3: Commit**

Run the pre-commit checklist from CLAUDE.md, then:

```bash
git commit -m "refactor(webhooks): add form and events to WebhookFormPresenter abstractions"
```

---

### Task 2: Wire FormModel into WebhookFormPresenter

**Files:**
- Modify: `presentation/WebhookForm/WebhookFormPresenter.ts`

- [ ] **Step 1: Add private fields for form and events state**

Add these private fields to `WebhookFormPresenterImpl`:

```ts
private _form!: IFormModel;
private _selectedEvents: Set<string> = new Set();
```

Import `IFormModel` from `@webiny/app-admin/features/formModel/abstractions.js`.

- [ ] **Step 2: Add a private buildForm method**

This method creates the FormModel instance. It must be called after `_availableEvents` is loaded because the slug field needs to be conditionally disabled.

```ts
private buildForm(): IFormModel {
    return this.formModelFactory.create({
        fields: fields => ({
            name: fields.text().label("Name").required("Name is required"),
            slug: fields.text().label("Slug").required("Slug is required"),
            endpointUrl: fields
                .text()
                .label("Endpoint URL")
                .required("Endpoint URL is required")
                .placeholder("https://"),
            description: fields.text().label("Description").renderer("textarea"),
            enabled: fields.boolean().label("Enabled").defaultValue(false)
        }),
        layout: layout => [
            layout.row("name", "slug"),
            layout.row("endpointUrl"),
            layout.row("description"),
            layout.row("enabled")
        ]
    });
}
```

- [ ] **Step 3: Update init() to build form and populate data**

Replace the existing `init()` method body. After loading webhook and events, build the form and populate it:

```ts
async init(id: string): Promise<void> {
    this._loading = true;
    this._isNew = id === "new";
    this._webhookId = id === "new" ? null : id;

    const eventsPromise = this.listAvailableEventsUseCase.execute();

    if (!this._isNew) {
        const [webhook, events] = await Promise.all([
            this.getWebhookUseCase.execute(id),
            eventsPromise
        ]);

        runInAction(() => {
            this._webhook = webhook;
            this._availableEvents = events;
            this._form = this.buildForm();
            this._form.setData({
                name: webhook.name,
                slug: webhook.slug,
                endpointUrl: webhook.endpointUrl,
                description: webhook.description ?? "",
                enabled: webhook.enabled
            });
            this._form.field("slug").setDisabled(true);
            this._selectedEvents = new Set(webhook.events);
            this._loading = false;
        });
    } else {
        const events = await eventsPromise;

        runInAction(() => {
            this._availableEvents = events;
            this._form = this.buildForm();
            this._loading = false;
        });
    }
}
```

- [ ] **Step 4: Wire the save action**

Replace the placeholder `actions.save` with real logic. Import `useRouter` is not available in the presenter — save returns the created webhook so the view can navigate.

```ts
actions: IWebhookFormActions = {
    save: async () => {
        const data = await this._form.submit<Record<string, unknown>>();
        if (data === false) {
            return;
        }

        this._saving = true;

        try {
            const merged = {
                name: data.name as string,
                slug: data.slug as string,
                endpointUrl: data.endpointUrl as string,
                description: (data.description as string) || null,
                enabled: data.enabled as boolean,
                events: Array.from(this._selectedEvents)
            };

            if (this._isNew) {
                const created = await this.createWebhookUseCase.execute(merged);

                runInAction(() => {
                    this._webhook = created;
                    this._webhookId = created.id;
                    this._isNew = false;
                    this._form.field("slug").setDisabled(true);
                });
            } else {
                const updated = await this.updateWebhookUseCase.execute(
                    this._webhookId!,
                    merged
                );

                runInAction(() => {
                    this._webhook = updated;
                });
            }
        } finally {
            runInAction(() => {
                this._saving = false;
            });
        }
    },
    deleteWebhook: async () => {
        if (!this._webhookId || this._isNew) {
            return;
        }
        await this.deleteWebhookUseCase.execute(this._webhookId);
    },
    openDeliveries: () => {
        this._showDeliveries = true;
    },
    closeDeliveries: () => {
        this._showDeliveries = false;
    },
    toggleEvent: (eventName: string) => {
        if (this._selectedEvents.has(eventName)) {
            this._selectedEvents.delete(eventName);
        } else {
            this._selectedEvents.add(eventName);
        }
    }
};
```

- [ ] **Step 5: Update the vm getter**

Add `form` and `selectedEvents` to the returned object:

```ts
get vm(): IWebhookFormViewModel {
    return {
        loading: this._loading,
        saving: this._saving,
        isNew: this._isNew,
        webhook: this._webhook,
        showDeliveries: this._showDeliveries,
        availableEvents: this._availableEvents,
        permissions: {
            canEdit: this.permissions.canEdit("webhook"),
            canDelete: this.permissions.canDelete("webhook")
        },
        form: this._form.vm,
        selectedEvents: Array.from(this._selectedEvents)
    };
}
```

- [ ] **Step 6: Check types compile**

```bash
yarn check -p @webiny/webhooks 2>&1 | tail -20
```

Expected: no errors related to the form presenter.

- [ ] **Step 7: Commit**

Run the pre-commit checklist from CLAUDE.md, then:

```bash
git commit -m "feat(webhooks): wire FormModel and save flow into WebhookFormPresenter"
```

---

### Task 3: Create EventsSelector Component

**Files:**
- Create: `presentation/WebhookForm/components/EventsSelector.tsx`

- [ ] **Step 1: Create the EventsSelector component**

This component renders available events grouped by `app`, with checkboxes. It receives the available events, selected events, and a toggle callback from the presenter.

```tsx
import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { CheckboxGroup, Heading, Separator } from "@webiny/admin-ui";
import type { WebhookEvent } from "~/admin/shared/types.js";

interface EventsSelectorProps {
    availableEvents: WebhookEvent[];
    selectedEvents: string[];
    onToggle: (eventName: string) => void;
    disabled?: boolean;
}

export const EventsSelector = observer(function EventsSelector({
    availableEvents,
    selectedEvents,
    onToggle,
    disabled
}: EventsSelectorProps) {
    const grouped = useMemo(() => {
        const map = new Map<string, WebhookEvent[]>();

        for (const event of availableEvents) {
            const existing = map.get(event.app) ?? [];
            existing.push(event);
            map.set(event.app, existing);
        }

        return map;
    }, [availableEvents]);

    return (
        <div className="flex flex-col gap-md">
            <Heading level={6}>Events</Heading>
            {Array.from(grouped.entries()).map(([app, events]) => (
                <div key={app} className="flex flex-col gap-sm">
                    <Heading level={6} className="text-neutral-strong">
                        {app}
                    </Heading>
                    <CheckboxGroup
                        items={events.map(e => ({
                            id: e.eventName,
                            label: e.label,
                            value: e.eventName
                        }))}
                        value={selectedEvents}
                        onChange={values => {
                            const current = new Set(selectedEvents);
                            const next = new Set(values as string[]);

                            for (const v of next) {
                                if (!current.has(v)) {
                                    onToggle(v);
                                }
                            }

                            for (const v of current) {
                                if (!next.has(v) && events.some(e => e.eventName === v)) {
                                    onToggle(v);
                                }
                            }
                        }}
                        disabled={disabled}
                    />
                    <Separator />
                </div>
            ))}
        </div>
    );
});
```

- [ ] **Step 2: Commit**

Run the pre-commit checklist from CLAUDE.md, then:

```bash
git commit -m "feat(webhooks): add EventsSelector grouped checkbox component"
```

---

### Task 4: Create SigningSecret Component

**Files:**
- Create: `presentation/WebhookForm/components/SigningSecret.tsx`

- [ ] **Step 1: Create the SigningSecret component**

A read-only field that shows the webhook signing secret with a reveal toggle and copy-to-clipboard button.

```tsx
import React, { useState, useCallback } from "react";
import { IconButton, Text } from "@webiny/admin-ui";
import { useSnackbar } from "@webiny/app-admin/hooks/index.js";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { ReactComponent as VisibilityOffIcon } from "@webiny/icons/visibility_off.svg";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";

interface SigningSecretProps {
    secret: string;
}

export const SigningSecret = ({ secret }: SigningSecretProps) => {
    const [revealed, setRevealed] = useState(false);
    const { showSnackbar } = useSnackbar();

    const handleCopy = useCallback(async () => {
        await navigator.clipboard.writeText(secret);
        showSnackbar("Signing secret copied to clipboard.");
    }, [secret, showSnackbar]);

    return (
        <div className="flex flex-col gap-xs">
            <Text size="sm" className="text-neutral-strong">
                Signing Secret
            </Text>
            <div className="flex items-center gap-sm rounded-sm border-sm border-neutral-muted px-sm py-xs">
                <Text size="sm" className="flex-1 font-mono select-all">
                    {revealed ? secret : "•".repeat(24)}
                </Text>
                <IconButton
                    icon={revealed ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    variant="secondary"
                    size="sm"
                    onClick={() => setRevealed(prev => !prev)}
                    label={revealed ? "Hide secret" : "Reveal secret"}
                />
                <IconButton
                    icon={<CopyIcon />}
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleCopy()}
                    label="Copy secret"
                />
            </div>
        </div>
    );
};
```

- [ ] **Step 2: Verify icon imports exist**

```bash
ls packages/icons/svgs/visibility.svg packages/icons/svgs/visibility_off.svg packages/icons/svgs/content_copy.svg 2>&1
```

If any icons are missing, check available icons and adjust imports:

```bash
ls packages/icons/svgs/ | grep -i "vis\|copy\|eye" | head -10
```

- [ ] **Step 3: Commit**

Run the pre-commit checklist from CLAUDE.md, then:

```bash
git commit -m "feat(webhooks): add SigningSecret reveal + copy component"
```

---

### Task 5: Wire WebhookFormView

**Files:**
- Modify: `presentation/WebhookForm/components/WebhookFormView.tsx`

- [ ] **Step 1: Add imports**

Add these imports to the top of the file:

```tsx
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { EventsSelector } from "./EventsSelector.js";
import { SigningSecret } from "./SigningSecret.js";
import { WebhookDeliveriesDrawer } from "~/admin/presentation/WebhookDeliveries/components/WebhookDeliveriesDrawer.js";
```

- [ ] **Step 2: Replace the skeleton body in WebhookFormViewInner**

Replace the `{/* FormModel renderer will be wired here. */}` comment inside the `flex-1 overflow-auto p-md` div with:

```tsx
<div className="flex flex-col gap-lg max-w-[720px]">
    <FormView name="Webhook" form={vm.form} />
    <EventsSelector
        availableEvents={vm.availableEvents}
        selectedEvents={vm.selectedEvents}
        onToggle={actions.toggleEvent}
        disabled={!vm.permissions.canEdit}
    />
    {!vm.isNew && vm.webhook?.signingSecret && (
        <SigningSecret secret={vm.webhook.signingSecret} />
    )}
</div>
```

- [ ] **Step 3: Add the deliveries drawer**

After the closing `</div>` of `h-main-content` but still inside the return, add the deliveries drawer:

```tsx
{vm.showDeliveries && vm.webhook && (
    <WebhookDeliveriesDrawer
        webhookId={vm.webhook.id}
        open={vm.showDeliveries}
        onClose={() => actions.closeDeliveries()}
    />
)}
```

- [ ] **Step 4: Check types compile**

```bash
yarn check -p @webiny/webhooks 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

Run the pre-commit checklist from CLAUDE.md, then:

```bash
git commit -m "feat(webhooks): wire FormView, EventsSelector, and SigningSecret into WebhookFormView"
```

---

### Task 6: Wire WebhookListView DataTable

**Files:**
- Modify: `presentation/WebhookList/components/WebhookListView.tsx`

- [ ] **Step 1: Add imports**

Add these imports to the top of the file:

```tsx
import { DataTable, Tag, TimeAgo, DropdownMenu, IconButton, Text } from "@webiny/admin-ui";
import type { DataTableSorting, OnDataTableSortingChange } from "@webiny/admin-ui";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin/hooks/index.js";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import type { Webhook } from "~/admin/shared/types.js";
```

- [ ] **Step 2: Define column definitions**

Inside `WebhookListViewInner`, after the `const { vm } = presenter;` line, add the columns definition and sorting handler:

```tsx
const { showSnackbar } = useSnackbar();

const { showConfirmation: showDeleteConfirmation } = useConfirmationDialog({
    title: "Delete Webhook",
    message: "Are you sure you want to delete this webhook?"
});

const sorting: DataTableSorting = useMemo(() => {
    const sort = vm.list.sort;
    if (!sort.field) {
        return [];
    }
    return [{ id: sort.field, desc: sort.direction === "DESC" }];
}, [vm.list.sort]);

const onSortingChange: OnDataTableSortingChange = useCallback(
    updater => {
        const next = typeof updater === "function" ? updater(sorting) : updater;
        if (next.length > 0) {
            const { id, desc } = next[0];
            presenter.actions.sort.set(id, desc ? "DESC" : "ASC");
        }
    },
    [sorting, presenter.actions.sort]
);

const columns = useMemo(
    () => ({
        name: {
            header: "Name",
            cell: (row: Webhook) => (
                <Text
                    className="cursor-pointer text-primary hover:underline"
                    onClick={() => goToRoute(Routes.Form, { id: row.id })}
                >
                    {row.name}
                </Text>
            ),
            enableSorting: true,
            size: 200
        },
        endpointUrl: {
            header: "Endpoint",
            cell: (row: Webhook) => (
                <Text className="font-mono text-sm truncate">{row.endpointUrl}</Text>
            ),
            size: 250
        },
        enabled: {
            header: "Status",
            cell: (row: Webhook) => (
                <Tag
                    variant={row.enabled ? "success" : "neutral-muted"}
                    content={row.enabled ? "Active" : "Disabled"}
                />
            ),
            enableSorting: true,
            size: 100
        },
        createdOn: {
            header: "Created",
            cell: (row: Webhook) => <TimeAgo datetime={row.createdOn} />,
            enableSorting: true,
            size: 120
        },
        actions: {
            header: " ",
            cell: (row: Webhook) => (
                <DropdownMenu
                    trigger={
                        <IconButton
                            icon={<MoreVerticalIcon />}
                            variant="ghost"
                            size="sm"
                            label="Actions"
                        />
                    }
                >
                    <DropdownMenu.Item
                        onSelect={() => goToRoute(Routes.Form, { id: row.id })}
                    >
                        Edit
                    </DropdownMenu.Item>
                    {vm.permissions.canEdit && (
                        <DropdownMenu.Item
                            onSelect={() => {
                                void presenter.actions.triggerWebhook(row.id).then(() => {
                                    showSnackbar("Test event triggered.");
                                });
                            }}
                        >
                            Trigger Test
                        </DropdownMenu.Item>
                    )}
                    {vm.permissions.canDelete && (
                        <>
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item
                                onSelect={() => {
                                    showDeleteConfirmation(() =>
                                        presenter.actions.deleteWebhook(row.id)
                                    );
                                }}
                            >
                                Delete
                            </DropdownMenu.Item>
                        </>
                    )}
                </DropdownMenu>
            ),
            size: 56,
            enableSorting: false,
            enableHiding: false,
            enableResizing: false
        }
    }),
    [vm.permissions, presenter.actions, goToRoute, showDeleteConfirmation, showSnackbar]
);
```

- [ ] **Step 3: Replace the skeleton body**

Replace the `{/* DataTable columns ... */}` comment and the wrapping div with:

```tsx
<div className="flex-1 overflow-auto">
    {!vm.list.pagination.loading && vm.list.rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-md">
            <Text className="text-neutral-strong">No webhooks found.</Text>
            {vm.permissions.canCreate && (
                <Button
                    variant="primary"
                    onClick={() => goToRoute(Routes.Form, { id: "new" })}
                >
                    Create Webhook
                </Button>
            )}
        </div>
    ) : (
        <DataTable<Webhook>
            columns={columns}
            data={vm.list.rows}
            loading={vm.list.pagination.loading}
            sorting={sorting}
            onSortingChange={onSortingChange}
            stickyHeader
        />
    )}
</div>
```

- [ ] **Step 4: Add useCallback to imports**

Make sure the React import includes `useCallback`:

```tsx
import React, { useMemo, useEffect, useCallback } from "react";
```

- [ ] **Step 5: Check types compile**

```bash
yarn check -p @webiny/webhooks 2>&1 | tail -20
```

- [ ] **Step 6: Commit**

Run the pre-commit checklist from CLAUDE.md, then:

```bash
git commit -m "feat(webhooks): wire DataTable columns and row actions into WebhookListView"
```

---

### Task 7: Create DeliveryDetail Component

**Files:**
- Create: `presentation/WebhookDeliveries/components/DeliveryDetail.tsx`

- [ ] **Step 1: Create the DeliveryDetail component**

This is the right panel shown when a delivery is selected. It displays payload, headers, response body, and a resend button.

```tsx
import React from "react";
import { observer } from "mobx-react-lite";
import { Button, Heading, IconButton, Separator, Tag, Text } from "@webiny/admin-ui";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import type { WebhookDelivery } from "~/admin/shared/types.js";

interface DeliveryDetailProps {
    delivery: WebhookDelivery;
    onClose: () => void;
    onResend: (id: string) => void;
}

const statusVariant = (status: string) => {
    switch (status) {
        case "delivered":
            return "success" as const;
        case "failed":
            return "destructive" as const;
        default:
            return "warning" as const;
    }
};

const formatJson = (value: unknown): string => {
    if (value === null || value === undefined) {
        return "—";
    }

    if (typeof value === "string") {
        try {
            return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
            return value;
        }
    }

    return JSON.stringify(value, null, 2);
};

export const DeliveryDetail = observer(function DeliveryDetail({
    delivery,
    onClose,
    onResend
}: DeliveryDetailProps) {
    return (
        <div className="flex flex-col h-full overflow-auto">
            <div className="flex items-center justify-between px-md py-sm">
                <div className="flex items-center gap-sm">
                    <Heading level={6}>{delivery.eventType}</Heading>
                    <Tag
                        variant={statusVariant(delivery.status)}
                        content={delivery.status}
                    />
                </div>
                <IconButton
                    icon={<CloseIcon />}
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    label="Close detail"
                />
            </div>
            <Separator />
            <div className="flex-1 overflow-auto px-md py-sm flex flex-col gap-md">
                <div>
                    <Text size="sm" className="text-neutral-strong">
                        Response Time
                    </Text>
                    <Text size="sm">
                        {delivery.responseTime !== null ? `${delivery.responseTime}ms` : "—"}
                    </Text>
                </div>

                <div>
                    <Text size="sm" className="text-neutral-strong">
                        Payload
                    </Text>
                    <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]">
                        {formatJson(delivery.payload)}
                    </pre>
                </div>

                <div>
                    <Text size="sm" className="text-neutral-strong">
                        Request Headers
                    </Text>
                    <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]">
                        {formatJson(delivery.requestHeaders)}
                    </pre>
                </div>

                <div>
                    <Text size="sm" className="text-neutral-strong">
                        Response Body
                    </Text>
                    <pre className="bg-neutral-light rounded-sm p-sm text-xs overflow-auto max-h-[200px]">
                        {delivery.responseBody ?? "—"}
                    </pre>
                </div>
            </div>
            <Separator />
            <div className="px-md py-sm">
                <Button
                    variant="secondary"
                    onClick={() => onResend(delivery.id)}
                >
                    Resend
                </Button>
            </div>
        </div>
    );
});
```

- [ ] **Step 2: Commit**

Run the pre-commit checklist from CLAUDE.md, then:

```bash
git commit -m "feat(webhooks): add DeliveryDetail component for delivery drawer"
```

---

### Task 8: Wire WebhookDeliveriesDrawer

**Files:**
- Modify: `presentation/WebhookDeliveries/components/WebhookDeliveriesDrawer.tsx`

- [ ] **Step 1: Add imports**

Add these imports:

```tsx
import { DataTable, Tag, Text, TimeAgo, IconButton, Separator } from "@webiny/admin-ui";
import { ReactComponent as ReplayIcon } from "@webiny/icons/replay.svg";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import { DeliveryDetail } from "./DeliveryDetail.js";
```

- [ ] **Step 2: Replace the drawer body**

Replace the `<></>` inside the Drawer with the two-panel layout. The full `WebhookDeliveriesDrawerInner` component becomes:

```tsx
const statusVariant = (status: string) => {
    switch (status) {
        case "delivered":
            return "success" as const;
        case "failed":
            return "destructive" as const;
        default:
            return "warning" as const;
    }
};

const WebhookDeliveriesDrawerInner = observer(function WebhookDeliveriesDrawerInner({
    webhookId,
    open,
    onClose
}: WebhookDeliveriesDrawerProps) {
    const { presenter } = useFeature(WebhookDeliveriesPresenterFeature);

    useEffect(() => {
        if (open) {
            presenter.init(webhookId);
        }
    }, [presenter, webhookId, open]);

    const { vm } = presenter;

    const columns = useMemo(
        () => ({
            eventType: {
                header: "Event",
                size: 180
            },
            status: {
                header: "Status",
                cell: (row: WebhookDelivery) => (
                    <Tag variant={statusVariant(row.status)} content={row.status} />
                ),
                size: 100
            },
            responseStatus: {
                header: "HTTP",
                cell: (row: WebhookDelivery) => (
                    <Text size="sm">
                        {row.responseStatus !== null ? String(row.responseStatus) : "—"}
                    </Text>
                ),
                size: 60
            },
            createdOn: {
                header: "Created",
                cell: (row: WebhookDelivery) => <TimeAgo datetime={row.createdOn} />,
                enableSorting: true,
                size: 120
            },
            actions: {
                header: " ",
                cell: (row: WebhookDelivery) => (
                    <IconButton
                        icon={<ReplayIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                            e.stopPropagation();
                            void presenter.actions.resend(row.id);
                        }}
                        label="Resend delivery"
                    />
                ),
                size: 48,
                enableSorting: false,
                enableHiding: false,
                enableResizing: false
            }
        }),
        [presenter.actions]
    );

    return (
        <Drawer
            open={open}
            onOpenChange={isOpen => !isOpen && onClose()}
            title="Delivery Log"
            modal={true}
            width="900px"
            bodyPadding={false}
        >
            <div className="flex h-full">
                <div className={vm.selectedDelivery ? "flex-[1.5] border-r-sm border-neutral-muted overflow-auto" : "flex-1 overflow-auto"}>
                    <DataTable<WebhookDelivery>
                        columns={columns}
                        data={vm.list.rows}
                        loading={vm.list.pagination.loading}
                        onToggleRow={(row: WebhookDelivery) =>
                            presenter.actions.selectDelivery(row)
                        }
                    />
                </div>
                {vm.selectedDelivery && (
                    <div className="flex-1 overflow-auto">
                        <DeliveryDetail
                            delivery={vm.selectedDelivery}
                            onClose={() => presenter.actions.selectDelivery(null)}
                            onResend={id => void presenter.actions.resend(id)}
                        />
                    </div>
                )}
            </div>
        </Drawer>
    );
});
```

- [ ] **Step 3: Add useMemo to imports**

Ensure the React import includes `useMemo`:

```tsx
import React, { useMemo, useEffect } from "react";
```

- [ ] **Step 4: Check types compile**

```bash
yarn check -p @webiny/webhooks 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

Run the pre-commit checklist from CLAUDE.md, then:

```bash
git commit -m "feat(webhooks): wire delivery table and detail panel into WebhookDeliveriesDrawer"
```

---

### Task 9: Build and Verify

- [ ] **Step 1: Build the webhooks package**

```bash
yarn build -p @webiny/webhooks 2>&1 | tail -30
```

Expected: successful build with no errors.

- [ ] **Step 2: Fix any build errors**

If there are type errors or missing imports, fix them. Common issues:
- Missing icon SVGs — check `packages/icons/svgs/` and adjust imports.
- FormModel API mismatches — check `FormModelDemoPresenter.ts` for correct API.
- DataTable column type mismatches — check `DataTable.tsx` for correct `DataTableColumns` shape.

- [ ] **Step 3: Final commit**

If any fixes were needed, run the pre-commit checklist from CLAUDE.md and commit:

```bash
git commit -m "fix(webhooks): fix build errors in admin UI components"
```
