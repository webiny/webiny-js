import React, { useCallback, useEffect, useState } from "react";
import slugify from "slugify";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin";
import { Form, FormAPI, FormOnSubmit } from "@webiny/form";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { DialogActions, DialogContent, DialogOnClose, DialogTitle } from "@webiny/ui/Dialog";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { CircularProgress } from "@webiny/ui/Progress";
import { Typography } from "@webiny/ui/Typography";
import { validation } from "@webiny/validation";
import { FolderTree } from "~/components";
import { useFolders } from "~/hooks/useFolders";
import { DialogContainer, DialogFoldersContainer } from "./styled";
import { FolderItem } from "~/types";
import { ROOT_FOLDER } from "~/constants";

interface FolderDialogCreateProps {
    open: boolean;
    onClose: DialogOnClose;
    currentParentId?: string | null;
}

const t = i18n.ns("app-aco/dialogs/dialog-create");

type SubmitData = Omit<FolderItem, "id">;

export const FolderDialogCreate: React.VFC<FolderDialogCreateProps> = ({
    onClose,
    open,
    currentParentId
}) => {
    const { loading, createFolder } = useFolders();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [parentId, setParentId] = useState<string>(currentParentId || ROOT_FOLDER);
    const { showSnackbar } = useSnackbar();

    const onSubmit: FormOnSubmit<SubmitData> = useCallback(
        async data => {
            try {
                await createFolder({
                    ...data,
                    parentId: parentId === ROOT_FOLDER ? null : parentId
                });
                setDialogOpen(false);
                showSnackbar(t`Folder created successfully!`);
            } catch (error) {
                showSnackbar(error.message);
            }
        },
        [parentId]
    );

    useEffect(() => {
        if (currentParentId !== parentId) {
            setParentId(currentParentId || ROOT_FOLDER);
        }
    }, [currentParentId]);

    const generateSlug = useCallback((form: FormAPI) => {
        return () => {
            if (form.data.slug || !form.data.title) {
                return;
            }

            // We want to update slug only when the folder is first being created.
            form.setValue(
                "slug",
                slugify(form.data.title, {
                    replacement: "-",
                    lower: true,
                    remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g,
                    trim: false
                })
            );
        };
    }, []);

    useEffect(() => {
        setDialogOpen(open);
    }, [open, setDialogOpen]);

    if (!dialogOpen) {
        return null;
    }

    const onFolderClick = (data: FolderItem) => {
        setParentId(data.id);
    };

    return (
        <DialogContainer open={dialogOpen} onClose={onClose}>
            <Form<SubmitData> onSubmit={onSubmit}>
                {({ form, Bind, submit }) => (
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
                                        <Input label={t`Title`} onBlur={generateSlug(form)} />
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
                                            focusedFolderId={parentId}
                                            onFolderClick={onFolderClick}
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
        </DialogContainer>
    );
};
