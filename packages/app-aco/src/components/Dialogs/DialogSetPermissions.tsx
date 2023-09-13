import React, { useCallback, useEffect, useState } from "react";
import { useSnackbar } from "@webiny/app-admin";
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
import { UsersTeamsMultiAutocomplete } from "~/components/Dialogs/UsersTeamsMultiAutocomplete";
import UsersTeamsSelection from "~/components/Dialogs/UsersTeamsSelection";
import { ButtonPrimary } from "@webiny/ui/Button";
import { useQuery } from "@apollo/react-hooks";
import { LIST_USERS } from "~/components/Dialogs/UsersTeamsMultiAutocomplete/graphql";

interface FolderDialogUpdateProps {
    folder: FolderItem;
    open: boolean;
    onClose: DialogOnClose;
}

export const FolderDialogSetPermissions: React.VFC<FolderDialogUpdateProps> = ({
    folder,
    onClose,
    open
}) => {
    const { loading: updatingFolder, updateFolder } = useFolders();
    const [permissions, setPermissions] = useState(folder.permissions || []);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [parentId, setParentId] = useState<string | null>();
    const { showSnackbar } = useSnackbar();

    const closeDialog = useCallback(() => setDialogOpen(false), []);

    const listUsersQuery = useQuery(LIST_USERS);
    const usersList = listUsersQuery.data?.adminUsers.listUsers.data || [];

    const onSubmit: any = async data => {
        console.log("ide", data);
        try {
            await updateFolder({
                ...folder,
                ...data,
                parentId: parentId || null
            });
            setDialogOpen(false);
            showSnackbar("Folder updated successfully!");
        } catch (error) {
            showSnackbar(error.message);
        }
    };

    useEffect(() => {
        setParentId(folder.parentId);
    }, [folder.parentId]);

    useEffect(() => {
        setDialogOpen(open);
    }, [open]);

    const addPermission = useCallback(
        ([userTeam]) => {
            setPermissions([...permissions, { target: `user:${userTeam.id}`, level: "owner" }]);
        },
        [permissions]
    );

    const removeUserTeam = useCallback(item => {
        console.log("removeam", item);
    }, []);
    const submit = useCallback(() => {}, []);

    console.log("nove permisije", permissions);
    const usersTeamsSelectionData = permissions.map(permission => {
        console.log('permissionpermission' ,permission)
        return {
            permission,
            user: usersList.find(item => {
                console.log('perma', permission)
                return item.id === permission.target.split(":")[1];
            })
        };
    });
    return (
        <DialogContainer open={dialogOpen} onClose={onClose}>
            {dialogOpen && (
                <>
                    <DialogTitle>Manage permissions</DialogTitle>
                    <DialogContent>
                        <Grid>
                            <Cell span={12}>
                                <UsersTeamsMultiAutocomplete
                                    options={usersList}
                                    value={null}
                                    onChange={addPermission}
                                />
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <UsersTeamsSelection
                                    data={usersTeamsSelectionData}
                                    onRemoveAccess={removeUserTeam}
                                />
                            </Cell>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <DialogCancel onClick={closeDialog}>Close</DialogCancel>
                        <ButtonPrimary onClick={submit}>Save</ButtonPrimary>
                    </DialogActions>
                </>
            )}
        </DialogContainer>
    );
};
