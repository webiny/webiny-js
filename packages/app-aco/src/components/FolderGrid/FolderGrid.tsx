import React, { useState } from "react";

import {
    FolderDialogDelete,
    FolderDialogUpdate,
    FolderDialogManagePermissions
} from "~/components";

import { Folder } from "~/components/FolderGrid/Folder";
import { Grid } from "~/components/FolderGrid/styled";

import { FolderItem } from "~/types";

interface FolderGridProps {
    folders: FolderItem[];
    onFolderClick: (id: string) => void;
}

export const FolderGrid: React.VFC<FolderGridProps> = ({ folders, onFolderClick }) => {
    const [selectedFolder, setSelectedFolder] = useState<FolderItem>();
    const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [managePermissionsDialogOpen, setManagePermissionsDialogOpen] = useState<boolean>(false);

    if (folders.length === 0) {
        return null;
    }

    return (
        <>
            <Grid>
                {folders.map(folder => (
                    <Folder
                        key={folder.id}
                        folder={folder}
                        onFolderClick={onFolderClick}
                        onMenuEditClick={() => {
                            setUpdateDialogOpen(true);
                            setSelectedFolder(folder);
                        }}
                        onMenuDeleteClick={() => {
                            setDeleteDialogOpen(true);
                            setSelectedFolder(folder);
                        }}
                        onMenuManagePermissionsClick={() => {
                            setManagePermissionsDialogOpen(true);
                            setSelectedFolder(folder);
                        }}
                    />
                ))}
            </Grid>
            {selectedFolder && (
                <>
                    <FolderDialogUpdate
                        folder={selectedFolder}
                        open={updateDialogOpen}
                        onClose={() => setUpdateDialogOpen(false)}
                    />
                    <FolderDialogDelete
                        folder={selectedFolder}
                        open={deleteDialogOpen}
                        onClose={() => setDeleteDialogOpen(false)}
                    />
                    <FolderDialogManagePermissions
                        folder={selectedFolder}
                        open={managePermissionsDialogOpen}
                        onClose={() => setManagePermissionsDialogOpen(false)}
                    />
                </>
            )}
        </>
    );
};
