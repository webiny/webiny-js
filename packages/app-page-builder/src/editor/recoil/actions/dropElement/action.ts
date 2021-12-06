import invariant from "invariant";
import { DragObjectWithTypeWithTarget } from "../../../components/Droppable";
import {
    PbEditorPageElementPlugin,
    EventActionCallable,
    EventActionHandlerCallableState,
    PbEditorElement
} from "../../../../types";
import { plugins } from "@webiny/plugins";
import { DropElementActionArgsType } from "./types";

const getElementTypePlugin = (type: string): PbEditorPageElementPlugin => {
    const pluginsByType = plugins.byType(PbEditorPageElementPlugin);
    const plugin = pluginsByType.find(pl => pl.elementType === type);
    if (!plugin) {
        throw new Error(
            `There is no plugin in "${PbEditorPageElementPlugin.type}" for element type ${type}`
        );
    }
    return plugin;
};

const getSourceElement = async (
    state: EventActionHandlerCallableState,
    source: DragObjectWithTypeWithTarget
): Promise<PbEditorElement | DragObjectWithTypeWithTarget> => {
    if (source.id) {
        return await state.getElementById(source.id);
    }

    return source;
};

export const dropElementAction: EventActionCallable<DropElementActionArgsType> = async (
    state,
    meta,
    args
) => {
    const { source, target } = args;
    const { id, type, position } = target;
    const targetElement = await state.getElementById(id);
    if (!targetElement) {
        throw new Error(`There is no element with id "${id}"`);
    }
    const plugin = getElementTypePlugin(type);
    invariant(
        plugin.onReceived,
        "To accept drops, element plugin must implement `onReceived` function"
    );

    const sourceElement = await getSourceElement(state, source);

    return plugin.onReceived({
        state,
        meta,
        source: sourceElement,
        target: targetElement,
        position: position
    });
};
