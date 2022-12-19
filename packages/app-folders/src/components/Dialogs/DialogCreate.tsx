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
import { useSnackbar } from "@webiny/app-admin";

import { useFolders } from "~/hooks/useFolders";

import { DialogContainer, DialogActions } from "./styled";

import { FolderItem } from "~/types";

type Props = {
    type: string;
    open: boolean;
    onClose: DialogOnClose;
    parentId?: string | null;
};

const t = i18n.ns("app-folders/components/tree/dialog-create");

type SubmitData = Omit<FolderItem, "id">;

export const FolderDialogCreate: React.FC<Props> = ({ type, onClose, open, parentId }) => {
    const { folders, loading, createFolder } = useFolders(type);
    const [dialogOpen, setDialogOpen] = useState(false);
    const { showSnackbar } = useSnackbar();

    const onSubmit = async (data: SubmitData) => {
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
                <Form
                    onSubmit={data => {
                        onSubmit(data as unknown as SubmitData);
                    }}
                >
                    {({ Bind, submit }) => (
                        <>
                            {loading.CREATE && <CircularProgress label={t`Creating folder...`} />}
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
                                                validation.create("required,minLength:3,slug")
                                            ]}
                                        >
                                            <Input label={t`Slug`} />
                                        </Bind>
                                    </Cell>
                                    {typeof parentId === "undefined" && (
                                        <Cell span={12}>
                                            <Bind name="parentId">
                                                <AutoComplete options={folders} label={t`Parent`} />
                                            </Bind>
                                        </Cell>
                                    )}
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
                                <ButtonPrimary
                                    onClick={e => {
                                        submit(e);
                                    }}
                                >
                                    {t`Create Folder`}
                                </ButtonPrimary>
                            </DialogActions>
                        </>
                    )}
                </Form>
            )}
        </DialogContainer>
    );
};
