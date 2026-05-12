import React, { useMemo } from "react";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";

import { FileManagerViewConfig } from "~/presentation/config/FileManagerViewConfig.js";
import { DeleteFileFeature } from "~/features/deleteFile/feature.js";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";
import { getFilesLabel } from "~/presentation/FileList/legacy/BulkActions/BulkActions.js";

export const ActionDelete = observer(() => {
    const { useCase: deleteFileUseCase } = useFeature(DeleteFileFeature);
    const { vm } = useFileManagerPresenter();

    const { useWorker, useButtons, useDialog } = FileManagerViewConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const filesLabel = useMemo(() => {
        return getFilesLabel(worker.items.length);
    }, [worker.items.length]);

    const openDeleteDialog = () =>
        showConfirmationDialog({
            title: "Delete files",
            message: `You are about to delete ${filesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${filesLabel}`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        await deleteFileUseCase.execute({ id: item.id });

                        report.success({
                            title: `${item.name}`,
                            message: "File successfully deleted."
                        });
                    } catch (e) {
                        report.error({
                            title: `${item.name}`,
                            message: (e as Error).message
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

    if (!vm.permissions.canDelete) {
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
