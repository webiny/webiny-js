import React, { useState } from "react";
import { useFolders } from "~/hooks/useFolders";
import { CreateButton } from "./ButtonCreate";
import { Empty } from "./Empty";
import { Loader } from "./Loader";
import { List } from "./List";
import { FolderDialogCreate } from "~/components";
import { Container } from "./styled";
import { FolderItem } from "~/types";

export interface FolderTreeProps {
    onFolderClick: (data: FolderItem) => void;
    enableCreate?: boolean;
    enableActions?: boolean;
    focusedFolderId?: string;
    hiddenFolderIds?: string[];
}

export const FolderTree: React.VFC<FolderTreeProps> = ({
    focusedFolderId,
    hiddenFolderIds,
    enableActions,
    enableCreate,
    onFolderClick
}) => {
    const { folders } = useFolders();
    const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);

    const renderList = () => {
        if (!folders) {
            return <Loader />;
        }

        if (folders.length > 0) {
            return (
                <>
                    <List
                        folders={folders}
                        onFolderClick={onFolderClick}
                        focusedFolderId={focusedFolderId}
                        hiddenFolderIds={hiddenFolderIds}
                        enableActions={enableActions}
                    />
                    {enableCreate && <CreateButton onClick={() => setCreateDialogOpen(true)} />}
                </>
            );
        }

        return (
            <>
                <Empty />
                <CreateButton onClick={() => setCreateDialogOpen(true)} />
            </>
        );
    };
    return (
        <Container>
            {renderList()}
            {enableCreate && (
                <FolderDialogCreate
                    open={createDialogOpen}
                    onClose={() => setCreateDialogOpen(false)}
                    currentParentId={focusedFolderId}
                />
            )}
        </Container>
    );
};
