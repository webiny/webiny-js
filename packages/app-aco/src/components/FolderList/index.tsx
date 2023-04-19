import React, { useState } from "react";

import { i18n } from "@webiny/app/i18n";

import { FolderItem } from "~/types";
import { CreateFolder, Folder } from "~/components/FolderList/Folder";
import { List } from "~/components/FolderList/styled";
import { FolderDialogCreate, FolderDialogDelete, FolderDialogUpdate } from "~/components";

const t = i18n.ns("app-aco/components/tree/dialog-create");

interface FolderListProps {
    type: string;
    folders: FolderItem[];
    onFolderClick: (folder: FolderItem) => void;
}

export const FolderList: ({
    type,
    folders,
    onFolderClick
}: FolderListProps) => null | JSX.Element = ({ type, folders, onFolderClick }: FolderListProps) => {
    const [selectedFolder, setSelectedFolder] = useState<FolderItem>();
    const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
    const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

    if (folders.length === 0) {
        return null;
    }

    return (
        <>
            <List>
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
                <CreateFolder onClick={() => setCreateDialogOpen(true)} />
            </List>
            <FolderDialogCreate
                type={type}
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                currentParentId={undefined}
            />
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
