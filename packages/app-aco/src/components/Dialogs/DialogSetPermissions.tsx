import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSnackbar, useWcp } from "@webiny/app-admin";
import {
    DialogTitle,
    DialogActions,
    DialogContent,
    DialogOnClose,
    DialogCancel
} from "@webiny/ui/Dialog";
import { Grid, Cell } from "@webiny/ui/Grid";
import { useFolders } from "~/hooks/useFolders";
import { DialogContainer } from "./styled";
import { FolderItem } from "~/types";
import { UsersTeamsMultiAutocomplete } from "./DialogSetPermissions/UsersTeamsMultiAutocomplete";
import { UsersTeamsSelection } from "./DialogSetPermissions/UsersTeamsSelection";
import { LIST_USERS, LIST_TEAMS } from "./DialogSetPermissions/graphql";
import { ButtonPrimary } from "@webiny/ui/Button";
import { useQuery } from "@apollo/react-hooks";
import { CircularProgress } from "@webiny/ui/Progress";

interface FolderDialogUpdateProps {
    folder: FolderItem;
    open: boolean;
    onClose: DialogOnClose;
}

export const FolderDialogManagePermissions: React.VFC<FolderDialogUpdateProps> = ({
    folder,
    onClose,
    open
}) => {
    const { getProject } = useWcp();
    const { loading: updatingFolder, updateFolder } = useFolders();
    const [permissions, setPermissions] = useState(folder.permissions || []);
    const [dialogOpen, setDialogOpen] = useState(false);
    const { showSnackbar } = useSnackbar();

    const closeDialog = useCallback(() => setDialogOpen(false), []);

    const listUsersQuery = useQuery(LIST_USERS);
    const usersList = listUsersQuery.data?.adminUsers.listUsers.data || [];

    let loadingOptions = listUsersQuery.loading;

    const project = getProject();
    let teams = false;
    if (project) {
        teams = project.package.features.advancedAccessControlLayer.options.teams;
    }

    let teamsList: any[] = [];
    if (teams) {
        const listTeamsQuery = useQuery(LIST_TEAMS);

        loadingOptions = loadingOptions || listTeamsQuery.loading;
        teamsList = listTeamsQuery.data?.security.listTeams.data || [];
    }

    useEffect(() => {
        setDialogOpen(open);
    }, [open]);

    const addPermission = useCallback(
        value => {
            const selectedUserOrTeam = value[value.length - 1];
            const newPermission = {
                target: selectedUserOrTeam.target,
                level: "editor"
            };

            // We want to add the new permission to the 2nd position in the array.
            // The 1st position is reserved for the "current user" permission.
            setPermissions([permissions[0], newPermission, ...permissions.slice(1)]);
        },
        [permissions]
    );

    const updatePermission = useCallback(
        updatedPermission => {
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

    const removeUserTeam = useCallback(
        item => {
            setPermissions(
                permissions.filter(permission => permission.target !== item.permission.target)
            );
        },
        [permissions]
    );

    const submit = useCallback(() => {
        const data = { ...folder, permissions };
        return updateFolder(data, { refetchFoldersList: true })
            .then(() => {
                setDialogOpen(false);
                showSnackbar("Folder permissions updated successfully!");
            })
            .catch(error => {
                showSnackbar(error.message);
            });
    }, [permissions]);

    const options = useMemo(() => {
        return [
            ...usersList.map((user: any) => ({
                target: `user:${user.id}`,
                name: `${user.firstName} ${user.lastName}`
            })),
            ...teamsList.map(team => ({
                target: `team:${team.id}`,
                name: `${team.name}`
            }))
        ];
    }, [usersList, teamsList]);

    const dialogTitle = `Manage permissions - ${folder.title}`;

    return (
        <DialogContainer open={dialogOpen} onClose={onClose}>
            {dialogOpen && (
                <>
                    {loadingOptions && <CircularProgress />}

                    <DialogTitle>
                        <span title={dialogTitle}>{dialogTitle}</span>
                    </DialogTitle>
                    <DialogContent>
                        <Grid>
                            <Cell span={12}>
                                <UsersTeamsMultiAutocomplete
                                    options={options}
                                    value={permissions}
                                    onChange={addPermission}
                                />
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <UsersTeamsSelection
                                    permissions={permissions}
                                    usersList={usersList}
                                    teamsList={teamsList}
                                    onRemoveAccess={removeUserTeam}
                                    onUpdatePermission={updatePermission}
                                />
                            </Cell>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <DialogCancel onClick={closeDialog}>Close</DialogCancel>
                        <ButtonPrimary onClick={submit} disabled={updatingFolder.UPDATE}>
                            Save
                        </ButtonPrimary>
                    </DialogActions>
                </>
            )}
        </DialogContainer>
    );
};
