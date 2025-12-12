import React, { useCallback, useState } from "react";
import { Grid, Input } from "@webiny/admin-ui";
import { useSnackbar, useDialogs } from "@webiny/app-admin";
import type { GenericFormData } from "@webiny/form";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { Extensions, FolderTree } from "~/components/index.js";
import { ROOT_FOLDER } from "~/constants.js";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import { useUpdateFolder } from "~/features/folders/updateFolder/index.js";
import { ParentFolderField } from "./ParentFolderField.js";

interface ShowDialogParams {
    folder: FolderDto;
}

interface UseEditDialogResponse {
    showDialog: (params: ShowDialogParams) => void;
}

interface FormComponentProps {
    folder: FolderDto;
}

const FormComponent = ({ folder }: FormComponentProps) => {
    const [parentId, setParentId] = useState<string | null>(folder.parentId);

    return (
        <>
            <Grid>
                <Grid.Column span={12}>
                    <Bind
                        name={"title"}
                        defaultValue={folder.title}
                        validators={[validation.create("required")]}
                    >
                        <Input label={"Title"} size={"lg"} required autoFocus />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={12}>
                    <Bind
                        name={"slug"}
                        defaultValue={folder.slug}
                        validators={[validation.create("required,slug")]}
                    >
                        <Input label={"Slug"} size={"lg"} required />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={12}>
                    <ParentFolderField>
                        <Bind name={"parentId"} defaultValue={parentId}>
                            {({ onChange }) => (
                                <FolderTree
                                    focusedFolderId={parentId || ROOT_FOLDER}
                                    hiddenFolderIds={[folder.id]}
                                    onFolderClick={folder => {
                                        setParentId(folder.id);
                                        onChange(folder.id === ROOT_FOLDER ? null : folder.id);
                                    }}
                                    enableCreate={true}
                                />
                            )}
                        </Bind>
                    </ParentFolderField>
                </Grid.Column>
            </Grid>
            <Extensions />
        </>
    );
};

export const useEditDialog = (): UseEditDialogResponse => {
    const dialog = useDialogs();
    const { updateFolder } = useUpdateFolder();
    const { showSnackbar } = useSnackbar();

    const onAccept = useCallback(async (folder: FolderDto, data: GenericFormData) => {
        try {
            await updateFolder({
                ...folder,
                ...data
            });
            showSnackbar(`The folder "${data.title}" was updated successfully!`);
        } catch (error) {
            showSnackbar(error.message);
        }
    }, []);

    const showDialog = ({ folder }: ShowDialogParams) => {
        dialog.showDialog({
            title: "Edit folder",
            content: <FormComponent folder={folder} />,
            formData: folder,
            acceptLabel: "Edit folder",
            cancelLabel: "Cancel",
            loadingLabel: "Editing folder...",
            onAccept: (data: GenericFormData) => onAccept(folder, data)
        });
    };

    return {
        showDialog
    };
};
