import { SaveRevisionActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { UpdateElementActionArgsType } from "./types";
import { EventActionCallableType } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { PbElement } from "@webiny/app-page-builder/types";
import lodashCloneDeep from "lodash/cloneDeep";
import lodashMerge from "lodash/merge";
import { PageAtomType } from "@webiny/app-page-builder/editor/recoil/modules";
import {
    extrapolateContentElementUtil,
    flattenContentUtil,
    saveEditorPageRevisionUtil,
    saveElementToContentUtil,
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
    const existingElement = extrapolateContentElementUtil(content, element.path);
    if (merge) {
        return saveElementToContentUtil(
            content,
            element.path,
            lodashMerge(existingElement, newElement)
        );
    }
    return saveElementToContentUtil(content, element.path, newElement);
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

export const updateElementAction: EventActionCallableType<UpdateElementActionArgsType> = (
    state,
    args
) => {
    const { element, merge, history } = args;
    const page = createNewPageState(lodashCloneDeep(state.page), element, merge);
    const actions = [];
    if (history === true) {
        actions.push(new SaveRevisionActionEvent());
    }
    return {
        state: {
            page,
            elements: flattenContentUtil(lodashCloneDeep(page.content))
        },
        actions
    };
};
