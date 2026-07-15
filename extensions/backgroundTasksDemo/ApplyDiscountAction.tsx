import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as DiscountIcon } from "webiny/admin/icons/discount.svg";
import { BulkActionButton, useBulkActionDialog, useFeature } from "webiny/admin";
import { useModel } from "webiny/admin/cms";
import { BulkActionFeature, useContentEntriesPresenter } from "webiny/admin/cms/entry/list";

/**
 * The "Apply Discount" bulk action button, shown in the Products content entry list
 * whenever one or more entries are selected.
 *
 * `BulkActionFeature` resolves the `BulkActionUseCase`, whose `execute()` fires the
 * GraphQL mutation that triggers the background task Webiny generated from our
 * `ApplyDiscountBulkAction` (API side). The browser does NOT loop over entries — the
 * whole selection is handed to the API and processed server-side, in the background.
 * The user can navigate away while it runs and follow progress in the Background Tasks
 * screen.
 */
const DISCOUNT_PERCENT = 10;

export const ApplyDiscountAction = observer(() => {
    const { model } = useModel();
    const presenter = useContentEntriesPresenter();
    const { showConfirmationDialog } = useBulkActionDialog();
    const { useCase: bulkAction } = useFeature(BulkActionFeature);

    const selection = presenter.list.vm.selection;
    const selectedItems = presenter.list.vm.rows.filter(row => selection.selectedIds.has(row.id));

    const openDialog = () =>
        showConfirmationDialog({
            title: "Apply discount",
            message: `Apply a ${DISCOUNT_PERCENT}% discount to ${selection.label}? This runs as a background task, so you can keep working while it processes.`,
            loadingLabel: `Processing ${selection.label}`,
            execute: async () => {
                // Scope the task to the selected entries. When "select all" (across
                // pages) is active, omit the filter so the task processes everything
                // matching the current view.
                const where = selection.allSelected
                    ? undefined
                    : { id_in: selectedItems.map(item => item.id) };

                await bulkAction.execute({
                    model,
                    action: "ApplyDiscount",
                    where,
                    data: { percent: DISCOUNT_PERCENT }
                });

                presenter.list.actions.selection.deselectAll();
            }
        });

    return (
        <BulkActionButton
            text={`Apply -${DISCOUNT_PERCENT}%`}
            tooltipContent={`Apply ${DISCOUNT_PERCENT}% discount to ${selection.label}`}
            icon={<DiscountIcon />}
            onClick={openDialog}
        />
    );
});
