import { DragObjectWithTypeWithTarget } from "~/editor/components/Droppable";
import {
    PbEditorPageElementPlugin,
    EventActionCallable,
    EventActionHandlerCallableState,
    PbEditorElement
} from "~/types";
import { plugins } from "@webiny/plugins";
import { DropElementActionArgsType } from "./types";
import { onReceived } from "~/editor/helpers";

const elementPluginType = "pb-editor-page-element";

const getElementTypePlugin = (type: string): PbEditorPageElementPlugin => {
    const pluginsByType = plugins.byType<PbEditorPageElementPlugin>(elementPluginType);
    const plugin = pluginsByType.find(pl => pl.elementType === type);
    if (!plugin) {
        throw new Error(`There is no plugin in "${elementPluginType}" for element type ${type}`);
    }
    return plugin;
};

const getSourceElement = async (
    state: EventActionHandlerCallableState,
    source: DragObjectWithTypeWithTarget
): Promise<PbEditorElement | DragObjectWithTypeWithTarget> => {
    if (source.id) {
        const element = await state.getElementById(source.id);
        return await state.getElementTree({ element });
    }

    return source;
};

export const dropElementAction: EventActionCallable<DropElementActionArgsType> = async (
    state,
    meta,
    args
) => {
    if (!args) {
        return {
            actions: []
        };
    }
    const { source, target } = args;
    const { id, type, position } = target;
    const targetElement = await state.getElementById(id);
    if (!targetElement) {
        throw new Error(`There is no element with id "${id}"`);
    }
    const plugin = getElementTypePlugin(type);

    const sourceElement = await getSourceElement(state, source);

    const onReceivedCallback = plugin.onReceived || onReceived;

    return onReceivedCallback!({
        state: {
            ...state,
            ui: {
                ...state.ui,
                isDragging: false
            }
        },
        meta,
        source: sourceElement,
        target: targetElement,
        position: position
    });
};
