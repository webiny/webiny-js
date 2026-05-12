// @ts-nocheck
import { useMemo } from "react";
import omit from "lodash/omit.js";
import type { FileItem } from "~/domain/types.js";
import { prepareFormData } from "@webiny/app-headless-cms-common";
import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";
import type { BatchDTO } from "~/presentation/FileList/legacy/BulkActions/ActionEdit/domain/index.js";
import { GraphQLInputMapper } from "~/presentation/FileList/legacy/BulkActions/ActionEdit/GraphQLInputMapper.js";
import { useFeature } from "@webiny/app";
import { UpdateFileFeature } from "~/features/updateFile/feature.js";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";
import { getFilesLabel } from "~/presentation/FileList/legacy/BulkActions/index.js";
import { FileManagerViewConfig } from "~/presentation/config/FileManagerViewConfig.js";

const { useWorker, useDialog: useBulkActionDialog } = FileManagerViewConfig.Browser.BulkAction;

export function useActionEditWorker(fields: CmsModelField[]) {
    const { useCase: updateFileUseCase } = useFeature(UpdateFileFeature);
    const { vm } = useFileManagerPresenter();
    const { showConfirmationDialog, showResultsDialog } = useBulkActionDialog();
    const worker = useWorker();

    const filesLabel = useMemo(() => {
        return getFilesLabel(worker.items.length);
    }, [worker.items.length]);

    const canEditAll = vm.permissions.canEdit;

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

                        await updateFileUseCase.execute({ id: item.id, data: fileData });

                        report.success({
                            title: `${item.name}`,
                            message: "File successfully edited."
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
                    title: "Edit files",
                    message: "Finished editing files! See full report below:"
                });
            }
        });
    };

    return { filesLabel, canEditAll, openWorkerDialog };
}
