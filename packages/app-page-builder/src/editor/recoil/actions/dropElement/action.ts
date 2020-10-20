import { DropElementActionArgsType } from "./types";
import { EventActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import invariant from "invariant";
import { elementWithChildrenByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { PbEditorPageElementPlugin, PbElement } from "@webiny/app-page-builder/types";
import { plugins } from "@webiny/plugins";
import { useRecoilValue } from "recoil";

const elementPluginType = "pb-editor-page-element";

const getElementTypePlugin = (type: string): PbEditorPageElementPlugin => {
    const pluginsByType = plugins.byType<PbEditorPageElementPlugin>(elementPluginType);
    const plugin = pluginsByType.find(pl => pl.elementType === type);
    if (!plugin) {
        throw new Error(`There is no plugin in "${elementPluginType}" for element type ${type}`);
    }
    return plugin;
};

const getSourceElement = (source: PbElement): PbElement => {
    if (!source.path) {
        return (source as unknown) as PbElement;
    }
    const element = useRecoilValue(elementWithChildrenByIdSelector(source.id));
    if (!element) {
        throw new Error(`There is no element with id "${source.id}"`);
    }
    return element;
};

export const dropElementAction: EventActionCallable<DropElementActionArgsType> = (state, args) => {
    const { source, target } = args;
    const { id, type, position } = target;
    const targetElement = useRecoilValue(elementWithChildrenByIdSelector(id));
    if (!targetElement) {
        throw new Error(`There is no element with id "${id}"`);
    }
    const plugin = getElementTypePlugin(type);
    invariant(
        plugin.onReceived,
        "To accept drops, element plugin must implement `onReceived` function"
    );

    const sourceElement = getSourceElement(source);

    // TODO must accept state and then return what stuff to set
    plugin.onReceived({
        // state,
        source: sourceElement,
        target: targetElement,
        position: position
    });

    return {};
};
