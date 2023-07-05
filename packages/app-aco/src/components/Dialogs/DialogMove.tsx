import React, { useEffect, useState } from "react";
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
import { Typography } from "@webiny/ui/Typography";
import { FolderTree } from "~/components";
import { useRecords } from "~/hooks";
import { DialogContainer, DialogFoldersContainer } from "./styled";
import { MovableSearchRecordItem } from "~/types";
import { ROOT_FOLDER } from "~/constants";

interface EntryDialogMoveProps {
    searchRecord: MovableSearchRecordItem;
    open: boolean;
    onClose: DialogOnClose;
}

const t = i18n.ns("app-aco/dialogs/dialog-move");

export const EntryDialogMove: React.VFC<EntryDialogMoveProps> = ({
    searchRecord,
    onClose,
    open
}) => {
    const { moveRecord, loading } = useRecords(searchRecord.location.folderId || ROOT_FOLDER);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [folderId, setFolderId] = useState<string>();
    const { showSnackbar } = useSnackbar();

    const onSubmit = async () => {
        try {
            if (!folderId) {
                setDialogOpen(false);
                return;
            }
            const { id } = searchRecord;
            await moveRecord({
                id,
                location: {
                    folderId
                }
            });

            showSnackbar(t`Item moved successfully!`);
            setDialogOpen(false);
        } catch (error) {
            showSnackbar(error.message);
        }
    };

    useEffect(() => {
        setDialogOpen(open);
    }, [open]);

    return (
        <DialogContainer open={dialogOpen} onClose={onClose}>
            {dialogOpen && (
                <>
                    <DialogTitle>{t`Move item`}</DialogTitle>
                    {loading.UPDATE && <CircularProgress label={t`Moving item...`} />}
                    <DialogContent>
                        <Typography use="body1">{t`Choose the folder where you want to move the item. You can always create a new one if you prefer.`}</Typography>
                        <DialogFoldersContainer>
                            <FolderTree
                                focusedFolderId={folderId || searchRecord.location.folderId}
                                onFolderClick={data => setFolderId(data?.id)}
                                enableCreate={true}
                            />
                        </DialogFoldersContainer>
                    </DialogContent>
                    <DialogActions>
                        <DialogCancel
                            onClick={() => {
                                setDialogOpen(false);
                            }}
                        >
                            {t`Cancel`}
                        </DialogCancel>
                        <ButtonPrimary onClick={onSubmit}>{t`Move item`}</ButtonPrimary>
                    </DialogActions>
                </>
            )}
        </DialogContainer>
    );
};
