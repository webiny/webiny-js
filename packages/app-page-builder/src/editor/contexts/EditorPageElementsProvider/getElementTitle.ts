import { PbEditorPageElementPlugin } from "~/types";
import { plugins } from "@webiny/plugins";

const titlesCache: Record<string, string> = {};

/**
 * Returns element title from element's plugin. If plugin is not found, it will
 * return the element type. A simple cache was added to avoid unnecessary lookups.
 */
export const getElementTitle = (elementType: string, suffix?: string): string => {
    if (elementType in titlesCache) {
        return titlesCache[elementType];
    }

    titlesCache[elementType] = elementType;

    const elementEditorPlugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(item => item.elementType === elementType);

    if (!elementEditorPlugin) {
        return titlesCache[elementType];
    }

    const toolbarTitle = elementEditorPlugin?.toolbar?.title;
    if (typeof toolbarTitle === "string") {
        titlesCache[elementType] = toolbarTitle;
    } else {
        // Upper-case first the type.
        titlesCache[elementType] = elementType.charAt(0).toUpperCase() + elementType.slice(1);
    }

    titlesCache[elementType] = suffix
        ? `${titlesCache[elementType]} | ${suffix}`
        : titlesCache[elementType];

    return titlesCache[elementType];
};
