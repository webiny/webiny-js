import React, { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { Tooltip } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import omit from "lodash/omit.js";
import { prepareFormData } from "@webiny/app-headless-cms-common";
import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";
import { BulkAction, getFilesLabel } from "./useBulkActionWorker.js";
import { useFileManagerPresenter } from "../../FileManagerPresenterProvider.js";
import { UpdateFileFeature } from "~/features/updateFile/feature.js";
import { useFileModel } from "~/presentation/hooks/useFileModel.js";
import { ActionEditPresenter } from "~/presentation/FileList/components/BulkActions/ActionEditPresenter.js";
import { BatchEditorDialog } from "~/presentation/FileList/components/BulkActions/BatchEditorDialog/BatchEditorDialog.js";
import { GraphQLInputMapper } from "~/presentation/FileList/components/BulkActions/GraphQLInputMapper.js";
import type { BatchDTO } from "~/presentation/FileList/components/BulkActions/domain/index.js";
import type { FmFile } from "~/features/shared/types.js";

const { useButtons } = BulkAction;

export const BulkActionEdit = observer(function BulkActionEdit() {
    const { fields: allModelFields } = useFileModel();
    const { ButtonDefault } = useButtons();

    const { vm } = useFileManagerPresenter();
    const { useCase: updateFileUseCase } = useFeature(UpdateFileFeature);

    const { useWorker, useDialog } = BulkAction;
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const fields = allModelFields;

    const presenter = useMemo<ActionEditPresenter>(() => {
        return new ActionEditPresenter();
    }, []);

    useEffect(() => {
        presenter.load(fields);
    }, [fields]);

    const filesLabel = useMemo(() => {
        return getFilesLabel(worker.items.length);
    }, [worker.items.length]);

    const openWorkerDialog = useCallback(
        (batch: BatchDTO, modelFields: CmsModelField[]) => {
            showConfirmationDialog({
                title: "Edit files",
                message: `You are about to edit ${filesLabel}. Are you sure you want to continue?`,
                loadingLabel: `Processing ${filesLabel}`,
                execute: async () => {
                    await worker.processInSeries(async ({ item, report }) => {
                        try {
                            // Apply batch operations to the file data.
                            const modifiedFileData = GraphQLInputMapper.applyOperations(
                                item as any,
                                batch
                            ) as FmFile;

                            const output = omit(modifiedFileData, [
                                "id",
                                "createdBy",
                                "createdOn",
                                "src"
                            ]);

                            const fileData = prepareFormData(output, modelFields);

                            const result = await updateFileUseCase.execute({
                                id: item.id,
                                data: fileData
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
        },
        [filesLabel]
    );

    const onBatchEditorSubmit = useCallback(
        (batch: BatchDTO) => {
            presenter.closeEditor();
            openWorkerDialog(batch, fields);
        },
        [openWorkerDialog, fields]
    );

    if (!presenter.vm.show) {
        return null;
    }

    if (!vm.permissions.canEdit) {
        return null;
    }

    return (
        <>
            <Tooltip
                side={"bottom"}
                content={`Edit ${filesLabel}`}
                trigger={
                    <ButtonDefault
                        icon={<EditIcon />}
                        onAction={() => presenter.openEditor()}
                        size={"sm"}
                    >
                        {"Edit"}
                    </ButtonDefault>
                }
            />
            <BatchEditorDialog
                onClose={() => presenter.closeEditor()}
                fields={presenter.vm.fields}
                batch={presenter.vm.currentBatch}
                vm={presenter.vm.editorVm}
                onApply={onBatchEditorSubmit}
            />
        </>
    );
});
