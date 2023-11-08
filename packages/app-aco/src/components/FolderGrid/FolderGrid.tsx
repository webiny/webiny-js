import React from "react";

import { FolderProvider } from "~/contexts/folder";
import { Folder } from "~/components/FolderGrid/Folder";
import { Grid } from "~/components/FolderGrid/styled";
import { AcoListWithConfig } from "~/config";
import { FolderItem } from "~/types";

interface FolderGridProps {
    folders: FolderItem[];
    onFolderClick: (id: string) => void;
}

export const FolderGrid: React.VFC<FolderGridProps> = ({ folders, onFolderClick }) => {
    if (folders.length === 0) {
        return null;
    }

    return (
        <AcoListWithConfig>
            <Grid>
                {folders.map(folder => (
                    <FolderProvider key={folder.id} folder={folder}>
                        <Folder onClick={onFolderClick} />
                    </FolderProvider>
                ))}
            </Grid>
        </AcoListWithConfig>
    );
};
