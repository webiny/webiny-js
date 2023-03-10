import React, { useEffect, useState } from "react";

import { ButtonPrimary, ButtonDefault } from "@webiny/ui/Button";
import { DialogTitle, DialogContent, DialogOnClose } from "@webiny/ui/Dialog";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CircularProgress } from "@webiny/ui/Progress";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin";

import { FolderTree } from "~/components";
import { useRecords } from "~/hooks";

import { DialogContainer, DialogActions } from "./styled";

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
                console.log(folderId, searchRecord);
                const { id, title, type, content, data } = searchRecord;
                await updateRecord({
                    id,
                    title,
                    type,
                    content,
                    data,
                    location: {
                        folderId
                    }
                });

                showSnackbar(t`Entry moved successfully!`);
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
                    {loading.UPDATE && <CircularProgress label={t`Updating entry...`} />}
                    <DialogContent>
                        <Grid>
                            <Cell span={12}>
                                <FolderTree
                                    title={"Root folder"}
                                    type={type}
                                    focusedFolderId={folderId}
                                    onFolderClick={data => {
                                        console.log(data?.id);
                                        setFolderId(data?.id);
                                    }}
                                    onTitleClick={() => setFolderId("ROOT")}
                                />
                            </Cell>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <ButtonDefault
                            onClick={() => {
                                setDialogOpen(false);
                            }}
                        >
                            {t`Cancel`}
                        </ButtonDefault>
                        <ButtonPrimary onClick={onSubmit}>{t`Move item`}</ButtonPrimary>
                    </DialogActions>
                </>
            )}
        </DialogContainer>
    );
};
