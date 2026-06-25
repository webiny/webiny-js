import React, { useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { i18n } from "@webiny/app/i18n/index.js";
import { FileUpload } from "./components/FileUpload.js";
import { Errors } from "./components/Errors.js";
import { DataList } from "./components/DataList.js";
import { DataListInstructions } from "./components/Model/DataListInstructions.js";
import { Dialog, Loader } from "@webiny/admin-ui";
import { useImportContentModelsPresenter } from "./useImportContentModelsPresenter.js";

const t = i18n.ns("app-headless-cms/admin/views/content-models/import-content-models-dialog");

export interface ImportContentModelsDialogProps {
    onClose: () => void;
}

export const ImportContentModelsDialog = observer((props: ImportContentModelsDialogProps) => {
    const { onClose } = props;
    const presenter = useImportContentModelsPresenter();
    const { vm } = presenter;

    useEffect(() => {
        return () => {
            presenter.reset();
        };
    }, []);

    const onCloseClick = useCallback(() => {
        window.location.reload();
        onClose();
    }, [onClose]);

    const onClick = vm.validated
        ? () => presenter.handleModelsImport()
        : () => presenter.handleModelsValidation();

    const disabledConfirm =
        vm.errors.length > 0 ||
        vm.loading ||
        !vm.file ||
        (vm.validated && !presenter.hasSelected());

    return (
        <Dialog
            open={true}
            onClose={onCloseClick}
            data-testid="cms-import-content-models-modal"
            title={t`Import Content Models`}
            actions={
                <Dialog.ConfirmAction
                    onClick={onClick}
                    text={vm.validated ? t`Import` : t`Validate file`}
                    disabled={disabledConfirm}
                />
            }
        >
            {vm.loading ? (
                <Loader text={"Loading..."} />
            ) : (
                <>
                    <FileUpload />
                    <div className={"max-h-[50dvh] overflow-auto"}>
                        {vm.validated && <DataListInstructions />}
                        <Errors errors={vm.errors} />
                        <DataList />
                    </div>
                </>
            )}
        </Dialog>
    );
});
