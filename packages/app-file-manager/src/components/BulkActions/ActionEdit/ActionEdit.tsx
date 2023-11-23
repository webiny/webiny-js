import React, { useCallback, useEffect, useMemo } from "react";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/outlined/edit.svg";
import { prepareFormData } from "@webiny/app-headless-cms-common";
import { observer } from "mobx-react-lite";
import omit from "lodash/omit";

import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";
import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";

import { useFileModel } from "~/hooks/useFileModel";
import { getFilesLabel } from "~/components/BulkActions";
import { GraphQLInputMapper } from "~/components/BulkActions/ActionEdit/GraphQLInputMapper";
import { BatchDTO } from "~/components/BulkActions/ActionEdit/domain";

import { BatchEditorDialog } from "./BatchEditorDialog";
import { ActionEditPresenter } from "./ActionEditPresenter";

export const ActionEdit = observer(() => {
    const { fields: defaultFields } = useFileModel();
    const {
        useWorker,
        useButtons,
        useDialog: useBulkActionDialog
    } = FileManagerViewConfig.Browser.BulkAction;
    const worker = useWorker();
    const { updateFile } = useFileManagerView();
    const { canEdit } = useFileManagerApi();
    const { IconButton } = useButtons();
    const { showConfirmationDialog, showResultsDialog } = useBulkActionDialog();

    const presenter = useMemo<ActionEditPresenter>(() => {
        return new ActionEditPresenter();
    }, []);

    useEffect(() => {
        presenter.load(defaultFields);
    }, [defaultFields]);

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
                        const extensions = defaultFields.find(
                            field => field.fieldId === "extensions"
                        );

                        const extensionsData = GraphQLInputMapper.toGraphQLExtensions(
                            item.extensions,
                            batch
                        );

                        const output = omit(item, ["id", "createdBy", "createdOn", "src"]);

                        const fileData = {
                            ...output,
                            extensions: prepareFormData(
                                extensionsData,
                                extensions?.settings?.fields || []
                            )
                        };

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

    const onBatchEditorSubmit = useCallback(
        (batch: BatchDTO) => {
            presenter.closeEditor();
            openWorkerDialog(batch);
        },
        [openWorkerDialog]
    );

    if (!presenter.vm.show) {
        return null;
    }

    if (!canEditAll) {
        console.log("You don't have permissions to edit files.");
        return null;
    }

    return (
        <>
            <IconButton
                icon={<EditIcon />}
                onAction={() => presenter.openEditor()}
                label={`Edit ${filesLabel}`}
                tooltipPlacement={"bottom"}
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
