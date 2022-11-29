import { useSnackbar } from "@webiny/app-admin";
import React, { useEffect, useState } from "react";
import { i18n } from "@webiny/app/i18n";
import { FolderItem } from "~/types";
import { useFolders } from "~/hooks";
import { DialogContent, DialogOnClose, DialogTitle } from "@webiny/ui/Dialog";
import { DialogContainer, DialogActions } from "./styled";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";

const t = i18n.ns("app-headless-cms/app-page-builder/page-details/header/delete-page");

type Props = {
    folder: FolderItem;
    open: boolean;
    onClose: DialogOnClose;
};

export const FolderDialogDelete = ({ folder, open, onClose }: Props) => {
    const { deleteFolder, loading } = useFolders(folder.type);
    const { showSnackbar } = useSnackbar();
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        setDialogOpen(open);
    }, [open]);

    const onSubmit = async () => {
        try {
            const result = await deleteFolder(folder);

            if (result) {
                setDialogOpen(false);
                showSnackbar(
                    t`The folder "{name}" was deleted successfully.`({
                        name: `${
                            folder.name.length > 20
                                ? folder.name.slice(0, 20).concat("...")
                                : folder.name
                        }`
                    })
                );
            } else {
                throw new Error(
                    t`Error while deleting page "{name}"!`({
                        name: `${
                            folder.name.length > 20
                                ? folder.name.slice(0, 20).concat("...")
                                : folder.name
                        }`
                    })
                );
            }
        } catch (error) {
            showSnackbar(error);
        }
    };

    return (
        <DialogContainer open={dialogOpen} onClose={onClose}>
            {loading.DELETE_FOLDER && <CircularProgress label={t`Deleting folder...`} />}
            <DialogTitle>{t`Delete folder`}</DialogTitle>
            <DialogContent>
                {t`You are about to delete the entire folder "{name}" and all the entries inside! Are you sure you want to continue?`(
                    {
                        name: `${folder.name}`
                    }
                )}
            </DialogContent>
            <DialogActions>
                <ButtonDefault
                    onClick={() => {
                        setDialogOpen(false);
                    }}
                >
                    {t`Cancel`}
                </ButtonDefault>
                <ButtonPrimary
                    onClick={() => {
                        onSubmit();
                    }}
                >
                    {t`Delete folder`}
                </ButtonPrimary>
            </DialogActions>
        </DialogContainer>
    );
};
