import React, { useEffect, useState } from "react";

import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin";
import { Form, FormAPI, FormOnSubmit } from "@webiny/form";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { DialogTitle, DialogActions, DialogContent, DialogOnClose } from "@webiny/ui/Dialog";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { CircularProgress } from "@webiny/ui/Progress";
import { Typography } from "@webiny/ui/Typography";
import { validation } from "@webiny/validation";
import slugify from "slugify";

import { FolderTree } from "~/components";
import { useFolders } from "~/hooks/useFolders";

import { DialogContainer, DialogFoldersContainer } from "./styled";

import { FolderItem } from "~/types";

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
    const [parentId, setParentId] = useState<string | null>();
    const { showSnackbar } = useSnackbar();

    const onSubmit: FormOnSubmit<SubmitData> = async data => {
        try {
            await createFolder({
                ...data,
                type,
                parentId: parentId || null
            });
            setDialogOpen(false);
            showSnackbar(t`Folder created successfully!`);
        } catch (error) {
            showSnackbar(error.message);
        }
    };

    const generateSlug = (form: FormAPI) => () => {
        if (form.data.slug) {
            return;
        }

        if (!form.data.title) {
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

    useEffect(() => {
        setParentId(currentParentId);
    }, [currentParentId]);

    useEffect(() => {
        setDialogOpen(open);
    }, [open]);

    return (
        <DialogContainer open={dialogOpen} onClose={onClose}>
            {dialogOpen && (
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
                                                title={t`Root folder`}
                                                type={type}
                                                focusedFolderId={currentParentId || undefined}
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
