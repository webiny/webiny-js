import React, { useMemo } from "react";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { observer } from "mobx-react-lite";
import { getRedirectsLabel } from "./getRedirectsLabel.js";
import { useContainer } from "@webiny/app";
import { DeleteRedirectUseCase } from "~/features/redirects/deleteRedirect/abstractions.js";
import { RedirectListConfig } from "../configs/RedirectListConfig.js";
import { useRedirectListPresenter } from "./RedirectListPresenterProvider.js";

const { useButtons, useDialog } = RedirectListConfig.Browser.BulkAction;

export const BulkActionDelete = observer(() => {
    const { ButtonDefault } = useButtons();
    const { vm, actions } = useRedirectListPresenter();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const container = useContainer();
    const deleteRedirectUseCase = container.resolve(DeleteRedirectUseCase);

    const redirectsLabel = useMemo(() => {
        return getRedirectsLabel(vm.list.selection.selectedCount);
    }, [vm.list.selection.selectedCount]);

    const openDeleteDialog = () =>
        showConfirmationDialog({
            title: "Delete redirects",
            message: `You are about to delete ${redirectsLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${redirectsLabel}...`,
            execute: async () => {
                await actions.worker.processInSeries(async ({ item, report }) => {
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

                actions.selection.deselectAll();

                showResultsDialog({
                    results: actions.worker.results,
                    title: "Delete redirects",
                    message: "Finished deleting redirects! See full report below:",
                    onCancel: actions.worker.resetResults
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
