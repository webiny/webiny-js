import React, { useCallback, useState } from "react";
import slugify from "slugify";
import { useSnackbar } from "@webiny/app-admin";
import { Bind, FormAPI } from "@webiny/form";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { Typography } from "@webiny/ui/Typography";
import { validation } from "@webiny/validation";

import { FolderTree } from "~/components";
import { useDialogs } from "@webiny/app-admin";
import { DialogFoldersContainer } from "~/dialogs/styled";
import { useFolders } from "~/hooks";
import { ROOT_FOLDER } from "~/constants";

interface ShowDialogParams {
    currentParentId?: string | null;
}

interface UseCreateDialogResponse {
    showDialog: (params?: ShowDialogParams) => void;
}

interface FormComponentProps {
    currentParentId?: string | null;
}

const FormComponent = ({ currentParentId = null }: FormComponentProps) => {
    const [parentId, setParentId] = useState<string | null>(currentParentId);

    const generateSlug = (form: FormAPI) => {
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
    };

    return (
        <Grid>
            <Cell span={12}>
                <Bind name={"title"} validators={[validation.create("required")]}>
                    {({ form, ...bind }) => (
                        <Input {...bind} label={"Title"} onBlur={generateSlug(form)} />
                    )}
                </Bind>
            </Cell>
            <Cell span={12}>
                <Bind name={"slug"} validators={[validation.create("required,slug")]}>
                    <Input label={"Slug"} />
                </Bind>
            </Cell>
            <Cell span={12}>
                <Typography use="body1">{"Parent folder"}</Typography>
                <DialogFoldersContainer>
                    <Bind name={"parentId"} defaultValue={parentId}>
                        {({ onChange }) => (
                            <FolderTree
                                focusedFolderId={parentId || ROOT_FOLDER}
                                onFolderClick={folder => {
                                    setParentId(folder.id);
                                    onChange(folder.id === ROOT_FOLDER ? null : folder.id);
                                }}
                            />
                        )}
                    </Bind>
                </DialogFoldersContainer>
            </Cell>
        </Grid>
    );
};

export const useCreateDialog = (): UseCreateDialogResponse => {
    const dialogs = useDialogs();
    const { createFolder } = useFolders();
    const { showSnackbar } = useSnackbar();

    const onAccept = useCallback(async data => {
        try {
            await createFolder({
                ...data,
                parentId: data.parentId === ROOT_FOLDER ? null : data.parentId
            });
            showSnackbar("Folder created successfully!");
        } catch (error) {
            showSnackbar(error.message);
        }
    }, []);

    const showDialog = (params?: ShowDialogParams) => {
        const { currentParentId = null } = params ?? {};

        dialogs.showDialog({
            title: "Create a new folder",
            content: <FormComponent currentParentId={currentParentId} />,
            acceptLabel: "Create folder",
            cancelLabel: "Cancel",
            loadingLabel: "Creating folder...",
            onAccept
        });
    };

    return {
        showDialog
    };
};
