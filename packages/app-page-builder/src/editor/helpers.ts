import invariant from "invariant";
import { customAlphabet } from "nanoid";
import { set } from "dot-prop-immutable";
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

interface FlatElements {
    [id: string]: PbEditorElement;
}
export const flattenElements = (el?: PbEditorElement, parent?: string): FlatElements => {
    if (!el || !el.id) {
        return {};
    }
    const els: FlatElements = {};
    els[el.id] = set(
        el,
        "elements",
        (el.elements || []).map(child => {
            if (typeof child === "string") {
                return child;
            }
            const children = flattenElements(child, el.id);
            Object.keys(children).forEach(id => {
                const childElement = {
                    ...children[id]
                };
                delete childElement.path;
                els[id] = childElement;
            });
            return child.id;
        })
    );

    els[el.id].parent = parent;

    return els;
};

interface CreateElementCallableOptions {
    [key: string]: any;
}
interface CreateElementCallable {
    (
        type: string,
        options?: CreateElementCallableOptions,
        parent?: PbEditorElement
    ): PbEditorElement;
}

export const createElement: CreateElementCallable = (
    type,
    options = {},
    parent
): PbEditorElement => {
    const plugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(pl => pl.elementType === type);

    invariant(plugin, `Missing element plugin for type "${type}"!`);

    /**
     * Used ts-ignore because TS is complaining about always overriding some properties
     */
    return {
        // @ts-ignore
        id: getNanoid(),
        // @ts-ignore
        data: {
            settings: {}
        },
        // @ts-ignore
        elements: [],
        parent: parent ? parent.id : undefined,
        // @ts-ignore
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
/**
 * Add unique id to elements recur
 */
const addElementId = (target: Omit<PbEditorElement, "id">): PbEditorElement => {
    /**
     * Need to cast because typescript thinks we removed everything via Omit???
     */
    // TODO @ts-refactor
    const element: PbEditorElement = {
        ...(target as PbEditorElement),
        id: getNanoid()
    };
    // element.id = getNanoid();

    if (Array.isArray(element.elements)) {
        element.elements = (element.elements as PbEditorElement[]).map(el => {
            return addElementId(el);
        });
    }
    return element;
};

export const createBlockElements = (name: string): PbEditorElement => {
    const plugin = plugins.byName<PbEditorBlockPlugin>(name);

    invariant(plugin, `Missing block plugin "${name}"!`);
    /**
     * Used ts-ignore because TS is complaining about always overriding some properties
     */
    return {
        // @ts-ignore
        id: getNanoid(),
        // @ts-ignore
        data: {},
        // @ts-ignore
        elements: [],
        ...addElementId(plugin.create())
    };
};

export const userElementSettingsPlugins = (elementType: string): string[] => {
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
        .map(pl => pl.name) as string[];
};

export const userElementStyleSettingsPlugins = (elementType: string): string[] => {
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
        .map(pl => pl.name) as string[];
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

export interface UpdateBlockPositionParams {
    parent: PbEditorElement;
    sourcePosition: number;
    targetPosition: number;
}
export const updateBlockPosition = (params: UpdateBlockPositionParams): PbEditorElement => {
    const { parent, sourcePosition: source, targetPosition: target } = params;
    if (source === target) {
        return parent;
    }

    return {
        ...parent,
        elements: moveInPlace(parent.elements as PbEditorElement[], source, target)
    };
};

export const moveInPlace = (
    arr: PbEditorElement[],
    from: number,
    to: number
): PbEditorElement[] => {
    const newArray = [...arr];

    const [item] = newArray.splice(from, 1);
    newArray.splice(to, 0, item);

    return newArray;
};
