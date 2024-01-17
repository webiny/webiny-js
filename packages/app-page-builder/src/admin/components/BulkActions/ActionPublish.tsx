import React, { useMemo } from "react";
import { ReactComponent as PublishIcon } from "@material-design-icons/svg/outlined/publish.svg";
import {useFolders, useRecords} from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { PageListConfig } from "~/admin/config/pages";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { usePagesPermissions } from "~/hooks/permissions";
import { getPagesLabel } from "~/admin/components/BulkActions/BulkActions";

export const ActionPublish = observer(() => {
    const { canPublish } = usePagesPermissions();
    const { publishPage, client } = useAdminPageBuilder();
    const { getRecord } = useRecords();
    const { folderLevelPermissions: flp } = useFolders();

    const { useWorker, useButtons, useDialog } = PageListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const canPublishAll = useMemo(() => {
        return worker.items.every(item => {
            return canPublish() && flp.canManageContent(item.location?.folderId);
        });
    }, [worker.items]);

    const pagesLabel = useMemo(() => {
        return getPagesLabel(worker.items.length);
    }, [worker.items.length]);

    const openPublishPagesDialog = () =>
        showConfirmationDialog({
            title: "Publish pages",
            message: `You are about to publish ${pagesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${pagesLabel}`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        const response = await publishPage(
                            { id: item.data.id },
                            {
                                client: client
                            }
                        );

                        const { error, page } = response;

                        if (error) {
                            throw new Error(
                                error.message || "Unknown error while publishing the pages"
                            );
                        }

                        await getRecord(page.id);

                        report.success({
                            title: `${item.data.title}`,
                            message: "Page successfully published."
                        });
                    } catch (e) {
                        report.error({
                            title: `${item.data.title}`,
                            message: e.message
                        });
                    }
                });

                worker.resetItems();

                showResultsDialog({
                    results: worker.results,
                    title: "Publish pages",
                    message: "Finished publishing pages! See full report below:"
                });
            }
        });

    if (!canPublishAll) {
        console.log("You don't have permissions to publish pages.");
        return null;
    }

    return (
        <IconButton
            icon={<PublishIcon />}
            onAction={openPublishPagesDialog}
            label={`Publish ${pagesLabel}`}
            tooltipPlacement={"bottom"}
        />
    );
});
