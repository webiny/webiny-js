import React, { useCallback, useMemo } from "react";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import { type NodeDto, Tooltip } from "@webiny/admin-ui";
import { useMoveToFolderDialog, useNavigateFolder } from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { getRedirectsLabel } from "~/modules/redirects/RedirectsList/components/BulkActions/BulkActions.js";
import { ROOT_FOLDER } from "~/constants.js";
import { RedirectListConfig } from "~/modules/redirects/configs/index.js";
import { useContainer } from "@webiny/app";
import { MoveRedirectUseCase } from "~/features/redirects/moveRedirect/abstractions.js";

export const BulkActionMove = observer(() => {
    const { useWorker, useButtons, useDialog } = RedirectListConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();

    const { showConfirmationDialog, showResultsDialog } = useDialog();
    const { showDialog: showMoveDialog } = useMoveToFolderDialog();

    const container = useContainer();
    const moveRedirectUseCase = container.resolve(MoveRedirectUseCase);
    const { currentFolderId } = useNavigateFolder();

    const redirectsLabel = useMemo(() => {
        return getRedirectsLabel(worker.items.length);
    }, [worker.items.length]);

    const openWorkerDialog = useCallback(
        (folder: NodeDto) => {
            showConfirmationDialog({
                title: "Move redirects",
                message: `You are about to move ${redirectsLabel} to ${folder.label}. Are you sure you want to continue?`,
                loadingLabel: `Processing ${redirectsLabel}...`,
                execute: async () => {
                    await worker.processInSeries(async ({ item, report }) => {
                        try {
                            await moveRedirectUseCase.execute({
                                id: item.id,
                                folderId: folder.id
                            });

                            report.success({
                                title: item.redirectFrom,
                                message: "Redirect successfully moved."
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
                        title: "Move redirects",
                        message: "Finished moving redirects! See full report below:",
                        onCancel: worker.resetResults
                    });
                }
            });
        },
        [redirectsLabel]
    );

    const openMoveDialog = () =>
        showMoveDialog({
            title: "Select folder",
            message: "Select a new location for selected redirects:",
            loadingLabel: `Processing ${redirectsLabel}...`,
            acceptLabel: `Move`,
            focusedFolderId: currentFolderId || ROOT_FOLDER,
            async onAccept({ folder }) {
                openWorkerDialog(folder);
            }
        });

    return (
        <Tooltip
            side={"bottom"}
            content={`Move ${redirectsLabel}`}
            trigger={
                <ButtonDefault icon={<MoveIcon />} onAction={openMoveDialog} size={"sm"}>
                    {`Move`}
                </ButtonDefault>
            }
        />
    );
});
