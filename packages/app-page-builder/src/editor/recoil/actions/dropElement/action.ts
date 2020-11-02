import { DragObjectWithTypeWithTargetType } from "@webiny/app-page-builder/editor/components/Droppable";
import { PbState } from "@webiny/app-page-builder/editor/recoil/modules/types";
import { DropElementActionArgsType } from "./types";
import { EventActionCallableType } from "@webiny/app-page-builder/editor/recoil/eventActions";
import invariant from "invariant";
import { getElementWithChildrenById } from "@webiny/app-page-builder/editor/recoil/modules";
import { PbEditorPageElementPlugin, PbElement } from "@webiny/app-page-builder/types";
import { plugins } from "@webiny/plugins";

const elementPluginType = "pb-editor-page-element";

const getElementTypePlugin = (type: string): PbEditorPageElementPlugin => {
    const pluginsByType = plugins.byType<PbEditorPageElementPlugin>(elementPluginType);
    const plugin = pluginsByType.find(pl => pl.elementType === type);
    if (!plugin) {
        throw new Error(`There is no plugin in "${elementPluginType}" for element type ${type}`);
    }
    return plugin;
};

const getSourceElement = (
    state: PbState,
    source: DragObjectWithTypeWithTargetType
): PbElement | DragObjectWithTypeWithTargetType => {
    if (!source.path) {
        return (source as unknown) as PbElement;
    } else if (!source.id) {
        throw new Error(`There is no "id" property on source object.`);
    }
    const element = getElementWithChildrenById(state, source.id);
    if (!element) {
        throw new Error(`There is no element with id "${source.id}"`);
    }
    return element;
};

export const dropElementAction: EventActionCallableType<DropElementActionArgsType> = (
    state,
    args
) => {
    const { source, target } = args;
    const { id, type, position } = target;
    const targetElement = getElementWithChildrenById(state, id);
    if (!targetElement) {
        throw new Error(`There is no element with id "${id}"`);
    }
    const plugin = getElementTypePlugin(type);
    invariant(
        plugin.onReceived,
        "To accept drops, element plugin must implement `onReceived` function"
    );

    const sourceElement = getSourceElement(state, source);

    // TODO must accept state and then return what stuff to set
    plugin.onReceived({
        state,
        source: sourceElement,
        target: targetElement,
        position: position
    });

    return {};
};
