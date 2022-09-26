import React from "react";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogOnClose
} from "@webiny/ui/Dialog";
import { Input } from "@webiny/ui/Input";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CircularProgress } from "@webiny/ui/Progress";
import { ButtonPrimary } from "@webiny/ui/Button";
import { i18n } from "@webiny/app/i18n";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { FolderItem, Types } from "~/types";

import { useCreateFolder } from "~/hooks";
import { useListFolders } from "~/hooks";

const t = i18n.ns("app-folders/components/tree/create-dialog");

export type Props = {
    open: boolean;
    onClose: DialogOnClose;
    type: keyof Types;
};

export const CreateDialog: React.FC<Props> = ({ onClose, open, type }) => {
    const { loading, create } = useCreateFolder();
    const { folders } = useListFolders(type);

    const onSubmit = async (data: Partial<FolderItem>) => {
        await create({
            variables: { data: { ...data, type } }
        });
        window.location.reload();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            {open && (
                <Form
                    onSubmit={data => {
                        /**
                         * We are positive that data is CmsModelData.
                         */
                        onSubmit(data as unknown as Partial<FolderItem>);
                    }}
                >
                    {({ Bind, submit }) => (
                        <>
                            {loading && <CircularProgress label={"Creating folder..."} />}
                            <DialogTitle>{t`New folder`}</DialogTitle>
                            <DialogContent>
                                <Grid>
                                    <Cell span={6}>
                                        <Bind
                                            name={"name"}
                                            validators={[validation.create("required,minLength:3")]}
                                        >
                                            <Input label={t`Name`} />
                                        </Bind>
                                    </Cell>
                                    <Cell span={6}>
                                        <Bind
                                            name={"slug"}
                                            validators={[validation.create("required,minLength:3")]}
                                        >
                                            <Input label={t`Slug`} />
                                        </Bind>
                                    </Cell>
                                    <Cell span={6}>
                                        <Bind name="parentId">
                                            <AutoComplete options={folders} label={t`Parent`} />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </DialogContent>
                            <DialogActions>
                                <ButtonPrimary
                                    onClick={ev => {
                                        submit(ev);
                                    }}
                                >
                                    {t`Create Folder`}
                                </ButtonPrimary>
                            </DialogActions>
                        </>
                    )}
                </Form>
            )}
        </Dialog>
    );
};
