import React, { useEffect, useState } from "react";

import { useSnackbar } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";
import { ButtonPrimary } from "@webiny/ui/Button";
import {
    DialogTitle,
    DialogActions,
    DialogContent,
    DialogOnClose,
    DialogCancel
} from "@webiny/ui/Dialog";
import { CircularProgress } from "@webiny/ui/Progress";
import { Typography } from "@webiny/ui/Typography";

import { FolderTree } from "~/components";
import { useRecords } from "~/hooks";

import { DialogContainer, DialogFoldersContainer } from "./styled";

import { SearchRecordItem } from "~/types";

type Props = {
    type: string;
    searchRecord: SearchRecordItem;
    open: boolean;
    onClose: DialogOnClose;
};

const t = i18n.ns("app-aco/components/tree/dialog-move");

export const EntryDialogMove: React.FC<Props> = ({ type, searchRecord, onClose, open }) => {
    const { updateRecord, loading } = useRecords(type, searchRecord.location.folderId || "ROOT");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [folderId, setFolderId] = useState<string>();
    const { showSnackbar } = useSnackbar();

    const onSubmit = async () => {
        try {
            if (folderId) {
                const { id, title, type, content, data, tags } = searchRecord;
                await updateRecord({
                    id,
                    title,
                    type,
                    content,
                    data,
                    tags,
                    location: {
                        folderId
                    }
                });

                showSnackbar(t`Item moved successfully!`);
            }
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
                                title={t`Root folder`}
                                type={type}
                                focusedFolderId={folderId || searchRecord.location.folderId}
                                onFolderClick={data => setFolderId(data?.id)}
                                onTitleClick={() => setFolderId("ROOT")}
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
