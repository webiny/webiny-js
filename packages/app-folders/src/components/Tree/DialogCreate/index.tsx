import React, { useEffect, useState } from "react";

import { AutoComplete } from "@webiny/ui/AutoComplete";
import { ButtonPrimary, ButtonDefault } from "@webiny/ui/Button";
import { DialogTitle, DialogContent, DialogOnClose } from "@webiny/ui/Dialog";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { CircularProgress } from "@webiny/ui/Progress";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { i18n } from "@webiny/app/i18n";

import { useFolders } from "~/hooks";

import { CreateDialogContainer, CreateDialogActions } from "./styled";

import { FolderItem } from "~/types";

type Props = {
    type: string;
    open: boolean;
    onClose: DialogOnClose;
};

const t = i18n.ns("app-folders/components/tree/dialog-create");

export const CreateDialog: React.FC<Props> = ({ type, onClose, open }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { folders, createFolder, listFolders, loading } = useFolders();

    const onSubmit = (data: Partial<FolderItem>) => {
        createFolder({
            variables: { data: { ...data, type } }
        });
        listFolders(type);
        setDialogOpen(false);
    };

    // TODO open issue to add new slug validator
    const slugValidator = (slug: string): void => {
        const test = new RegExp("^[a-z0-9_-]*$");
        const matched = slug.match(test);

        if (matched) {
            return;
        }

        throw new Error(t`Slug can contain only letters, numbers, dashes and underscores`);
    };

    useEffect(() => {
        setDialogOpen(open);
    }, [open]);

    return (
        <CreateDialogContainer open={dialogOpen} onClose={onClose}>
            <Form
                onSubmit={data => {
                    onSubmit(data as unknown as Partial<FolderItem>);
                }}
            >
                {({ Bind, submit }) => (
                    <>
                        {loading && <CircularProgress label={"Creating folder..."} />}
                        <DialogTitle>{t`Create a new folder`}</DialogTitle>
                        <DialogContent>
                            <Grid>
                                <Cell span={12}>
                                    <Bind
                                        name={"name"}
                                        validators={[validation.create("required,minLength:3")]}
                                    >
                                        <Input label={t`Name`} />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind
                                        name={"slug"}
                                        validators={[
                                            validation.create("required,minLength:3"),
                                            slugValidator
                                        ]}
                                    >
                                        <Input label={t`Slug`} />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name="parentId">
                                        <AutoComplete options={folders[type]} label={t`Parent`} />
                                    </Bind>
                                </Cell>
                            </Grid>
                        </DialogContent>
                        <CreateDialogActions>
                            <ButtonDefault
                                onClick={() => {
                                    setDialogOpen(false);
                                }}
                            >
                                {t`Cancel`}
                            </ButtonDefault>
                            <ButtonPrimary
                                onClick={e => {
                                    submit(e);
                                }}
                            >
                                {t`Create Folder`}
                            </ButtonPrimary>
                        </CreateDialogActions>
                    </>
                )}
            </Form>
        </CreateDialogContainer>
    );
};
