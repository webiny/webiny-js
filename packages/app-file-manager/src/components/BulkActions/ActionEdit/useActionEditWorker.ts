import { useMemo } from "react";
import omit from "lodash/omit";
import { FileItem } from "@webiny/app-admin/types";
import { prepareFormData } from "@webiny/app-headless-cms-common";
import { CmsModelField } from "@webiny/app-headless-cms-common/types";
import { BatchDTO } from "~/components/BulkActions/ActionEdit/domain";
import { GraphQLInputMapper } from "~/components/BulkActions/ActionEdit/GraphQLInputMapper";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import { getFilesLabel } from "~/components/BulkActions";
import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";

const { useWorker, useDialog: useBulkActionDialog } = FileManagerViewConfig.Browser.BulkAction;

export function useActionEditWorker(fields: CmsModelField[]) {
    const { updateFile } = useFileManagerView();
    const { showConfirmationDialog, showResultsDialog } = useBulkActionDialog();
    const worker = useWorker();
    const { canEdit } = useFileManagerApi();

    const filesLabel = useMemo(() => {
        return getFilesLabel(worker.items.length);
    }, [worker.items.length]);

    const canEditAll = useMemo(() => {
        return worker.items.every(item => canEdit(item));
    }, [worker.items]);

    const openWorkerDialog = (batch: BatchDTO) => {
        showConfirmationDialog({
            title: "Edit files",
            message: `You are about to edit ${filesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${filesLabel}`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        const modifiedFileData = GraphQLInputMapper.applyOperations(
                            item,
                            batch
                        ) as FileItem;

                        const output = omit(modifiedFileData, [
                            "id",
                            "createdBy",
                            "createdOn",
                            "src"
                        ]);

                        const fileData = prepareFormData(output, fields);

                        await updateFile(item.id, fileData);

                        report.success({
                            title: `${item.name}`,
                            message: "File successfully edited."
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
                    title: "Edit files",
                    message: "Finished editing files! See full report below:"
                });
            }
        });
    };

    return { filesLabel, canEditAll, openWorkerDialog };
}
