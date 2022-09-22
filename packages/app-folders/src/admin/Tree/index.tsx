import React, { useEffect, useState } from "react";

import {
    Tree,
    getBackendOptions,
    MultiBackend,
    NodeModel,
    DropOptions
} from "@minoru/react-dnd-treeview";
import { DndProvider } from "react-dnd";

import { useListFolders, useUpdateFolder } from "~/hooks";

import { Node } from "./Node";
import { Container, TreeRoot } from "./styled";

import { DndItem, FolderItem } from "~/types";

type Props = {
    type: string;
};

const handleData = (data: FolderItem[]): DndItem[] => {
    return data.map(({ id, parentId, name }) => ({
        id,
        parent: parentId || 0,
        text: name,
        droppable: true
    }));
};

export const FolderTree: React.FC<Props> = ({ type }) => {
    const [treeData, setTreeData] = useState<NodeModel<DndItem>[]>([]);

    const { folders, loading: listLoading } = useListFolders(type);
    const { update } = useUpdateFolder();

    const handleDrop = async (
        newTree: NodeModel<DndItem>[],
        { dragSourceId, dropTargetId }: DropOptions
    ) => {
        setTreeData(newTree);
        await update({ variables: { id: dragSourceId, data: { parentId: dropTargetId } } });
    };

    useEffect(() => {
        if (!listLoading) {
            const newData = handleData(folders);
            setTreeData(newData);
        }
    }, [folders, listLoading]);

    const onNodeClick = (id: any) => {
        console.log("hello", id);
    };

    return (
        <div className={Container}>
            <DndProvider backend={MultiBackend} options={getBackendOptions()}>
                <Tree
                    tree={treeData}
                    rootId={0}
                    onDrop={handleDrop}
                    sort={false}
                    render={(node, { depth, isOpen, onToggle }) => (
                        <Node
                            node={node}
                            depth={depth}
                            isOpen={isOpen}
                            onToggle={onToggle}
                            onClick={onNodeClick}
                        />
                    )}
                    classes={{
                        root: TreeRoot
                    }}
                />
            </DndProvider>
        </div>
    );
};
