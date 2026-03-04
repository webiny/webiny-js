import React, { useCallback, useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { Grid } from "@webiny/admin-ui";
import { useDialogs, useSnackbar } from "@webiny/app-admin";
import type { GenericFormData } from "@webiny/form";
import { useBind } from "@webiny/form";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import { useUpdateFolder } from "~/features/folders/updateFolder/index.js";
import { UsersTeamsMultiAutocomplete } from "./DialogSetPermissions/UsersTeamsMultiAutocomplete.js";
import { UsersTeamsSelection } from "./DialogSetPermissions/UsersTeamsSelection.js";
import {
    type IListFolderLevelPermissionsTargetsResponse,
    LIST_FOLDER_LEVEL_PERMISSIONS_TARGETS
} from "./DialogSetPermissions/graphql.js";
import type { FolderLevelPermissionsTarget, FolderPermission } from "~/types.js";

interface ShowDialogParams {
    folder: FolderDto;
}

interface UseSetPermissionsDialogResponse {
    showDialog: (params: ShowDialogParams) => void;
}

interface FormComponentProps {
    folder: FolderDto;
}

interface UpdatePermissionCallableParams {
    permission: FolderPermission;
}

interface UpdatePermissionCallable {
    (params: UpdatePermissionCallableParams): void;
}

interface RemoveUserTeamCallableParams {
    permission: FolderPermission;
}

interface RemoveUserTeamCallable {
    (params: RemoveUserTeamCallableParams): void;
}

const FormComponent = ({ folder }: FormComponentProps) => {
    const [permissions, setPermissions] = useState<FolderPermission[]>(folder.permissions || []); // Moved useState outside showDialog
    const listTargetsQuery = useQuery<IListFolderLevelPermissionsTargetsResponse>(
        LIST_FOLDER_LEVEL_PERMISSIONS_TARGETS
    );
    const targetsList: FolderLevelPermissionsTarget[] =
        listTargetsQuery.data?.aco.listFolderLevelPermissionsTargets.data || [];

    const bind = useBind({
        name: "permissions"
    });

    useEffect(() => {
        bind.onChange(permissions);
    }, [permissions]);

    const addPermission = useCallback(
        (value: FolderPermission["target"][]) => {
            const selectedUserOrTeam = value[value.length - 1];
            const newPermission: FolderPermission = {
                target: selectedUserOrTeam,
                level: "viewer"
            };

            // We want to add the new permission to the 2nd position in the array.
            // The 1st position is reserved for the "current user" permission.
            setPermissions([permissions[0], newPermission, ...permissions.slice(1)]);
        },
        [permissions]
    );

    const updatePermission = useCallback<UpdatePermissionCallable>(
        ({ permission: updatedPermission }) => {
            setPermissions(
                permissions.map(permission => {
                    if (permission.target === updatedPermission.target) {
                        return updatedPermission;
                    }
                    return permission;
                })
            );
        },
        [permissions]
    );

    const removeUserTeam = useCallback<RemoveUserTeamCallable>(
        item => {
            setPermissions(
                permissions.filter(permission => permission.target !== item.permission.target)
            );
        },
        [permissions]
    );

    return (
        <Grid>
            <Grid.Column span={12}>
                <UsersTeamsMultiAutocomplete
                    options={targetsList}
                    value={permissions.map(permission => permission.target)}
                    onChange={addPermission}
                />
            </Grid.Column>
            <Grid.Column span={12}>
                <UsersTeamsSelection
                    permissions={permissions}
                    targetsList={targetsList}
                    onRemoveAccess={removeUserTeam}
                    onUpdatePermission={updatePermission}
                />
            </Grid.Column>
        </Grid>
    );
};

export const useSetPermissionsDialog = (): UseSetPermissionsDialogResponse => {
    const dialogs = useDialogs();
    const { updateFolder } = useUpdateFolder();
    const { showSnackbar } = useSnackbar();

    const onAccept = useCallback(async (folder: FolderDto, data: Partial<FolderDto>) => {
        const updateData = { ...folder, ...data };

        try {
            await updateFolder(updateData);
            showSnackbar("Folder permissions updated successfully!");
        } catch (error) {
            showSnackbar(error.message);
        }
    }, []);

    const showDialog = ({ folder }: ShowDialogParams) => {
        dialogs.showDialog({
            title: `Manage permissions - ${folder.title}`,
            content: <FormComponent folder={folder} />,
            acceptLabel: "Save",
            cancelLabel: "Cancel",
            loadingLabel: "Updating permissions...",
            onAccept: (data: GenericFormData) => onAccept(folder, data)
        });
    };

    return {
        showDialog
    };
};
