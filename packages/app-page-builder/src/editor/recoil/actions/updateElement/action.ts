import { UpdateElementActionArgsType } from "./types";
import { EventActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { PbElement } from "@webiny/app-page-builder/types";
import lodashCloneDeep from "lodash/cloneDeep";
import lodashGet from "lodash/get";
import lodashMerge from "lodash/merge";
import lodashSet from "lodash/set";
import { PageAtomType } from "@webiny/app-page-builder/editor/recoil/modules";
import {
    flattenContentUtil,
    saveEditorPageRevisionUtil,
    updateChildPathsUtil
} from "@webiny/app-page-builder/editor/recoil/utils";

const createElementWithoutElementsAsString = (element: PbElement): PbElement => {
    if (!element.elements || typeof element.elements[0] !== "string") {
        return element;
    }
    return {
        ...element,
        elements: []
    };
};
/**
 * when element update happens:
 * 1. update page content
 * 2. flatten content and update elements
 * 3. save revision if revision history is allowed
 */

const cloneAndMergePageContentState = (page: PageAtomType, element: PbElement, merge: boolean) => {
    const newElement = updateChildPathsUtil(createElementWithoutElementsAsString(element));
    if (!merge) {
        return {
            ...(page.content || {}),
            ...newElement
        };
    }
    return lodashMerge(page.content, newElement);
};
/**
 * TODO find a better way
 * this builds new page content state
 * using dot-prop-immutable so we can target deeply nested elements
 */
const buildNewPageContentState = (
    { content }: PageAtomType,
    element: PbElement,
    merge: boolean
) => {
    const newElement = updateChildPathsUtil(createElementWithoutElementsAsString(element));
    // .slice(2) removes `0.` from the beginning of the generated path
    const path = element.path.replace(/\./g, ".elements.").slice(2);
    const existingElement = lodashGet(content, path);
    if (merge) {
        return lodashSet(content, path, lodashMerge(existingElement, newElement));
    }
    return lodashSet(content, path, element);
};
const createNewPageState = (page: PageAtomType, element: PbElement, merge: boolean) => {
    if (element.type === "document") {
        const content = cloneAndMergePageContentState(page, element, merge);
        return {
            ...page,
            content
        };
    }
    return {
        ...page,
        content: buildNewPageContentState(page, element, merge)
    };
};

export const updateElementAction: EventActionCallable<UpdateElementActionArgsType> = (
    state,
    args
) => {
    const { element, merge, history } = args;
    const { page } = state;

    const newPageState = createNewPageState(lodashCloneDeep(page), element, merge);
    // TODO find a way to save revision after setting the state
    if (history === true) {
        // saveEditorPageRevisionUtil(newPageState);
    }
    return {
        page: newPageState,
        elements: flattenContentUtil(lodashCloneDeep(newPageState.content))
    };
};
