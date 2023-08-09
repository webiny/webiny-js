import React, { useEffect, useState } from "react";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin";
import { Form, FormOnSubmit } from "@webiny/form";
import {
    DialogTitle,
    DialogActions,
    DialogContent,
    DialogOnClose,
    DialogCancel
} from "@webiny/ui/Dialog";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import { useFolders } from "~/hooks/useFolders";
import { DialogContainer } from "./styled";
import { FolderItem } from "~/types";
import {ButtonPrimary} from "@webiny/ui/Button";

interface FolderDialogUpdateProps {
    folder: FolderItem;
    open: boolean;
    onClose: DialogOnClose;
}

type SubmitData = Pick<FolderItem, "permissions">;

const t = i18n.ns("app-aco/dialogs/dialog-update");

export const FolderDialogSetPermissions: React.VFC<FolderDialogUpdateProps> = ({
    folder,
    onClose,
    open
}) => {
    const { loading, updateFolder } = useFolders();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [parentId, setParentId] = useState<string | null>();
    const { showSnackbar } = useSnackbar();

    const onSubmit: FormOnSubmit<SubmitData> = async data => {
        console.log('ide', data)
        try {
            await updateFolder({
                ...folder,
                ...data,
                parentId: parentId || null
            });
            setDialogOpen(false);
            showSnackbar(t`Folder updated successfully!`);
        } catch (error) {
            showSnackbar(error.message);
        }
    };

    useEffect(() => {
        setParentId(folder.parentId);
    }, [folder.parentId]);

    useEffect(() => {
        setDialogOpen(open);
    }, [open]);

    return (
        <DialogContainer open={dialogOpen} onClose={onClose}>
            {dialogOpen && (
                <>
                    <Form<SubmitData>
                        onSubmit={onSubmit}
                        data={{
                            permissions: folder.permissions
                        }}
                    >
                        {({ Bind, submit }) => (
                            <>
                                {loading.UPDATE && (
                                    <CircularProgress label={t`Updating permissions...`} />
                                )}
                                <DialogTitle>{t`Manage permissions`}</DialogTitle>
                                <DialogContent>
                                    <Grid>
                                        <Cell span={12}>
                                            <Bind
                                                name={"permissions.0.target"}
                                                validators={[validation.create("required")]}
                                            >
                                                <Input label={t`Target`} />
                                            </Bind>
                                        </Cell>
                                        <Cell span={12}>
                                            <Bind
                                                name={"permissions.0.level"}
                                                validators={[validation.create("required,slug")]}
                                            >
                                                <Input label={t`Level`} value={folder.slug} />
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                </DialogContent>
                                <DialogActions>

                                    <DialogCancel
                                        onClick={() => {
                                            setDialogOpen(false);
                                        }}
                                    >
                                        {t`Cancel`}
                                    </DialogCancel>
                                    <ButtonPrimary onClick={submit}>{t`Save`}</ButtonPrimary>

                                </DialogActions>
                            </>
                        )}
                    </Form>
                </>
            )}
        </DialogContainer>
    );
};
