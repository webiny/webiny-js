import React, { useCallback } from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { FileUpload } from "./components/FileUpload.js";
import { Errors } from "./components/Errors.js";
import { DataList } from "./components/DataList.js";
import { DataListInstructions } from "./components/Model/DataListInstructions.js";
import { ImportContextProvider } from "~/admin/views/contentModels/importing/ImportContext.js";
import { Dialog, Loader } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/views/content-models/import-content-models-dialog");

export interface ImportContentModelsDialogProps {
    onClose: () => void;
}

export const ImportContentModelsDialog = (props: ImportContentModelsDialogProps) => {
    const { onClose } = props;

    const onCloseClick = useCallback(() => {
        window.location.reload();
        onClose();
    }, [onClose]);

    return (
        <ImportContextProvider>
            {({
                loading,
                errors,
                validated,
                handleModelsImport,
                hasSelected,
                handleModelsValidation,
                file
            }) => {
                const onClick = validated ? handleModelsImport : handleModelsValidation;

                const disabledConfirm =
                    errors.length > 0 || loading || !file || (validated && !hasSelected());

                return (
                    <Dialog
                        open={true}
                        onClose={onCloseClick}
                        data-testid="cms-import-content-models-modal"
                        title={t`Import Content Models`}
                        actions={
                            <Dialog.ConfirmAction
                                onClick={onClick}
                                text={validated ? t`Import` : t`Validate file`}
                                disabled={disabledConfirm}
                            />
                        }
                    >
                        {loading ? (
                            <Loader text={"Loading..."} />
                        ) : (
                            <>
                                <FileUpload />
                                <div className={"max-h-[50dvh] overflow-auto"}>
                                    {validated && <DataListInstructions />}
                                    <Errors errors={errors} />
                                    <DataList />
                                </div>
                            </>
                        )}
                    </Dialog>
                );
            }}
        </ImportContextProvider>
    );
};
