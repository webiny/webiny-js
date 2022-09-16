import React, { useEffect, useState } from "react";

import { useQuery, useMutation } from "@apollo/react-hooks";
import { Tree, getBackendOptions, MultiBackend } from "@minoru/react-dnd-treeview";
import { DndProvider } from "react-dnd";

import { LIST_FOLDERS, UPDATE_FOLDER } from "~/graphql/folders.gql";

import { FolderItem } from "~/types";

interface DndItem {
    id: string;
    parent: string | number;
    text: string;
    droppable: boolean;
}

const handleData = (data: FolderItem[]): DndItem[] => {
    return data.map(({ id, parentId, name }) => ({
        id,
        parent: parentId || 0,
        text: name,
        droppable: true
    }));
};

const updateFolder = (folderId, parentId) => {
    return useMutation(UPDATE_FOLDER, {
        variables: { id: folderId, parentId: parentId }
    });
};

export const FoldersTree: React.FC = ({ type }) => {
    const { data = [] } = useQuery(LIST_FOLDERS, {
        variables: { type }
    });

    const [treeData, setTreeData] = useState<DndItem[]>([]);
    const handleDrop = (newTree: DndItem[], { dragSourceId, dropTargetId }) => {
        // Do something
        const { data } = updateFolder(dragSourceId, dropTargetId);
        console.log("data", data);
        setTreeData(newTree);
    };

    useEffect(() => {
        if (data?.folders?.listFolders?.data) {
            const newData = handleData(data?.folders?.listFolders?.data);
            setTreeData(newData);
        }
    }, [data]);

    return (
        <>
            <pre>{JSON.stringify(treeData)}</pre>
            <DndProvider backend={MultiBackend} options={getBackendOptions()}>
                <Tree
                    tree={treeData}
                    rootId={0}
                    onDrop={handleDrop}
                    render={(node, { depth, isOpen, onToggle }) => (
                        <div style={{ marginLeft: depth * 10 }}>
                            {node.droppable && (
                                <span onClick={onToggle}>{isOpen ? "[-]" : "[+]"}</span>
                            )}
                            {node.text}
                        </div>
                    )}
                />
            </DndProvider>
        </>
    );
};
