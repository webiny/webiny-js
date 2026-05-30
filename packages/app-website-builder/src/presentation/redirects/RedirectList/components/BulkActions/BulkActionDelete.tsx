import React, { useMemo } from "react";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { observer } from "mobx-react-lite";
import { getRedirectsLabel } from "./index.js";
import { useContainer } from "@webiny/app";
import { DeleteRedirectUseCase } from "~/features/redirects/deleteRedirect/abstractions.js";
import { RedirectListConfig } from "../../configs/RedirectListConfig.js";

const { useWorker, useButtons, useDialog } = RedirectListConfig.Browser.BulkAction;

export const BulkActionDelete = observer(() => {
    const { ButtonDefault } = useButtons();
    const worker = useWorker();

    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const container = useContainer();
    const deleteRedirectUseCase = container.resolve(DeleteRedirectUseCase);

    const redirectsLabel = useMemo(() => {
        return getRedirectsLabel(worker.items.length);
    }, [worker.items.length]);

    const openDeleteDialog = () =>
        showConfirmationDialog({
            title: "Delete redirects",
            message: `You are about to delete ${redirectsLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${redirectsLabel}...`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        await deleteRedirectUseCase.execute({ id: item.id });

                        report.success({
                            title: item.redirectFrom,
                            message: "Redirect successfully deleted."
                        });
                    } catch (e) {
                        report.error({
                            title: item.redirectFrom,
                            message: e.message
                        });
                    }
                });

                worker.resetItems();

                showResultsDialog({
                    results: worker.results,
                    title: "Delete redirects",
                    message: "Finished deleting redirects! See full report below:",
                    onCancel: worker.resetResults
                });
            }
        });

    return (
        <Tooltip
            side={"bottom"}
            content={`Delete ${redirectsLabel}`}
            trigger={
                <ButtonDefault icon={<DeleteIcon />} onAction={openDeleteDialog} size={"sm"}>
                    {`Delete`}
                </ButtonDefault>
            }
        />
    );
});
