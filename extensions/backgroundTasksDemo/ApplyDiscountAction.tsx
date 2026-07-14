import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as DiscountIcon } from "@webiny/icons/discount.svg";
import { ContentEntryListConfig } from "webiny/admin/cms/entry/list";

/**
 * The "Apply Discount" bulk action button, shown in the Products content entry list
 * whenever one or more entries are selected.
 *
 * `worker.processInBulk({ action, where, data })` fires the GraphQL mutation that
 * triggers the background task Webiny generated from our `ApplyDiscountBulkAction`.
 * The browser does NOT loop over entries — it hands the whole selection to the API and
 * the work happens server-side, in the background. The user can navigate away while it
 * runs, and follow progress in the Background Tasks screen.
 */
const DISCOUNT_PERCENT = 10;

export const ApplyDiscountAction = observer(() => {
    const { useWorker, useButtons, useDialog } = ContentEntryListConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog } = useDialog();

    const count = worker.items.length;

    const openDialog = () =>
        showConfirmationDialog({
            title: "Apply discount",
            message: `Apply a ${DISCOUNT_PERCENT}% discount to ${count} selected product(s)? This runs as a background task, so you can keep working while it processes.`,
            loadingLabel: "Starting background task…",
            execute: async () => {
                // Scope the task to exactly the selected entries. When "select all"
                // (across pages) is active, we omit the filter and let the task process
                // everything matching the current view.
                const where = worker.isSelectedAll
                    ? undefined
                    : { entryId_in: worker.items.map(item => item.entryId) };

                await worker.processInBulk({
                    action: "ApplyDiscount",
                    where,
                    data: { percent: DISCOUNT_PERCENT }
                });

                worker.resetItems();
            }
        });

    return (
        <ButtonDefault icon={<DiscountIcon />} onAction={openDialog} size={"sm"}>
            {`Apply -${DISCOUNT_PERCENT}%`}
        </ButtonDefault>
    );
});
