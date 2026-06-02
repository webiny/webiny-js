import React, { useCallback } from "react";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import { useMoveToFolderDialog } from "@webiny/app-aco";
import { useSnackbar, useFeature } from "@webiny/app-admin";
import { observer } from "mobx-react-lite";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { ROOT_FOLDER } from "~/admin/constants.js";
import { useModel } from "~/admin/hooks/index.js";
import { MoveEntryFeature } from "~/features/contentEntry/moveEntry/feature.js";
import type { IMoveEntryUseCase } from "~/features/contentEntry/moveEntry/abstractions.js";
import { getEntriesLabel } from "~/admin/components/ContentEntries/BulkActions/BulkActions.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";
import { type NodeDto, Tooltip } from "@webiny/admin-ui";

export const ActionMove = observer(() => {
    const { model } = useModel();
    const { useCase: moveEntryUseCase } = useFeature(MoveEntryFeature) as {
        useCase: IMoveEntryUseCase;
    };
    const presenter = useContentEntriesPresenter();
    const { showSnackbar } = useSnackbar();

    const { useWorker, useButtons, useDialog } = ContentEntryListConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();
    const { showDialog: showMoveDialog } = useMoveToFolderDialog();

    const entriesLabel = getEntriesLabel();
    const currentFolderId = presenter.foldersPresenter.vm.currentFolderId;

    const openWorkerDialog = useCallback(
        (folder: NodeDto) => {
            showConfirmationDialog({
                title: "Move entries",
                message: `You are about to move ${entriesLabel} to ${folder.label}. Are you sure you want to continue?`,
                loadingLabel: `Processing ${entriesLabel}`,
                execute: async () => {
                    if (worker.isSelectedAll) {
                        await worker.processInBulk({
                            action: "MoveToFolder",
                            where: {
                                wbyAco_location: {
                                    folderId_not: folder.id
                                }
                            },
                            data: {
                                folderId: folder.id
                            }
                        });
                        worker.resetItems();
                        showSnackbar(
                            `All entries will be moved to ${folder.label}. This process will be carried out in the background and may take some time. You can safely navigate away from this page while the process is running.`,
                            {
                                dismissIcon: true,
                                timeout: -1
                            }
                        );
                        return;
                    }

                    await worker.processInSeries(async ({ item, report }) => {
                        try {
                            await moveEntryUseCase.execute({
                                model,
                                id: item.id,
                                folderId: folder.id
                            });

                            report.success({
                                title: `${item.meta.title}`,
                                message: "Entry successfully moved."
                            });
                        } catch (e) {
                            report.error({
                                title: `${item.meta.title}`,
                                message: e.message
                            });
                        }
                    });

                    worker.resetItems();
                    await presenter.listPresenter.actions.refresh();

                    showResultsDialog({
                        results: worker.results,
                        title: "Move entries",
                        message: "Finished moving entries! See full report below:"
                    });
                }
            });
        },
        [entriesLabel, worker.isSelectedAll]
    );

    const openMoveEntriesDialog = () =>
        showMoveDialog({
            title: "Select folder",
            message: "Select a new location for selected entries:",
            loadingLabel: `Processing ${entriesLabel}`,
            acceptLabel: `Move`,
            focusedFolderId: currentFolderId || ROOT_FOLDER,
            async onAccept({ folder }) {
                openWorkerDialog(folder);
            }
        });

    return (
        <Tooltip
            side={"bottom"}
            content={`Move ${entriesLabel}`}
            trigger={
                <ButtonDefault icon={<MoveIcon />} onAction={openMoveEntriesDialog} size={"sm"}>
                    {"Move"}
                </ButtonDefault>
            }
        />
    );
});
