import React, { useEffect, useMemo, useState } from "react";

import { useSnackbar } from "@webiny/app-admin";
import { AutoComplete } from "@webiny/ui/AutoComplete";
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
import { Form, FormOnSubmit } from "@webiny/form";
import { validation } from "@webiny/validation";
import { i18n } from "@webiny/app/i18n";

import { useFolders } from "~/hooks/useFolders";

import { DialogContainer } from "./styled";

import { FolderItem } from "~/types";

type Props = {
    folder: FolderItem;
    open: boolean;
    onClose: DialogOnClose;
};

interface SubmitData extends Omit<FolderItem, "id" | "parentId"> {
    parent: {
        id: string | null;
        name?: string;
    };
}

const t = i18n.ns("app-aco/components/tree/dialog-update");

export const FolderDialogUpdate: React.FC<Props> = ({ folder, onClose, open }) => {
    const { folders, loading, updateFolder } = useFolders(folder.type);
    const [dialogOpen, setDialogOpen] = useState(false);
    const { showSnackbar } = useSnackbar();

    const onSubmit: FormOnSubmit<SubmitData> = async data => {
        try {
            await updateFolder({
                ...folder,
                ...data,
                parentId: data.parent?.id || null
            });
            setDialogOpen(false);
            showSnackbar(t`Folder updated successfully!`);
        } catch (error) {
            showSnackbar(error.message);
        }
    };

    useEffect(() => {
        setDialogOpen(open);
    }, [open]);

    const parentFolder = useMemo(() => folders.find(el => el.id == folder.parentId), [folder]);

    return (
        <DialogContainer open={dialogOpen} onClose={onClose}>
            {dialogOpen && (
                <>
                    <Form<SubmitData>
                        onSubmit={onSubmit}
                        data={{
                            title: folder.title,
                            slug: folder.slug,
                            parent: parentFolder && {
                                id: parentFolder.id,
                                name: parentFolder.title
                            }
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
                                            <Bind name={"parent"}>
                                                {({ value, onChange: onBindChange }) => {
                                                    return (
                                                        <AutoComplete
                                                            value={value}
                                                            options={folders
                                                                .filter(el => el.id !== folder.id)
                                                                .map(({ id, title }) => ({
                                                                    id,
                                                                    name: title
                                                                }))}
                                                            label={t`Parent`}
                                                            onChange={(value, selection) => {
                                                                onBindChange({
                                                                    id: value,
                                                                    name: selection?.name
                                                                });
                                                            }}
                                                        />
                                                    );
                                                }}
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
