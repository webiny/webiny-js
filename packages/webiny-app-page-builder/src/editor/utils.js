// @flow
import shortid from "shortid";
import invariant from "invariant";
import { set } from "dot-prop-immutable";
import { isPlainObject, omit } from "lodash";
import { getPlugin, getPlugins } from "webiny-plugins";
import type { PbElementType } from "webiny-app-page-builder/types";

export const updateChildPaths = (element: PbElementType) => {
    if (!element.id) {
        element.id = shortid.generate();
    }

    if (!element.path) {
        element.path = "0";
    }

    if (Array.isArray(element.elements)) {
        // Process children only if "elements" is an array of objects.
        // We may get an array of strings when working with shallow element copies.
        if (isPlainObject(element.elements[0])) {
            element.elements.forEach((el, index) => {
                if (!el.id) {
                    el.id = shortid.generate();
                }

                el.path = element.path + "." + index;
                if (el.elements.length) {
                    updateChildPaths(el);
                }
            });
        }
    }
};

export const addElementToParent = (
    element: PbElementType,
    parent: PbElementType,
    position: ?number
) => {
    let newParent;
    if (position === null) {
        newParent = set(parent, "elements", [...parent.elements, element]);
    } else {
        newParent = set(parent, "elements", [
            ...parent.elements.slice(0, position),
            element,
            ...parent.elements.slice(position)
        ]);
    }

    updateChildPaths(newParent);
    return newParent;
};

export const createBlock = (options: Object = {}, parent: ?PbElementType) => {
    return createElement("block", options, parent);
};

export const createRow = (options: Object = {}, parent: ?PbElementType) => {
    return createElement("row", options, parent);
};

export const createColumn = (options: Object = {}, parent: ?PbElementType) => {
    return createElement("column", options, parent);
};

export const createElement = (type: string, options: Object = {}, parent: ?PbElementType) => {
    let plugin = getPlugins("pb-page-element").find(pl => pl.elementType === type);

    invariant(plugin, `Missing element plugin for type "${type}"!`);

    return {
        id: shortid.generate(),
        data: {},
        elements: [],
        path: "",
        ...plugin.create(options, parent)
    };
};

export const createBlockElements = (name: string, options: Object = {}, parent: ?PbElementType) => {
    const plugin = getPlugin(name);

    invariant(plugin, `Missing block plugin "${name}"!`);

    return {
        id: shortid.generate(),
        data: {},
        elements: [],
        path: "",
        ...plugin.create(options, parent)
    };
};

export const cloneElement = (element: PbElementType) => {
    const clone = omit(element, ["id", "path"]);

    clone.elements = clone.elements.map(el => cloneElement(el));

    return clone;
};
