import shortid from "shortid";
import { set } from "dot-prop-immutable";
import { isPlainObject, omit } from "lodash";
import { getPlugin } from "webiny-app/plugins";

export const updateChildPaths = element => {
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

export const addElementToParent = (element, parent, position) => {
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

export const createBlock = (options = {}, parent = null) => {
    return createElement("cms-element-block", options, parent);
};

export const createRow = (options = {}, parent = null) => {
    return createElement("cms-element-row", options, parent);
};

export const createColumn = (options = {}, parent = null) => {
    return createElement("cms-element-column", options, parent);
};

export const createElement = (type, options = {}, parent = null) => {
    const plugin = getPlugin(type);

    return {
        id: shortid.generate(),
        data: {},
        settings: {},
        elements: [],
        path: "",
        ...plugin.create(options, parent)
    };
};

export const cloneElement = element => {
    const clone = omit(element, ["id", "path"]);

    clone.elements = clone.elements.map(el => cloneElement(el));

    return clone;
};
