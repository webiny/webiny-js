import React, { useMemo } from "react";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { BulkAction, getFilesLabel } from "./useBulkActionWorker.js";
import { useFileManagerPresenter } from "../../FileManagerPresenterProvider.js";
import { DeleteFileFeature } from "~/features/deleteFile/feature.js";

export const BulkActionDelete = observer(function BulkActionDelete() {
    const { useWorker, useButtons, useDialog } = BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const { vm } = useFileManagerPresenter();
    const { useCase: deleteFileUseCase } = useFeature(DeleteFileFeature);

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
                        const result = await deleteFileUseCase.execute({ id: item.id });

                        if (!result.success) {
                            report.error({
                                title: `${item.name}`,
                                message: result.error.message
                            });
                            return;
                        }

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
