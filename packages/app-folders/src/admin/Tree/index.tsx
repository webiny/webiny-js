import React, { useEffect, useState } from "react";

import { useQuery, useMutation } from "@apollo/react-hooks";
import {
    Tree,
    getBackendOptions,
    MultiBackend,
    NodeModel,
    DropOptions
} from "@minoru/react-dnd-treeview";
import { DndProvider } from "react-dnd";

import { LIST_FOLDERS, UPDATE_FOLDER } from "~/graphql/folders.gql";

import { Node } from "./Node";
import { Container, TreeRoot } from "./styled";

import { DndItem, FolderItem } from "~/types";

const handleData = (data: FolderItem[]): DndItem[] => {
    return data.map(({ id, parentId, name }) => ({
        id,
        parent: parentId || 0,
        text: name,
        droppable: true
    }));
};

export const FolderTree: React.FC = ({ type }) => {
    const [treeData, setTreeData] = useState<NodeModel<DndItem>[]>([]);

    const { data = [] } = useQuery(LIST_FOLDERS, {
        variables: { type }
    });

    const [updateGqlFolder] = useMutation(UPDATE_FOLDER);

    const handleDrop = async (
        newTree: NodeModel<DndItem>[],
        { dragSourceId, dropTargetId }: DropOptions
    ) => {
        setTreeData(newTree);
        await updateGqlFolder({ variables: { id: dragSourceId, parentId: dropTargetId || null } });
    };

    useEffect(() => {
        if (data?.folders?.listFolders?.data) {
            const newData = handleData(data?.folders?.listFolders?.data);
            setTreeData(newData);
        }
    }, [data]);

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
