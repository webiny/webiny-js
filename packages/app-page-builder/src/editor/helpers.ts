import invariant from "invariant";
import { customAlphabet } from "nanoid";
import { set } from "dot-prop-immutable";
import omit from "lodash/omit";
import { DragObjectWithTypeWithTarget } from "./components/Droppable";
import { plugins } from "@webiny/plugins";
import {
    PbEditorBlockPlugin,
    PbEditorPageElementPlugin,
    PbEditorPageElementSettingsPlugin,
    PbEditorPageElementStyleSettingsPlugin,
    PbEditorElement
} from "~/types";

const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const getNanoid = customAlphabet(ALPHANUMERIC, 10);

type FlattenElementsType = {
    [id: string]: PbEditorElement;
};
export const flattenElements = (el, parent = undefined): FlattenElementsType => {
    const els = {};
    els[el.id] = set(
        el,
        "elements",
        (el.elements || []).map(child => {
            if (typeof child === "string") {
                return child;
            }
            const children = flattenElements(child, el.id);
            Object.keys(children).forEach(id => {
                els[id] = omit(children[id], ["path"]);
            });
            return child.id;
        })
    );

    els[el.id].parent = parent;

    return els;
};

interface CreateElement {
    (type: string, options?: { [key: string]: any }, parent?: PbEditorElement): PbEditorElement;
}

export const createElement: CreateElement = (type, options = {}, parent) => {
    const plugin = plugins.byType(PbEditorPageElementPlugin).find(pl => pl.elementType === type);

    invariant(plugin, `Missing element plugin for type "${type}"!`);

    return {
        id: getNanoid(),
        data: {
            settings: {}
        },
        elements: [],
        parent: parent ? parent.id : undefined,
        type,
        ...addElementId(plugin.create(options, parent))
    };
};

export const addElementToParent = (
    element: PbEditorElement,
    parent: PbEditorElement,
    position?: number
): PbEditorElement => {
    if (position === undefined || position === null) {
        return {
            ...parent,
            elements: [...parent.elements, { ...element, parent: parent.id }]
        };
    }

    return {
        ...parent,
        elements: [
            ...parent.elements.slice(0, position),
            { ...element, parent: parent.id },
            ...parent.elements.slice(position)
        ]
    };
};

export const createDroppedElement = (
    source: DragObjectWithTypeWithTarget,
    target: PbEditorElement
): PbEditorElement => {
    if (source.id) {
        return {
            id: getNanoid(),
            type: source.type,
            elements: (source as any).elements || [],
            data: (source as any).data || {},
            parent: target.id
        };
    }

    return createElement(source.type, {}, target);
};
// Add unique id to elements recur
const addElementId = (element: Omit<PbEditorElement, "id">) => {
    element.id = getNanoid();

    if (Array.isArray(element.elements)) {
        element.elements = element.elements.map((el: PbEditorElement) => {
            return addElementId(el);
        });
    }
    return element;
};

export const createBlockElements = (name: string) => {
    const plugin = plugins.byName<PbEditorBlockPlugin>(name);

    invariant(plugin, `Missing block plugin "${name}"!`);

    return {
        id: getNanoid(),
        data: {},
        elements: [],
        ...addElementId(plugin.create())
    };
};

export const userElementSettingsPlugins = (elementType: string) => {
    return plugins
        .byType<PbEditorPageElementSettingsPlugin>("pb-editor-page-element-settings")
        .filter(pl => {
            if (typeof pl.elements === "boolean") {
                return pl.elements === true;
            }
            if (Array.isArray(pl.elements)) {
                return pl.elements.includes(elementType);
            }

            return false;
        })
        .map(pl => pl.name);
};

export const userElementStyleSettingsPlugins = (elementType: string) => {
    return plugins
        .byType<PbEditorPageElementStyleSettingsPlugin>("pb-editor-page-element-style-settings")
        .filter(pl => {
            if (typeof pl.elements === "boolean") {
                return pl.elements === true;
            }
            if (Array.isArray(pl.elements)) {
                return pl.elements.includes(elementType);
            }

            return false;
        })
        .map(pl => pl.name);
};

type CreateEmptyElementCallableType = (
    args: Pick<PbEditorElement, "id" | "type">
) => PbEditorElement;

export const createEmptyElement: CreateEmptyElementCallableType = ({ id, type }) => {
    return {
        id,
        type,
        data: {
            settings: {}
        },
        elements: []
    };
};

export const updateBlockPosition = ({ parent, sourcePosition, targetPosition }) => {
    if (sourcePosition === targetPosition) {
        return parent;
    }

    return {
        ...parent,
        elements: moveInPlace(parent.elements, sourcePosition, targetPosition)
    };
};

export const moveInPlace = (arr: any[], from: number, to: number): any[] => {
    const newArray = [...arr];

    const [item] = newArray.splice(from, 1);
    newArray.splice(to, 0, item);

    return newArray;
};
