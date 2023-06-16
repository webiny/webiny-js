import React, { useState } from "react";
import { NodeModel } from "@minoru/react-dnd-treeview";
import { useFolders } from "~/hooks/useFolders";
import { CreateButton } from "./ButtonCreate";
import { Empty } from "./Empty";
import { Loader } from "./Loader";
import { List } from "./List";
import { FolderDialogCreate } from "~/components";
import { Container } from "./styled";
import { DndItemData } from "~/types";

interface FolderTreeProps {
    onFolderClick: (data: NodeModel<DndItemData>["data"]) => void;
    enableCreate?: boolean;
    enableActions?: boolean;
    onTitleClick?: (event: React.MouseEvent<HTMLElement>) => void;
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
                    currentParentId={undefined}
                />
            )}
        </Container>
    );
};
