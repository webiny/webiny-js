import React, { useContext, useEffect, useState } from "react";

import { AutoComplete } from "@webiny/ui/AutoComplete";
import { ButtonPrimary, ButtonDefault } from "@webiny/ui/Button";
import { DialogTitle, DialogContent, DialogOnClose } from "@webiny/ui/Dialog";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { CircularProgress } from "@webiny/ui/Progress";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { i18n } from "@webiny/app/i18n";

import { useListFolders, useCreateFolder } from "~/hooks";

import { CreateDialogContainer, CreateDialogActions } from "./styled";

import { FolderItem } from "~/types";
import { FoldersContext } from "~/contexts";

type Props = {
    open: boolean;
    onClose: DialogOnClose;
};

const t = i18n.ns("app-folders/components/tree/dialog-create");

export const CreateDialog: React.FC<Props> = ({ onClose, open }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { folderType } = useContext(FoldersContext);
    const { loading, createFolder } = useCreateFolder();
    const { folders } = useListFolders();

    const onSubmit = async (data: Partial<FolderItem>) => {
        await createFolder({
            variables: { data: { ...data, type: folderType } }
        });
        setDialogOpen(false);
    };

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
            {dialogOpen && (
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
                                            <AutoComplete options={folders} label={t`Parent`} />
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
            )}
        </CreateDialogContainer>
    );
};
