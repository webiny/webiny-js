import shortid from "shortid";
import { PageAtomType } from "./modules";
import { PbElement, PbShallowElement } from "@webiny/app-page-builder/types";

const fixChildPaths = (elements: PbElement[]): PbElement[] => {
    return (elements as PbElement[]).map((element, index) => {
        const newElement = updateChildPathsUtil(element);
        const path = `${element.path || "0"}.${index}`;
        return {
            ...newElement,
            path
        };
    });
};

export const updateChildPathsUtil = (element: PbElement): PbElement => {
    const { id = shortid.generate(), path = "0", type, data, elements } = element;
    return {
        ...element,
        id,
        path,
        type: type,
        data: data,
        elements: fixChildPaths(elements)
    };
};
// eslint-disable-next-line
export const saveEditorPageRevisionUtil = (_page: PageAtomType) => {
    // packages/app-page-builder/src/editor/actions/actions.ts:364
};

// Flatten page content
type FlattenElementsType = {
    [id: string]: PbShallowElement;
};
export const flattenContentUtil = (el): FlattenElementsType => {
    let els = {};
    el.elements = (el.elements || []).map(child => {
        els = { ...els, ...flattenContentUtil(child) };
        return child.id;
    });

    els[el.id] = el;
    return els;
};

const saveElementToPath = (target: PbElement, paths: number[], element: PbElement): PbElement => {
    if (paths.length === 0) {
        throw new Error(`Cannot go in depths of "${target.path}".`);
    }
    const path = paths.shift();
    if (paths.length === 0) {
        target.elements[path] = element;
        return target;
    }
    return saveElementToPath(target.elements[path], paths, element);
};

export const saveElementToPathUtil = (
    target: PbElement,
    path: string,
    element: PbElement
): PbElement => {
    const paths = path.split(".").map(Number);
    return saveElementToPath(target, paths, element);
};

const extrapolateTargetElement = (target: PbElement, paths: number[]): PbElement | undefined => {
    if (paths.length === 0) {
        throw new Error(`Cannot go in depths of "${target.path}".`);
    }
    const path = paths.shift();
    if (paths.length === 0) {
        return target;
    } else if (!target.elements || target.elements.length === 0) {
        throw new Error(`It seems there is no elements in target on path "${target.path}"`);
    }
    return extrapolateTargetElement(target.elements[path], paths);
};

export const extrapolateContentElementUtil = (
    target: PbElement,
    path: string
): PbElement | undefined => {
    const paths = path.split(".").map(Number);
    return extrapolateTargetElement(target, paths);
};
