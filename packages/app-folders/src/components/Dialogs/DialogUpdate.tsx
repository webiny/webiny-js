import React, { useEffect, useMemo, useState } from "react";

import { useSnackbar } from "@webiny/app-admin";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { ButtonPrimary, ButtonDefault } from "@webiny/ui/Button";
import { DialogTitle, DialogContent, DialogOnClose } from "@webiny/ui/Dialog";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { CircularProgress } from "@webiny/ui/Progress";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { i18n } from "@webiny/app/i18n";

import { useFolders } from "~/hooks/useFolders";

import { DialogContainer, DialogActions } from "./styled";

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

const t = i18n.ns("app-folders/components/tree/dialog-update");

export const FolderDialogUpdate: React.FC<Props> = ({ folder, onClose, open }) => {
    const { folders, loading, updateFolder } = useFolders(folder.type);
    const [dialogOpen, setDialogOpen] = useState(false);
    const { showSnackbar } = useSnackbar();

    const onSubmit = async (data: SubmitData) => {
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

    const parentFolder = useMemo(() => folders.find(el => el.id == folder.parentId), [folder]);

    return (
        <DialogContainer open={dialogOpen} onClose={onClose}>
            {dialogOpen && (
                <>
                    <Form
                        onSubmit={data => {
                            onSubmit(data as unknown as SubmitData);
                        }}
                        data={{
                            name: folder.name,
                            slug: folder.slug,
                            parent: parentFolder && {
                                id: parentFolder.id,
                                name: parentFolder.name
                            }
                        }}
                    >
                        {({ Bind, submit }) => (
                            <>
                                {loading.UPDATE_FOLDER && (
                                    <CircularProgress label={t`Updating folder...`} />
                                )}
                                <DialogTitle>{t`Update folder`}</DialogTitle>
                                <DialogContent>
                                    <Grid>
                                        <Cell span={12}>
                                            <Bind
                                                name={"name"}
                                                validators={[
                                                    validation.create("required,minLength:3")
                                                ]}
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
                                                                .map(({ id, name }) => ({
                                                                    id,
                                                                    name
                                                                }))}
                                                            label={t`Parent`}
                                                            onChange={(value, selection) =>
                                                                onBindChange({
                                                                    id: value,
                                                                    name: selection?.name
                                                                })
                                                            }
                                                        />
                                                    );
                                                }}
                                            </Bind>
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
                                    <ButtonPrimary
                                        onClick={e => {
                                            submit(e);
                                        }}
                                    >
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
