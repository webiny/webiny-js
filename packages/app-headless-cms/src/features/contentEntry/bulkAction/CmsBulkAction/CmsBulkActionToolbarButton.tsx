import React from "react";
import { observer } from "mobx-react-lite";
import { useContainer, useFeature } from "@webiny/app";
import {
    BulkActionButton,
    useBulkActionDialog
} from "@webiny/app-admin/components/BulkActions/index.js";
import { IconRegistry } from "@webiny/app-admin/features/icons/index.js";
import { useToast } from "@webiny/admin-ui";
import { useModel } from "~/admin/hooks/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";
import { BulkActionFeature } from "../feature.js";
import type { CmsBulkAction } from "./abstractions.js";

/**
 * PascalCases a `CmsBulkAction.name` into the API trigger action, mirroring how Webiny
 * generates the `bulkAction<Model>(action: ...)` enum value (e.g. `applyDiscount` →
 * `ApplyDiscount`).
 */
const toActionName = (name: string): string => name.charAt(0).toUpperCase() + name.slice(1);

interface CmsBulkActionToolbarButtonProps {
    action: CmsBulkAction.Interface;
}

/**
 * The generated toolbar button rendered for a resolved `CmsBulkAction`. It builds the
 * framework `BulkActionCtx`, resolves the icon (string key via `IconRegistry`, or a raw
 * element), and on click either opens a confirmation dialog or triggers directly. The
 * trigger runs the (built-in or custom) entries bulk action as a background task through
 * `BulkActionFeature`.
 */
export const CmsBulkActionToolbarButton = observer(
    ({ action }: CmsBulkActionToolbarButtonProps) => {
        const container = useContainer();
        const { model } = useModel();
        const presenter = useContentEntriesPresenter();
        const { showConfirmationDialog } = useBulkActionDialog();
        const { showSuccessToast } = useToast();
        const { useCase: bulkAction } = useFeature(BulkActionFeature);

        const selection = presenter.list.vm.selection;
        const selectedItems = presenter.list.vm.rows
            .filter(row => selection.selectedIds.has(row.id))
            .map(row => ({ id: row.id }));

        // Scope the task to the selected entries. When "select all" (across pages) is active,
        // omit the filter so the task processes everything matching the current view.
        const where = selection.allSelected ? undefined : { id_in: [...selection.selectedIds] };

        const ctx: CmsBulkAction.Ctx = {
            model,
            selection,
            selectedItems,
            where,
            values: {} // TODO(phase 2): populated from the built form on submit.
        };

        const buttonSpec = action.button(ctx);
        const confirmSpec = action.confirm?.(ctx);

        const run = async () => {
            await bulkAction.execute({
                model,
                action: toActionName(action.name),
                where,
                data: action.buildData(ctx)
            });

            presenter.list.actions.selection.deselectAll();

            // Confirm the task was kicked off. Per-entry toasts then arrive over websockets
            // (see the action's `notifications`), handled by the generated event handlers.
            showSuccessToast({
                title: `${buttonSpec.text} started`,
                description: `Running for ${selection.label} in the background. You can keep working.`
            });
        };

        const onClick = () => {
            if (confirmSpec) {
                showConfirmationDialog({
                    title: confirmSpec.title,
                    message: confirmSpec.message,
                    loadingLabel: confirmSpec.loadingLabel,
                    execute: run
                });
                return;
            }

            // TODO(phase 2): form path — open a form dialog (formTitle/buildForm), collect
            // values into `ctx.values`, then run.

            run();
        };

        let icon: React.ReactElement | undefined;
        if (typeof action.icon === "string") {
            const Component = container.resolve(IconRegistry).get(action.icon);
            icon = Component ? <Component /> : undefined;
        } else {
            icon = action.icon;
        }

        return (
            <BulkActionButton
                text={buttonSpec.text}
                tooltipContent={buttonSpec.tooltip}
                icon={icon}
                onClick={onClick}
            />
        );
    }
);
