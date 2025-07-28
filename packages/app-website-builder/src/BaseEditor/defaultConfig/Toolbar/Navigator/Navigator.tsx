import React, { useMemo, useCallback } from "react";
import get from "lodash/get";
import { observer } from "mobx-react-lite";
import { type NodeDto, Tree, type TreeProps, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as VisibilityNone } from "@webiny/icons/visibility_off.svg";
import type { Document } from "@webiny/website-builder-sdk";
import { useActiveElement } from "~/BaseEditor/hooks/useActiveElement";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor";
import { EditorState } from "~/editorSdk/Editor";
import { useDocumentEditor } from "~/DocumentEditor";
import { Commands } from "~/BaseEditor";
import { InlineSvg } from "~/BaseEditor/defaultConfig/Toolbar/InsertElements/InlineSvg";
import { InfoMessage } from "~/BaseEditor/defaultConfig/Sidebar/InfoMessage";
import { useStyles } from "~/BaseEditor/hooks/useStyles";

// Node type for the Tree component.
type ElementNode = NodeDto<{
    draggable: boolean;
    icon: React.ReactNode;
    parent: {
        id: string;
        slot: string;
        index: number;
    };
}>;

// Element data extracted from the Document state.
type ElementNodeData = {
    id: string;
    label: string;
    image: string;
    canDrag: boolean;
    parent: {
        id: string;
        slot: string;
        index: number;
    };
};

function flattenElements(elements: Record<string, ElementNodeData>, activeElementId?: string) {
    const result: ElementNode[] = [];
    const asArray = Object.values(elements);

    for (const key in elements) {
        const node = elements[key];

        // Skip root element.
        if (!node.parent) {
            continue;
        }

        result.push({
            id: node.id,
            label: node.label,
            parentId: node.parent.id,
            active: node.id === activeElementId,
            droppable: asArray.filter(el => el.parent?.id === node.id).length > 0,
            data: {
                parent: node.parent,
                icon: node.image ? (
                    <InlineSvg src={node.image} className={"wby-fill-neutral-strong"} />
                ) : (
                    <></>
                ),
                draggable: node.canDrag
            }
        });
    }

    return result;
}

interface GetElementNodeDataParams {
    components: EditorState["components"];
    elements: Document["elements"];
    bindings: Document["bindings"];
}

function getElementNodeData({
    components,
    elements,
    bindings
}: GetElementNodeDataParams): Record<string, ElementNodeData> {
    const getIndex = (elementId: string, parentId: string, slot: string) => {
        const elementBindings = bindings[parentId];
        if (!elementBindings) {
            return -1;
        }

        const slotValue = get(elementBindings, `inputs.${slot}`);
        if (!slotValue) {
            return -1;
        }

        if (slotValue.list) {
            return slotValue.static.indexOf(elementId);
        }

        return -1;
    };

    return Object.values(elements).reduce((acc, element) => {
        if (element.id === "root") {
            return {
                ...acc,
                [element.id]: {
                    id: element.id,
                    label: "Root",
                    image: ""
                }
            };
        }

        const component = components[element.component.name] ?? {
            label: "",
            image: null,
            canDrag: false
        };

        const parentId = element.parent!.id;
        const slot = element.parent!.slot;

        return {
            ...acc,
            [element.id]: {
                id: element.id,
                label: component?.label ?? component?.name ?? "",
                image: component.image,
                canDrag: component.canDrag,
                parent: {
                    id: parentId,
                    slot,
                    index: getIndex(element.id, parentId, slot)
                }
            }
        };
    }, {});
}

export const Navigator = observer(() => {
    const editor = useDocumentEditor();
    const [activeElement] = useActiveElement();

    const document = editor.getDocumentState().read();
    const elements = document.elements;
    const bindings = document.bindings;
    const treeKey = document.id;

    const components = useSelectFromEditor(state => {
        return state.components;
    });

    const elementNodes = getElementNodeData({ components, elements, bindings });

    const activeAncestors = useMemo(() => {
        if (!activeElement) {
            return [];
        }

        const ancestors: string[] = [activeElement.id];
        let parent = elementNodes[activeElement.id].parent;
        while (parent) {
            ancestors.push(parent.id);
            parent = elementNodes[parent.id].parent;
        }
        return ancestors.reverse();
    }, [elementNodes, activeElement]);

    const nodes = useMemo(() => {
        return flattenElements(elementNodes, activeElement?.id).sort((a, b) => {
            return a.data!.parent.index - b.data!.parent.index;
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

    const renderer: TreeProps["renderer"] = node => {
        return (
            <Tree.Item.Content
                data-node-id={node.id}
                onMouseOver={highlightElement}
                onClick={activateElement}
            >
                <Tree.Item.Icon label={node.label} element={node.icon} size={"sm"} />
                {node.label}
                <div className={"wby-flex wby-w-full wby-justify-end"}>
                    <ElementActions elementId={node.id} />
                </div>
            </Tree.Item.Content>
        );
    };

    if (Object.keys(elementNodes).length <= 1) {
        return <InfoMessage message={"No elements to display."} />;
    }

    return (
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
            placeholderRender={(node, { depth }) => {
                return <Placeholder depth={depth} node={node} />;
            }}
            onDrop={(newTree, { dragSource }) => {
                if (!dragSource || !dragSource.data) {
                    return;
                }

                const parent = dragSource.data.parent;

                const sameLevelNodes = newTree.filter(n => n.parentId === dragSource.parentId);
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
                // Only allow dropping within the same parent (for now).
                if (dragSource?.parentId === dropTargetId) {
                    return true;
                }
                return false;
            }}
        />
    );
});

type PlaceholderProps = {
    node: any;
    depth: number;
};

const Placeholder = (props: PlaceholderProps) => (
    <div
        className={"wby-bg-primary-default"}
        style={{
            height: 2,
            zIndex: 999,
            position: "absolute",
            right: 0,
            transform: "translateY(-50%)",
            top: -2,
            left: props.depth * 24
        }}
    ></div>
);

const ElementActions = ({ elementId }: { elementId: string }) => {
    const { styles, onChange } = useStyles(elementId);

    const isVisible = styles.display !== "none";

    const unhideElement = () => {
        onChange(({ styles }) => {
            styles.set("display", "flex");
        });
    };

    if (isVisible) {
        return null;
    }

    return (
        <div className={"wby-flex"}>
            <Tooltip
                trigger={
                    <Tree.Item.Icon
                        size={"sm"}
                        className={"wby-cursor-pointer"}
                        element={<VisibilityNone />}
                        label={"This element is hidden."}
                        onClick={unhideElement}
                    />
                }
                content={"This element is hidden. Click to unhide."}
            />
        </div>
    );
};
