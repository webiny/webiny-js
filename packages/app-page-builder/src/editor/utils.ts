import shortid from "shortid";
import invariant from "invariant";
import { set } from "dot-prop-immutable";
import { isPlainObject, omit } from "lodash";
import { getPlugin, getPlugins } from "@webiny/plugins";
import {PbElement, PbEditorPageElementPlugin, PbEditorBlockPlugin} from "@webiny/app-page-builder/admin/types";

export const updateChildPaths = (element: PbElement) => {
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

export const addElementToParent = (element: PbElement, parent: PbElement, position?: number) => {
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

type CreateElement = (
    type: string,
    options?: { [key: string]: any },
    parent?: PbElement
) => PbElement;

export const createElement: CreateElement = (type, options = {}, parent) => {
    const plugin = getPlugins<PbEditorPageElementPlugin>("pb-editor-page-element").find(
        pl => pl.elementType === type
    );

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

export const createBlock = (options: Object = {}, parent?: PbElement) => {
    return createElement("block", options, parent);
};

export const createRow = (options: Object = {}, parent?: PbElement) => {
    return createElement("row", options, parent);
};

export const createColumn = (options: Object = {}, parent?: PbElement) => {
    return createElement("column", options, parent);
};

export const createBlockElements = (name: string) => {
    const plugin = getPlugin(name) as PbEditorBlockPlugin;

    invariant(plugin, `Missing block plugin "${name}"!`);

    return {
        id: shortid.generate(),
        data: {},
        elements: [],
        path: "",
        ...plugin.create()
    };
};

export const cloneElement = (element: PbElement) => {
    const clone = omit(element, ["id", "path"]);

    clone.elements = clone.elements.map(el => cloneElement(el));

    return clone;
};
