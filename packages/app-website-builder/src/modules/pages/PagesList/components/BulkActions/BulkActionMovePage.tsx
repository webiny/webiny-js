import React, { useCallback, useMemo } from "react";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import { type NodeDto, Tooltip } from "@webiny/admin-ui";
import { useMoveToFolderDialog, useNavigateFolder } from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { getPagesLabel } from "~/modules/pages/PagesList/components/BulkActions/BulkActions.js";
import { useMovePage } from "~/features/pages/index.js";
import { ROOT_FOLDER } from "~/constants";
import { PageListConfig } from "~/configs/index.js";

export const BulkActionMovePage = observer(() => {
    const { useWorker, useButtons, useDialog } = PageListConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();

    const { showConfirmationDialog, showResultsDialog } = useDialog();
    const { showDialog: showMoveDialog } = useMoveToFolderDialog();

    const { movePage } = useMovePage();
    const { currentFolderId } = useNavigateFolder();

    const pagesLabel = useMemo(() => {
        return getPagesLabel(worker.items.length);
    }, [worker.items.length]);

    const openWorkerDialog = useCallback(
        (folder: NodeDto) => {
            showConfirmationDialog({
                title: "Move pages",
                message: `You are about to move ${pagesLabel} to ${folder.label}. Are you sure you want to continue?`,
                loadingLabel: `Processing ${pagesLabel}...`,
                execute: async () => {
                    await worker.processInSeries(async ({ item, report }) => {
                        try {
                            await movePage({
                                id: item.id,
                                folderId: folder.id
                            });

                            report.success({
                                title: item.properties.title,
                                message: "Page successfully moved."
                            });
                        } catch (e) {
                            report.error({
                                title: item.properties.title,
                                message: e.message
                            });
                        }
                    });

                    worker.resetItems();

                    showResultsDialog({
                        results: worker.results,
                        title: "Move pages",
                        message: "Finished moving pages! See full report below:",
                        onCancel: worker.resetResults
                    });
                }
            });
        },
        [pagesLabel]
    );

    const openMoveDialog = () =>
        showMoveDialog({
            title: "Select folder",
            message: "Select a new location for selected pages:",
            loadingLabel: `Processing ${pagesLabel}...`,
            acceptLabel: `Move`,
            focusedFolderId: currentFolderId || ROOT_FOLDER,
            async onAccept({ folder }) {
                openWorkerDialog(folder);
            }
        });

    return (
        <Tooltip
            side={"bottom"}
            content={`Move ${pagesLabel}`}
            trigger={
                <ButtonDefault icon={<MoveIcon />} onAction={openMoveDialog} size={"sm"}>
                    {`Move`}
                </ButtonDefault>
            }
        />
    );
});
