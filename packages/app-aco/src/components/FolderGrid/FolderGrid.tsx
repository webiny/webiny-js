import React, { useState } from "react";

import { FolderDialogDelete, FolderDialogUpdate } from "~/components";

import { Folder } from "~/components/FolderGrid/Folder";
import { Grid } from "~/components/FolderGrid/styled";

import { FolderItem } from "~/types";

interface FolderGridProps {
    folders: FolderItem[];
    onFolderClick: (folder: FolderItem) => void;
}

export const FolderGrid: ({ folders, onFolderClick }: FolderGridProps) => null | JSX.Element = ({
    folders,
    onFolderClick
}) => {
    const [selectedFolder, setSelectedFolder] = useState<FolderItem>();
    const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

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
                </>
            )}
        </>
    );
};
