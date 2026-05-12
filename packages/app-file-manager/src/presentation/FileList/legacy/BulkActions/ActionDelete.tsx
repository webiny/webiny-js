// @ts-nocheck
import React, { useMemo } from "react";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { observer } from "mobx-react-lite";

import { FileManagerViewConfig } from "~/presentation/config/FileManagerViewConfig.js";
import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext/index.js";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider/index.js";
import { getFilesLabel } from "~/presentation/FileList/legacy/BulkActions/BulkActions.js";

export const ActionDelete = observer(() => {
    const { deleteFile } = useFileManagerView();
    const { canDelete } = useFileManagerApi();

    const { useWorker, useButtons, useDialog } = FileManagerViewConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const filesLabel = useMemo(() => {
        return getFilesLabel(worker.items.length);
    }, [worker.items.length]);

    const canDeleteAll = useMemo(() => {
        return worker.items.every(item => canDelete(item));
    }, [worker.items]);

    const openDeleteDialog = () =>
        showConfirmationDialog({
            title: "Delete files",
            message: `You are about to delete ${filesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${filesLabel}`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        await deleteFile(item.id);

                        report.success({
                            title: `${item.name}`,
                            message: "File successfully deleted."
                        });
                    } catch (e) {
                        report.error({
                            title: `${item.name}`,
                            message: e.message
                        });
                    }
                });

                worker.resetItems();

                showResultsDialog({
                    results: worker.results,
                    title: "Delete files",
                    message: "Finished deleting files! See full report below:"
                });
            }
        });

    if (!canDeleteAll) {
        console.log("You don't have permissions to delete files.");
        return null;
    }

    return (
        <Tooltip
            side={"bottom"}
            content={`Delete ${filesLabel}`}
            trigger={
                <ButtonDefault icon={<DeleteIcon />} onAction={openDeleteDialog} size={"sm"}>
                    {`Delete`}
                </ButtonDefault>
            }
        />
    );
});
