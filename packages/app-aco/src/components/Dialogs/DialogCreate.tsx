import React, { useEffect, useState } from "react";

import { ButtonPrimary, ButtonDefault } from "@webiny/ui/Button";
import { DialogTitle, DialogContent, DialogOnClose } from "@webiny/ui/Dialog";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { CircularProgress } from "@webiny/ui/Progress";
import { Form, FormOnSubmit } from "@webiny/form";
import { validation } from "@webiny/validation";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin";

import { FolderTree } from "~/components";
import { useFolders } from "~/hooks/useFolders";

import { DialogContainer, DialogActions, DialogFoldersContainer } from "./styled";

import { FolderItem } from "~/types";
import { Typography } from "@webiny/ui/Typography";

type Props = {
    type: string;
    open: boolean;
    onClose: DialogOnClose;
    currentParentId?: string | null;
};

const t = i18n.ns("app-aco/components/tree/dialog-create");

type SubmitData = Omit<FolderItem, "id">;

export const FolderDialogCreate: React.FC<Props> = ({ type, onClose, open, currentParentId }) => {
    const { loading, createFolder } = useFolders(type);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [parentId, setParentId] = useState<string>();
    const { showSnackbar } = useSnackbar();

    const onSubmit: FormOnSubmit<SubmitData> = async data => {
        try {
            await createFolder({
                ...data,
                type,
                ...(typeof parentId !== "undefined" && { parentId })
            });
            setDialogOpen(false);
            showSnackbar(t`Folder created successfully!`);
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
                <Form onSubmit={onSubmit}>
                    {({ Bind, submit }) => (
                        <>
                            {loading.CREATE && <CircularProgress label={t`Creating folder...`} />}
                            <DialogTitle>{t`Create a new folder`}</DialogTitle>
                            <DialogContent>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind
                                            name={"title"}
                                            validators={[validation.create("required,minLength:3")]}
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
                                            <Input label={t`Slug`} />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Typography use="body1">{t`Parent folder`}</Typography>
                                        <DialogFoldersContainer>
                                            <FolderTree
                                                title={"Root folder"}
                                                type={type}
                                                focusedFolderId={
                                                    currentParentId || parentId || undefined
                                                }
                                                onFolderClick={data => setParentId(data?.id)}
                                                onTitleClick={() => setParentId(undefined)}
                                            />
                                        </DialogFoldersContainer>
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
                                <ButtonPrimary onClick={submit}>{t`Create Folder`}</ButtonPrimary>
                            </DialogActions>
                        </>
                    )}
                </Form>
            )}
        </DialogContainer>
    );
};
