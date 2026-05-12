import type { NodeDto } from "@webiny/admin-ui";
import type { Document } from "@webiny/website-builder-sdk";
import type { EditorState } from "~/editorSdk/Editor.js";
import { InlineSvg } from "~/BaseEditor/defaultConfig/Toolbar/InsertElements/InlineSvg.js";
import React from "react";
import get from "lodash/get.js";

export type ElementNode = NodeDto<{
    draggable: boolean;
    icon: React.ReactNode;
    parent: {
        id: string;
        slot: string;
        index: number;
    };
}>;

export type ElementNodeData = {
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

export function flattenElements(
    elements: Record<string, ElementNodeData>,
    activeElementId?: string
): ElementNode[] {
    const result: ElementNode[] = [];
    const asArray = Object.values(elements);

    for (const key in elements) {
        const node = elements[key];

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
                    <InlineSvg src={node.image} className={"fill-neutral-strong"} />
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

export function getElementNodeData({
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
            return { ...acc, [element.id]: { id: element.id, label: "Root", image: "" } };
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
