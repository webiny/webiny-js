import invariant from "invariant";
import shortid from "shortid";
import lodashCloneDeep from "lodash/cloneDeep";
import { plugins } from "@webiny/plugins";
import {
    PbEditorPageElementPlugin,
    PbElement,
    PbShallowElement
} from "@webiny/app-page-builder/types";

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

const setElementInPath = (elements: PbElement[], paths: number[], element: PbElement): void => {
    if (paths.length === 0) {
        throw new Error("There are no paths sent.");
    }
    const path = paths.shift();
    if (paths.length === 0) {
        elements[path] = element;
        return;
    }
    setElementInPath(elements[path].elements, paths, element);
};

export const saveElementToContentHelper = (
    content: PbElement,
    path: string,
    element: PbElement
): PbElement => {
    const clonedContent = lodashCloneDeep(content);
    const paths = path.split(".").map(Number);
    paths.shift();
    setElementInPath(clonedContent.elements, paths, element);
    return clonedContent;
};

const findElementByPath = (elements: PbElement[], paths: number[]): PbElement => {
    if (paths.length === 0) {
        throw new Error("There are no paths sent.");
    }
    const path = paths.shift();
    if (paths.length === 0) {
        return elements[path];
    }
    return findElementByPath(elements[path].elements, paths);
};

export const extrapolateContentElementHelper = (
    content: PbElement,
    path: string
): PbElement | undefined => {
    const paths = path.split(".").map(Number);
    // always remove the first one because that is the content
    paths.shift();
    if (paths.length === 0) {
        return content;
    }
    return findElementByPath(content.elements, paths);
};

export const removeElementHelper = (parent: PbElement, id: string): PbElement => {
    return {
        ...parent,
        elements: parent.elements.filter(target => target.id !== id)
    };
};

export const cloneElementHelper = (target: PbElement): PbElement => {
    return {
        ...target,
        id: undefined,
        path: undefined,
        elements: target.elements.map(cloneElementHelper)
    };
};

type CreateElementHelperType = (
    type: string,
    options?: { [key: string]: any },
    parent?: PbElement
) => PbElement;

export const createElementHelper: CreateElementHelperType = (type, options = {}, parent) => {
    const plugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(pl => pl.elementType === type);

    invariant(plugin, `Missing element plugin for type "${type}"!`);

    return {
        id: shortid.generate(),
        data: {},
        elements: [],
        path: "",
        type,
        ...plugin.create(options, parent)
    };
};

export const addElementToParentHelper = (
    element: PbElement,
    parent: PbElement,
    position?: number
) => {
    if (position === undefined || position === null) {
        return updateChildPathsHelper({
            ...parent,
            elements: parent.elements.concat([element])
        });
    }

    return updateChildPathsHelper({
        ...parent,
        elements: [
            ...parent.elements.slice(0, position),
            element,
            ...parent.elements.slice(position)
        ]
    });
};
