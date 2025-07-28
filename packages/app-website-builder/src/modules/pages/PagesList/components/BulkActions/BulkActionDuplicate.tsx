import React, { useMemo } from "react";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as DuplicateIcon } from "@webiny/icons/library_add.svg";
import { observer } from "mobx-react-lite";
import { getPagesLabel } from "~/modules/pages/PagesList/components/BulkActions/BulkActions.js";
import { useDuplicatePage } from "~/features/pages/index.js";
import { PageListConfig } from "~/configs/index.js";

export const BulkActionDuplicate = observer(() => {
    const { useWorker, useButtons, useDialog } = PageListConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();

    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const { duplicatePage } = useDuplicatePage();

    const pagesLabel = useMemo(() => {
        return getPagesLabel(worker.items.length);
    }, [worker.items.length]);

    const openDuplicateDialog = () =>
        showConfirmationDialog({
            title: "Duplicate pages",
            message: `You are about to duplicate ${pagesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${pagesLabel}...`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        await duplicatePage({ id: item.id });

                        report.success({
                            title: item.properties.title,
                            message: "Page successfully duplicated."
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
                    title: "Duplicate pages",
                    message: "Finished duplicating pages! See full report below:",
                    onCancel: worker.resetResults
                });
            }
        });

    return (
        <Tooltip
            side={"bottom"}
            content={`Duplicate ${pagesLabel}`}
            trigger={
                <ButtonDefault icon={<DuplicateIcon />} onAction={openDuplicateDialog} size={"sm"}>
                    {`Duplicate`}
                </ButtonDefault>
            }
        />
    );
});
