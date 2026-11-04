import type { LayoutContentArea } from "@webiny/website-builder-sdk";

// What a content area is called on the canvas. Its name is only a label: content is stored by its slot.
export const getContentAreaLabel = (area: LayoutContentArea) => {
    if (area.isMain()) {
        return "Main content";
    }
    return area.name() ?? "Named content";
};
