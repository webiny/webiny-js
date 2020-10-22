import shortid from "shortid";
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

export const saveElementToContentHelper = (
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

export const extrapolateContentElementHelper = (
    target: PbElement,
    paths: string | number[]
): PbElement | undefined => {
    return extrapolateTargetElement(
        target,
        typeof paths === "string" ? paths.split(".").map(Number) : paths
    );
};

export const removeElementHelper = (parent: PbElement, id: string): PbElement => {
    return {
        ...parent,
        elements: parent.elements.filter(target => target.id !== id)
    };
};
