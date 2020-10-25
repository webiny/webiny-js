import { SaveRevisionActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { UpdateElementActionArgsType } from "./types";
import { EventActionCallableType } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { PbElement } from "@webiny/app-page-builder/types";
import lodashCloneDeep from "lodash/cloneDeep";
import lodashMerge from "lodash/merge";
import { PageAtomType } from "@webiny/app-page-builder/editor/recoil/modules";
import {
    extrapolateContentElementHelper,
    flattenElementsHelper,
    saveElementToContentHelper,
    updateChildPathsHelper
} from "@webiny/app-page-builder/editor/recoil/helpers";

const createElementWithoutElementsAsString = (element: PbElement): PbElement => {
    if (!element.elements || typeof element.elements[0] !== "string") {
        return element;
    }
    return {
        ...element,
        elements: []
    };
};
const cloneAndMergePageContentState = (page: PageAtomType, element: PbElement, merge: boolean) => {
    const newElement = updateChildPathsHelper(createElementWithoutElementsAsString(element));
    if (!merge) {
        return {
            ...(page.content || {}),
            ...newElement
        };
    }
    return lodashMerge(page.content, newElement);
};

const buildNewPageContentState = (
    { content }: PageAtomType,
    element: PbElement,
    merge: boolean
) => {
    const newElement = updateChildPathsHelper(createElementWithoutElementsAsString(element));
    const existingElement = extrapolateContentElementHelper(content, element.path);
    if (merge) {
        return saveElementToContentHelper(
            content,
            element.path,
            lodashMerge(existingElement, newElement)
        );
    }
    return saveElementToContentHelper(content, element.path, newElement);
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
            elements: flattenElementsHelper(lodashCloneDeep(page.content))
        },
        actions
    };
};
