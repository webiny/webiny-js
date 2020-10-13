import {
    editorPageAtom,
    EditorPageAtomType,
    editorPageFlatElementsAtom
} from "@webiny/app-page-builder/editor/recoil/recoil";
import {
    flattenContent,
    saveEditorPageRevision,
    updateChildPaths
} from "@webiny/app-page-builder/editor/recoil/utils";
import { PbElement } from "@webiny/app-page-builder/types";
import lodashCloneDeep from "lodash/cloneDeep";
import lodashGet from "lodash/get";
import lodashMerge from "lodash/merge";
import lodashSet from "lodash/set";
import { useRecoilState, useSetRecoilState } from "recoil";
import { useBatching } from "recoil-undo";

const createElementWithoutElementsAsString = (element: PbElement): PbElement => {
    if (!element.elements || typeof element.elements[0] !== "string") {
        return element;
    }
    throw new Error("This should never happen.");
    // return {
    //     ...element,
    //     elements: [],
    // };
};
/**
 * when element update happens:
 * 1. update page content
 * 2. flatten content and update elements
 * 3. save revision if revision history is allowed
 */
type UpdateElementType = {
    element: PbElement;
    merge?: boolean;
    history?: boolean;
};

const cloneAndMergePageContentState = (
    page: EditorPageAtomType,
    element: PbElement,
    merge: boolean
) => {
    const newElement = updateChildPaths(createElementWithoutElementsAsString(element));
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
    { content }: EditorPageAtomType,
    element: PbElement,
    merge: boolean
) => {
    const newElement = updateChildPaths(createElementWithoutElementsAsString(element));
    // .slice(2) removes `0.` from the beginning of the generated path
    const path = element.path.replace(/\./g, ".elements.").slice(2);
    const existingElement = lodashGet(content, path);
    if (merge) {
        return lodashSet(content, path, lodashMerge(existingElement, newElement));
    }
    return lodashSet(content, path, element);
};
const createNewPageState = (page: EditorPageAtomType, element: PbElement, merge: boolean) => {
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

export const updateElementAction = ({ element, merge, history }: UpdateElementType) => {
    // find out which path are we updating
    // if type is document, we will update editorPageAtom.content
    const [page, setPage] = useRecoilState(editorPageAtom);
    const setElements = useSetRecoilState(editorPageFlatElementsAtom);
    const { startBatch, endBatch } = useBatching();

    const newPageState = createNewPageState(lodashCloneDeep(page), element, merge);
    startBatch();
    setPage(newPageState);
    setElements(flattenContent(newPageState.content));
    if (history === true) {
        saveEditorPageRevision(newPageState);
    }
    endBatch();
};
