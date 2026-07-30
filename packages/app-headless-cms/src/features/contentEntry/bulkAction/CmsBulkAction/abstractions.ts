import React from "react";
import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel } from "~/types.js";

// ---------------------------------------------------------------------------
// Framework-built context handed to every callback.
// ---------------------------------------------------------------------------

export interface BulkActionCtx<TData = any> {
    model: CmsModel;
    selection: {
        selectedIds: Set<string>;
        selectedCount: number;
        allSelected: boolean;
        label: string;
    };
    selectedItems: { id: string }[];
    // Standard scope the framework pre-computes (allSelected ? undefined : { id_in }).
    where: Record<string, unknown> | undefined;
    // Values collected from the built form. Empty object for confirm/simple actions.
    // TODO(phase 2): populated from the built FormModel on submit.
    values: TData;
}

export interface NotificationSpec {
    variant: "success" | "info" | "warning" | "danger";
    title: string;
    description?: string;
}

export interface ConfirmSpec {
    title: string;
    message: string;
    loadingLabel?: string;
}

// ---------------------------------------------------------------------------
// The admin-side bulk-action abstraction. Users implement it and register with
// `createImplementation`, exactly like the API-side `EntriesBulkAction`.
// ---------------------------------------------------------------------------

export interface ICmsBulkAction<TData = any> {
    // Matches the API `EntriesBulkAction.name`; PascalCased into the trigger action.
    readonly name: string;
    // Restrict the button to specific models (optional).
    readonly modelIds?: string[];
    // IconRegistry key (string) or a raw icon element (escape hatch).
    readonly icon?: string | React.ReactElement;

    button(ctx: BulkActionCtx<TData>): { text: string; tooltip?: string };

    // Plain confirmation dialog. Omit for a direct (no-confirm) trigger.
    confirm?(ctx: BulkActionCtx<TData>): ConfirmSpec;

    // TODO(phase 2): form path — `formTitle(ctx)` + `buildForm(form, ctx)` (the FormModel
    // `buildForm` builder convention). When present, the framework opens a form dialog and
    // hands the collected values to `buildData` via `ctx.values`.

    // The trigger payload (the "mapFromForm" equivalent): `ctx.values` holds the collected
    // form data (empty object in phase 1).
    buildData(ctx: BulkActionCtx<TData>): TData;

    // Action-key → notification. The framework generates one WebsocketEventHandler per entry
    // and shows the toast via `Notifications`.
    readonly notifications?: Record<string, (data: any) => NotificationSpec>;
}

export const CmsBulkAction = createAbstraction<ICmsBulkAction>("Cms/BulkAction");

export namespace CmsBulkAction {
    export type Interface<TData = any> = ICmsBulkAction<TData>;
    export type Ctx<TData = any> = BulkActionCtx<TData>;
    export type Notification = NotificationSpec;
    export type Confirm = ConfirmSpec;
}
