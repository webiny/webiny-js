// Get the plugin via which the page element was registered and check if the `onReceived` method is defined.
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin } from "~/types";
import type { Element } from "@webiny/app-page-builder-elements/types";

export const elementIsDraggable = (element: Element) => {
    const elementPlugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(item => item.elementType === element.type);

    if (!elementPlugin) {
        return false;
    }

    return Array.isArray(elementPlugin.target) && elementPlugin.target.length > 0;
};
