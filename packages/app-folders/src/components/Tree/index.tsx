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

type Props = {
    type: string;
    title: string;
    onFolderClick: (data: NodeModel<DndItemData>["data"]) => void;
    onTitleClick?: (event: React.MouseEvent<HTMLElement>) => void;
    focusedFolderId?: string;
};

export const FolderTree: React.FC<Props> = ({
    type,
    title,
    focusedFolderId,
    onFolderClick,
    onTitleClick
}) => {
    const { folders } = useFolders(type);
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
                        type={type}
                        folders={folders}
                        onFolderClick={onFolderClick}
                        focusedFolderId={focusedFolderId}
                        onDragStart={() => setIsDragging(true)}
                        onDragEnd={() => setIsDragging(false)}
                    />
                    <CreateButton onClick={() => setCreateDialogOpen(true)} />
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
            <FolderDialogCreate
                type={type}
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                parentId={undefined}
            />
        </Container>
    );
};
