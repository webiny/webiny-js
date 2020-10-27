import shortid from "shortid";
import dotProp from "dot-prop-immutable";
import { PageAtomType } from "./modules";
import { PbElement, PbShallowElement } from "@webiny/app-page-builder/types";

const updateElementsPaths = (elements: PbElement[], parentPath: string): PbElement[] => {
    return elements.map((element, index) => {
        const path = `${parentPath}.${index}`;
        const id = element.id || shortid.generate();
        return updateElementPaths({
            ...element,
            id,
            path
        });
    });
};
const updateElementPaths = (element: PbElement): PbElement => {
    const { id = shortid.generate(), path = "0", type, data } = element;
    return {
        ...element,
        id,
        path,
        type,
        data,
        elements: updateElementsPaths(element.elements, path)
    };
};

export const updateChildPathsHelper = (element: PbElement): PbElement => {
    return updateElementPaths(element);
};
// eslint-disable-next-line
export const saveEditorPageRevisionHelper = (_page: PageAtomType) => {
    // packages/app-page-builder/src/editor/actions/actions.ts:364
};

type FlattenElementsType = {
    [id: string]: PbShallowElement;
};
export const flattenElementsHelper = (el): FlattenElementsType => {
    let els = {};
    el.elements = (el.elements || []).map(child => {
        els = { ...els, ...flattenElementsHelper(child) };
        return child.id;
    });

    els[el.id] = el;
    return els;
};

const transformElementPathToContentPath = (path: string): string => {
    return path.replace(/\./g, ".elements.").slice(2);
};

export const saveElementToContentHelper = (
    content: PbElement,
    path: string,
    element: PbElement
): PbElement => {
    const p = transformElementPathToContentPath(path);
    return dotProp.set(content, p, element);
};

export const extrapolateContentElementHelper = (
    content: PbElement,
    path: string
): PbElement | undefined => {
    const p = transformElementPathToContentPath(path);
    return dotProp.get(content, p);
};

export const removeElementHelper = (parent: PbElement, id: string): PbElement => {
    return {
        ...parent,
        elements: parent.elements.filter(target => target.id !== id)
    };
};
