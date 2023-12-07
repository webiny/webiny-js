import React from "react";

import { FolderProvider } from "~/contexts/folder";
import { Folder } from "~/components/FolderGrid/Folder";
import { Grid } from "~/components/FolderGrid/styled";
import { AcoWithConfig } from "~/config";
import { FolderItem } from "~/types";

interface FolderGridProps {
    folders: FolderItem[];
    onFolderClick: (id: string) => void;
}

export const FolderGrid = ({ folders, onFolderClick }: FolderGridProps) => {
    if (folders.length === 0) {
        return null;
    }

    return (
        <AcoWithConfig>
            <Grid>
                {folders.map(folder => (
                    <FolderProvider key={folder.id} folder={folder}>
                        <Folder onClick={onFolderClick} />
                    </FolderProvider>
                ))}
            </Grid>
        </AcoWithConfig>
    );
};
