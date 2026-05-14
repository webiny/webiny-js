import React, { useCallback, useMemo } from "react";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import { type NodeDto, Tooltip } from "@webiny/admin-ui";
import { useMoveToFolderDialog } from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { BulkAction, getFilesLabel } from "./useBulkActionWorker.js";
import { useFileManagerPresenter } from "../../FileManagerPresenterProvider.js";
import { UpdateFileFeature } from "~/features/updateFile/feature.js";
import { ROOT_FOLDER } from "~/domain/constants.js";

export const BulkActionMove = observer(function BulkActionMove() {
    const { useWorker, useButtons, useDialog } = BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();
    const { showDialog: showMoveDialog } = useMoveToFolderDialog();

    const { vm } = useFileManagerPresenter();
    const { useCase: updateFileUseCase } = useFeature(UpdateFileFeature);

    const currentFolderId = vm.folders.currentFolderId;

    const filesLabel = useMemo(() => {
        return getFilesLabel(worker.items.length);
    }, [worker.items.length]);

    const openWorkerDialog = useCallback(
        (folder: NodeDto) => {
            showConfirmationDialog({
                title: "Move files",
                message: `You are about to move ${filesLabel} to ${folder.label}. Are you sure you want to continue?`,
                loadingLabel: `Processing ${filesLabel}`,
                execute: async () => {
                    await worker.processInSeries(async ({ item, report }) => {
                        try {
                            const result = await updateFileUseCase.execute({
                                id: item.id,
                                data: { location: { folderId: folder.id } }
                            });

                            if (!result.success) {
                                report.error({
                                    title: `${item.name}`,
                                    message: result.error.message
                                });
                                return;
                            }

                            report.success({
                                title: `${item.name}`,
                                message: "File successfully moved."
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
                        title: "Move files",
                        message: "Finished moving files! See full report below:"
                    });
                }
            });
        },
        [filesLabel]
    );

    const openMoveDialog = () =>
        showMoveDialog({
            title: "Select folder",
            message: "Select a new location for selected files:",
            loadingLabel: `Processing ${filesLabel}`,
            acceptLabel: `Move`,
            focusedFolderId: currentFolderId || ROOT_FOLDER,
            async onAccept({ folder }) {
                openWorkerDialog(folder);
            }
        });

    return (
        <Tooltip
            side={"bottom"}
            content={`Move ${filesLabel}`}
            trigger={
                <ButtonDefault icon={<MoveIcon />} onAction={openMoveDialog} size={"sm"}>
                    {`Move`}
                </ButtonDefault>
            }
        />
    );
});
