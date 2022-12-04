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

    return (
        <Container>
            <Title title={title} onClick={onTitleClick} />
            {!folders ? (
                <Loader />
            ) : folders.length > 0 ? (
                <>
                    <List
                        type={type}
                        folders={folders}
                        onFolderClick={onFolderClick}
                        focusedFolderId={focusedFolderId}
                    />
                    <CreateButton onClick={() => setCreateDialogOpen(true)} />
                </>
            ) : (
                <>
                    <Empty />
                    <CreateButton onClick={() => setCreateDialogOpen(true)} />
                </>
            )}
            <FolderDialogCreate
                type={type}
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                parentId={undefined}
            />
        </Container>
    );
};
