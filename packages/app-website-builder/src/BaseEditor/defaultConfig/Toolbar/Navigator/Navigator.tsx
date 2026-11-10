import React, { useMemo, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { type TreeProps, Tree, ScrollArea } from "@webiny/admin-ui";
import { useActiveElement } from "~/BaseEditor/hooks/useActiveElement.js";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { Commands } from "~/BaseEditor/index.js";
import { NavigatorEmptyState } from "./NavigatorEmptyState.js";
import { Placeholder } from "./Placeholder.js";
import { ElementActions } from "./ElementActions.js";
import { flattenElements, getElementNodeData, getGlobalNodeIndexes } from "./navigatorUtils.js";

export const Navigator = observer(() => {
    const editor = useDocumentEditor();
    const [activeElement] = useActiveElement();

    const document = editor.getDocumentState().read();
    const elements = document.elements;
    const bindings = document.bindings;
    const treeKey = document.id;

    const components = useSelectFromEditor(state => state.components);

    const layout = useSelectFromEditor(state => state.layout);
    const globalIndexes = getGlobalNodeIndexes(layout);

    const elementNodes = getElementNodeData({
        components,
        elements,
        bindings,
        globalIndexes,
        layout,
        pageLayout: document.layout
    });

    const activeAncestors = useMemo(() => {
        if (!activeElement) {
            return [];
        }
        const ancestors: string[] = [activeElement.id];
        let parentId = elementNodes[activeElement.id]?.nodeParentId;
        while (parentId && !ancestors.includes(parentId)) {
            ancestors.push(parentId);
            parentId = elementNodes[parentId]?.nodeParentId;
        }
        return ancestors.reverse();
    }, [elementNodes, activeElement]);

    const nodes = useMemo(() => {
        return flattenElements(elementNodes, activeElement?.id).sort((a, b) => {
            return elementNodes[a.id].order! - elementNodes[b.id].order!;
        });
    }, [elementNodes, activeElement]);

    const highlightElement = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        const nodeId = e.currentTarget.getAttribute("data-node-id");
        if (nodeId) {
            editor.executeCommand(Commands.HighlightElement, { id: nodeId });
        }
    }, []);

    const activateElement = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        const nodeId = e.currentTarget.getAttribute("data-node-id");
        if (nodeId) {
            editor.executeCommand(Commands.SelectElement, { id: nodeId });
        }
    }, []);

    const renderer: TreeProps["renderer"] = node => (
        <Tree.Item.Content
            data-node-id={node.id}
            onMouseOver={highlightElement}
            onClick={activateElement}
        >
            <Tree.Item.Icon label={node.label} element={node.icon} size={"sm"} />
            {node.label}
            <div className={"flex w-full justify-end"}>
                <ElementActions elementId={node.id} />
            </div>
        </Tree.Item.Content>
    );

    if (Object.keys(elementNodes).length <= 1) {
        return <NavigatorEmptyState />;
    }

    return (
        <ScrollArea className={"h-full pt-xs"}>
            <Tree
                key={treeKey}
                autoExpandOnDragOver={false}
                insertDroppableFirst={false}
                nodes={nodes}
                rootId={"root"}
                renderer={renderer}
                sort={false}
                defaultOpenNodeIds={activeAncestors}
                dropTargetOffset={5}
                placeholderRender={(node, { depth }) => <Placeholder node={node} depth={depth} />}
                onDrop={(newTree, { dragSource }) => {
                    if (!dragSource || !dragSource.data) {
                        return;
                    }
                    const parent = dragSource.data.parent;
                    // Only the elements of the same slot count: the layout's elements, and globals
                    // placed by the frontend's layout, are listed with them, but aren't in it.
                    const sameLevelNodes = newTree.filter(
                        n =>
                            n.parentId === dragSource.parentId &&
                            n.data?.parent.id === parent.id &&
                            n.data?.parent.slot === parent.slot
                    );
                    const newIndex = sameLevelNodes.findIndex(n => n.id === dragSource.id);
                    editor.executeCommand(Commands.MoveElement, {
                        elementId: dragSource.id,
                        parentId: parent.id,
                        slot: parent.slot,
                        index: newIndex
                    });
                }}
                canDrag={node => node.data?.draggable ?? true}
                canDrop={(_, { dragSource, dropTargetId }) => {
                    if (dragSource?.parentId === dropTargetId) {
                        return true;
                    }
                    return false;
                }}
            />
        </ScrollArea>
    );
});
