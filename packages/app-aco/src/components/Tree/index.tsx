import React, { useState } from "react";
import { NodeModel } from "@minoru/react-dnd-treeview";
import { useFolders } from "~/hooks/useFolders";
import { CreateButton } from "./ButtonCreate";
import { Empty } from "~/components/Tree/Empty";
import { Loader } from "./Loader";
import { List } from "./List";
import { Title } from "./Title";
import { FolderDialogCreate } from "~/components";
import { Container } from "./styled";
import { DndItemData } from "~/types";

interface Props {
    title: string;
    onFolderClick: (data: NodeModel<DndItemData>["data"]) => void;
    enableCreate?: boolean;
    enableActions?: boolean;
    onTitleClick?: (event: React.MouseEvent<HTMLElement>) => void;
    focusedFolderId?: string;
    hiddenFolderIds?: string[];
}

export const FolderTree: React.FC<Props> = ({
    title,
    focusedFolderId,
    hiddenFolderIds,
    enableActions,
    enableCreate,
    onFolderClick,
    onTitleClick
}) => {
    const { folders } = useFolders();
    const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);

    // Little CSS trick here: since the folder title has absolute position, user can drag a folder over it and move it to root folder.
    // While we are moving folders around we disable any title pointer event.
    const [isDragging, setIsDragging] = useState<boolean>(false);

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
                        onDragStart={() => setIsDragging(true)}
                        onDragEnd={() => setIsDragging(false)}
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
            <Title title={title} onClick={onTitleClick} isDragging={isDragging} />
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
