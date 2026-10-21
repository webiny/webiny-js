import type { NodeDto } from "@webiny/admin-ui";
import type { Document, PageLayout } from "@webiny/website-builder-sdk";
import { getGlobalRootId, LayoutContentArea, GlobalElementId } from "@webiny/website-builder-sdk";
import type { EditorState } from "~/editorSdk/Editor.js";
import { InlineSvg } from "~/BaseEditor/defaultConfig/Toolbar/InsertElements/InlineSvg.js";
import React from "react";
import get from "lodash/get.js";

// Where an element sits in the document: moves are made there. Elements the document doesn't own (a
// global's instance placed by the frontend, a layout's element) have no slot.
type DocumentPosition = {
    id: string;
    slot: string;
    index: number;
};

export type ElementNode = NodeDto<{
    draggable: boolean;
    icon: React.ReactNode;
    parent: DocumentPosition;
}>;

export type ElementNodeData = {
    id: string;
    label: string;
    image: string;
    canDrag: boolean;
    // The node the Navigator lists the element under, and its position among that node's children.
    nodeParentId: string;
    order: number;
    parent: DocumentPosition;
};

type RootNodeData = Pick<ElementNodeData, "id" | "label" | "image"> & Partial<ElementNodeData>;

export function flattenElements(
    elements: Record<string, RootNodeData>,
    activeElementId?: string
): ElementNode[] {
    const result: ElementNode[] = [];
    const asArray = Object.values(elements);

    for (const key in elements) {
        const node = elements[key];

        if (!node.parent || !node.nodeParentId) {
            continue;
        }

        result.push({
            id: node.id,
            label: node.label,
            parentId: node.nodeParentId,
            active: node.id === activeElementId,
            droppable: asArray.filter(el => el.nodeParentId === node.id).length > 0,
            data: {
                parent: node.parent,
                icon: node.image ? (
                    <InlineSvg src={node.image} className={"fill-neutral-strong"} />
                ) : (
                    <></>
                ),
                draggable: Boolean(node.canDrag)
            }
        });
    }

    return result;
}

/**
 * A global's instance has no parent: in a page without a layout of its own, the frontend's layout places
 * it around the page content (placements in the page or a layout are elements of their own). List it at the top
 * level in layout order, before the page content if the layout renders it first, after it otherwise.
 * Layout order, not canvas position: a dialog's backdrop sits at the top of the canvas while it's open.
 */
export function getGlobalNodeIndexes(layout: string[]): Record<string, number> {
    const rootIndex = layout.indexOf("root");
    const globalIds = layout.filter(id => GlobalElementId.isGlobal(id));

    return globalIds.reduce<Record<string, number>>((acc, id, index) => {
        const isBefore = layout.indexOf(id) < rootIndex;
        return {
            ...acc,
            // Both stay in layout order: after the page content, indexes still grow with `index`.
            [id]: isBefore
                ? index - globalIds.length
                : Number.MAX_SAFE_INTEGER - globalIds.length + index
        };
    }, {});
}

interface GetElementNodeDataParams {
    components: EditorState["components"];
    elements: Document["elements"];
    bindings: Document["bindings"];
    globalIndexes?: Record<string, number>;
    // The page root and the globals the preview renders, in layout order (see `EditorState["layout"]`).
    layout?: string[];
    // In the page editor: the layout the page is rendered in.
    pageLayout?: PageLayout | null;
}

const getSlotIndex = (
    bindings: Document["bindings"],
    elementId: string,
    parentId: string,
    slot: string
) => {
    const slotValue = get(bindings[parentId], `inputs.${slot}`);
    if (slotValue?.list && Array.isArray(slotValue.static)) {
        return slotValue.static.indexOf(elementId);
    }

    return -1;
};

const getLabel = (components: EditorState["components"], componentName: string) => {
    const component = components[componentName];
    return {
        label: component?.label ?? component?.name ?? "",
        image: component?.image ?? "",
        canDrag: component ? component.canDrag !== false : false
    };
};

/**
 * In the page editor, a page is rendered in its layout: the layout's elements are listed with the page's
 * own, where the layout places them. Each content area is listed too, with the page's content of it under
 * it, so the layout's elements and the page's content read as one tree, as on the canvas. The layout's
 * elements, content areas included, can be selected, but not moved: the layout places them.
 */
const getPageLayoutNodes = (
    components: EditorState["components"],
    elements: Document["elements"],
    pageLayout: PageLayout
) => {
    const layoutNodes: Record<string, ElementNodeData> = {};
    // The content area node listing the page's content of each root slot.
    const areas: Record<string, string> = {};

    for (const element of Object.values(pageLayout.elements)) {
        if (element.id === "root" || elements[element.id] || !element.parent) {
            continue;
        }

        const { id: parentId, slot } = element.parent;
        const order = getSlotIndex(pageLayout.bindings, element.id, parentId, slot);
        const node = getLabel(components, element.component.name);

        const area = LayoutContentArea.from(pageLayout, element.id);
        if (area) {
            areas[area.slot()] = areas[area.slot()] ?? element.id;
            if (area.isMain()) {
                node.label = node.label || "Main content";
            } else {
                node.label = area.name() || node.label || "Named content";
            }
        }

        layoutNodes[element.id] = {
            id: element.id,
            ...node,
            canDrag: false,
            nodeParentId: parentId,
            order,
            parent: { id: parentId, slot: "", index: order }
        };
    }

    return { layoutNodes, areas };
};

export function getElementNodeData({
    components,
    elements,
    bindings,
    globalIndexes = {},
    layout = [],
    pageLayout
}: GetElementNodeDataParams): Record<string, RootNodeData> {
    const hasPageLayout = Boolean(pageLayout && Object.keys(pageLayout.elements ?? {}).length);
    const { layoutNodes, areas } = hasPageLayout
        ? getPageLayoutNodes(components, elements, pageLayout!)
        : { layoutNodes: {}, areas: {} };

    // A global's instance (and what's inside it) is listed only where the frontend's layout renders it
    // directly. Placed in the page or a layout, it's listed as its placements instead.
    const isListed = (elementId: string) => {
        const globalId = getGlobalRootId(elements, elementId);
        return globalId === null || (!hasPageLayout && layout.includes(globalId));
    };

    const nodes: Record<string, RootNodeData> = {
        ...layoutNodes
    };

    for (const element of Object.values(elements)) {
        if (element.id === "root") {
            nodes.root = { id: element.id, label: "Root", image: "" };
            continue;
        }

        if (!isListed(element.id)) {
            continue;
        }

        const { image, canDrag, ...rest } = getLabel(components, element.component.name);
        // A named content area is listed by the name its author gave it.
        const label =
            element.component.name === LayoutContentArea.NAMED_COMPONENT
                ? LayoutContentArea.from({ elements, bindings }, element.id)?.name() || rest.label
                : rest.label;

        // A global's instance placed by the frontend's layout is listed under the root, though it isn't in
        // any of the root's slots. It can't be moved: the frontend places it.
        if (GlobalElementId.isGlobal(element.id)) {
            const order = globalIndexes[element.id] ?? Number.MAX_SAFE_INTEGER;
            nodes[element.id] = {
                id: element.id,
                label,
                image,
                canDrag: false,
                nodeParentId: "root",
                order,
                parent: { id: "root", slot: "", index: order }
            };
            continue;
        }

        const { id: parentId, slot } = element.parent!;
        const index = getSlotIndex(bindings, element.id, parentId, slot);
        let nodeParentId = parentId;
        let order = index;

        // The page's content is listed under its content area, in the page's own order. Content of an
        // area the layout doesn't have isn't on the canvas: it's listed last.
        if (hasPageLayout && parentId === "root") {
            const area = areas[slot];
            nodeParentId = area ?? "root";
            order = area ? index : Number.MAX_SAFE_INTEGER;
        }

        nodes[element.id] = {
            id: element.id,
            label,
            image,
            canDrag,
            nodeParentId,
            order,
            parent: { id: parentId, slot, index }
        };
    }

    return nodes;
}
