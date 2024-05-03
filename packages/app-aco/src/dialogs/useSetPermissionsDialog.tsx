import React, { useCallback, useEffect, useState } from "react";
import { useQuery } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin";
import { GenericFormData, useBind } from "@webiny/form";
import { Cell, Grid } from "@webiny/ui/Grid";

import { UsersTeamsMultiAutocomplete } from "./DialogSetPermissions/UsersTeamsMultiAutocomplete";
import { UsersTeamsSelection } from "./DialogSetPermissions/UsersTeamsSelection";
import { LIST_FOLDER_LEVEL_PERMISSIONS_TARGETS } from "./DialogSetPermissions/graphql";

import { useDialogs } from "@webiny/app-admin";
import { useFolders } from "~/hooks";
import { FolderItem, FolderLevelPermissionsTarget, FolderPermission } from "~/types";

interface ShowDialogParams {
    folder: FolderItem;
}

interface UseSetPermissionsDialogResponse {
    showDialog: (params: ShowDialogParams) => void;
}

interface FormComponentProps {
    folder: FolderItem;
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
    const listTargetsQuery = useQuery(LIST_FOLDER_LEVEL_PERMISSIONS_TARGETS);
    const targetsList: FolderLevelPermissionsTarget[] =
        listTargetsQuery.data?.aco.listFolderLevelPermissionsTargets.data || [];

    const bind = useBind({
        name: "permissions"
    });

    useEffect(() => {
        bind.form.setValue("permissions", permissions);
    }, [permissions]);

    const addPermission = useCallback(
        (value: FolderPermission[]) => {
            const selectedUserOrTeam = value[value.length - 1];
            const newPermission: FolderPermission = {
                target: selectedUserOrTeam.target,
                level: "editor"
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
            <Cell span={12}>
                <UsersTeamsMultiAutocomplete
                    options={targetsList}
                    value={permissions}
                    onChange={addPermission}
                />
            </Cell>
            <Cell span={12}>
                <UsersTeamsSelection
                    permissions={permissions}
                    targetsList={targetsList}
                    onRemoveAccess={removeUserTeam}
                    onUpdatePermission={updatePermission}
                />
            </Cell>
        </Grid>
    );
};

export const useSetPermissionsDialog = (): UseSetPermissionsDialogResponse => {
    const dialogs = useDialogs();
    const { updateFolder } = useFolders();
    const { showSnackbar } = useSnackbar();

    const onAccept = useCallback(async (folder: FolderItem, data: Partial<FolderItem>) => {
        const updateData = { ...folder, ...data };

        try {
            await updateFolder(updateData, { refetchFoldersList: true });
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
