import React from "react";
import { useQuery } from "@apollo/react-hooks";
import { Grid } from "@webiny/admin-ui";
import { useBind } from "@webiny/form";
import {
    LIST_FOLDER_LEVEL_PERMISSIONS_TARGETS,
    UsersTeamsMultiAutocomplete
} from "@webiny/app-aco";
import type { FolderLevelPermissionsTarget } from "@webiny/app-aco";
import type { FieldPermission } from "~/types.js";
import { FieldPermissionsSelection } from "./FieldPermissionsSelection.js";

export const PermissionsTab = () => {
    const bind = useBind({ name: "permissions" });
    const permissions: FieldPermission[] = bind.value || [];
    const listTargetsQuery = useQuery(LIST_FOLDER_LEVEL_PERMISSIONS_TARGETS);
    const targetsList: FolderLevelPermissionsTarget[] =
        listTargetsQuery.data?.aco.listFolderLevelPermissionsTargets.data || [];

    const addPermission = (value: FieldPermission["target"][]) => {
        const selectedUserOrTeam = value[value.length - 1];
        const newPermission: FieldPermission = {
            target: selectedUserOrTeam,
            accessLevel: "viewer"
        };

        bind.onChange([...permissions, newPermission]);
    };

    const updatePermission = ({
        permission: updatedPermission
    }: {
        permission: FieldPermission;
    }) => {
        bind.onChange(
            permissions.map(permission => {
                if (permission.target === updatedPermission.target) {
                    return updatedPermission;
                }
                return permission;
            })
        );
    };

    const removeUserTeam = ({ permission: removedPermission }: { permission: FieldPermission }) => {
        bind.onChange(
            permissions.filter(permission => permission.target !== removedPermission.target)
        );
    };

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
                <FieldPermissionsSelection
                    permissions={permissions}
                    targetsList={targetsList}
                    onRemoveAccess={removeUserTeam}
                    onUpdatePermission={updatePermission}
                />
            </Grid.Column>
        </Grid>
    );
};
