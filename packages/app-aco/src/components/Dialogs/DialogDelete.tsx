import React, { useEffect, useMemo, useState } from "react";

import { useSnackbar } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";
import { ButtonPrimary } from "@webiny/ui/Button";
import {
    DialogActions,
    DialogCancel,
    DialogContent,
    DialogOnClose,
    DialogTitle
} from "@webiny/ui/Dialog";
import { CircularProgress } from "@webiny/ui/Progress";

import { useFolders } from "~/hooks";

import { DialogContainer } from "./styled";

const t = i18n.ns("app-aco/dialogs/dialog-delete");

import { FolderItem } from "~/types";

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

    const folderDisplayName = useMemo(
        () => (folder.title.length > 20 ? folder.title.slice(0, 20).concat("...") : folder.title),
        [folder.title]
    );

    const onSubmit = async () => {
        try {
            const result = await deleteFolder(folder);

            if (result) {
                showSnackbar(
                    t`The folder "{name}" was deleted successfully.`({
                        name: folderDisplayName
                    })
                );
            } else {
                throw new Error(
                    t`Error while deleting page "{name}"!`({
                        name: folderDisplayName
                    })
                );
            }
        } catch (error) {
            showSnackbar(error.message);
        } finally {
            setDialogOpen(false);
        }
    };

    return (
        <DialogContainer open={dialogOpen} onClose={onClose}>
            {loading.DELETE && <CircularProgress label={t`Deleting folder...`} />}
            <DialogTitle>{t`Delete folder`}</DialogTitle>
            <DialogContent>
                {t`You are about to delete the folder "{name}"! Are you sure you want to continue?`(
                    {
                        name: folderDisplayName
                    }
                )}
            </DialogContent>
            <DialogActions>
                <DialogCancel
                    onClick={() => {
                        setDialogOpen(false);
                    }}
                >
                    {t`Cancel`}
                </DialogCancel>
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
