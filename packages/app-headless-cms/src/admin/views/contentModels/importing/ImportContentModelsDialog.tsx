import React, { useCallback } from "react";
import { CircularProgress } from "@webiny/ui/Progress";
import * as UID from "@webiny/ui/Dialog";
import { Dialog } from "~/admin/components/Dialog";
import { i18n } from "@webiny/app/i18n";
import { ImportButton } from "./components/ImportButton";
import { FileUpload } from "./components/FileUpload";
import { Errors } from "./components/Errors";
import { DataList } from "./components/DataList";
import { DataListInstructions } from "./components/Model/DataListInstructions";
import { ImportContextProvider } from "~/admin/views/contentModels/importing/ImportContext";

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
                return (
                    <Dialog
                        open={true}
                        onClose={onCloseClick}
                        data-testid="cms-import-content-models-modal"
                    >
                        {loading && <CircularProgress label={"Loading..."} />}
                        <UID.DialogTitle>{t`Import Content Models`}</UID.DialogTitle>
                        <UID.DialogContent>
                            <FileUpload />
                            {validated && <DataListInstructions />}
                            <Errors errors={errors} />
                            <DataList />
                        </UID.DialogContent>
                        <UID.DialogActions>
                            <ImportButton
                                onClick={onClick}
                                validated={validated}
                                disabled={
                                    errors.length > 0 ||
                                    loading ||
                                    !file ||
                                    (validated && !hasSelected())
                                }
                            />
                        </UID.DialogActions>
                    </Dialog>
                );
            }}
        </ImportContextProvider>
    );
};
