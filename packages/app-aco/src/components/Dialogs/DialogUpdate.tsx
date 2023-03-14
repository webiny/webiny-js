import React, { useEffect, useState } from "react";

import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin";
import { Form, FormOnSubmit } from "@webiny/form";
import { ButtonPrimary } from "@webiny/ui/Button";
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
import { Typography } from "@webiny/ui/Typography";
import { validation } from "@webiny/validation";

import { FolderTree } from "~/components";
import { useFolders } from "~/hooks/useFolders";

import { DialogContainer, DialogFoldersContainer } from "./styled";

import { FolderItem } from "~/types";

type Props = {
    folder: FolderItem;
    open: boolean;
    onClose: DialogOnClose;
};

type SubmitData = Pick<FolderItem, "title" | "slug">;

const t = i18n.ns("app-aco/components/tree/dialog-update");

export const FolderDialogUpdate: React.FC<Props> = ({ folder, onClose, open }) => {
    const { loading, updateFolder } = useFolders(folder.type);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [parentId, setParentId] = useState<string | null>();
    const { showSnackbar } = useSnackbar();

    const onSubmit: FormOnSubmit<SubmitData> = async data => {
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
                            title: folder.title,
                            slug: folder.slug
                        }}
                    >
                        {({ Bind, submit }) => (
                            <>
                                {loading.UPDATE && (
                                    <CircularProgress label={t`Updating folder...`} />
                                )}
                                <DialogTitle>{t`Update folder`}</DialogTitle>
                                <DialogContent>
                                    <Grid>
                                        <Cell span={12}>
                                            <Bind
                                                name={"title"}
                                                validators={[
                                                    validation.create("required,minLength:3")
                                                ]}
                                            >
                                                <Input label={t`Title`} />
                                            </Bind>
                                        </Cell>
                                        <Cell span={12}>
                                            <Bind
                                                name={"slug"}
                                                validators={[
                                                    validation.create("required,minLength:3,slug")
                                                ]}
                                            >
                                                <Input label={t`Slug`} value={folder.slug} />
                                            </Bind>
                                        </Cell>
                                        <Cell span={12}>
                                            <Typography use="body1">{t`Parent folder`}</Typography>
                                            <DialogFoldersContainer>
                                                <FolderTree
                                                    title={t`Root folder`}
                                                    type={folder.type}
                                                    focusedFolderId={parentId || undefined}
                                                    hiddenFolderId={folder.id}
                                                    onFolderClick={data =>
                                                        setParentId(data?.id || null)
                                                    }
                                                    onTitleClick={() => setParentId(null)}
                                                />
                                            </DialogFoldersContainer>
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
                                    <ButtonPrimary onClick={submit}>
                                        {t`Update Folder`}
                                    </ButtonPrimary>
                                </DialogActions>
                            </>
                        )}
                    </Form>
                </>
            )}
        </DialogContainer>
    );
};
