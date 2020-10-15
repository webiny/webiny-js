import invariant from "invariant";
import { elementWithChildrenByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { PbEditorPageElementPlugin, PbElement } from "@webiny/app-page-builder/types";
import { getPlugins } from "@webiny/plugins";
import { useRecoilValue } from "recoil";

const getElementTypePlugin = (type: string): PbEditorPageElementPlugin => {
    const plugins = getPlugins<PbEditorPageElementPlugin>("pb-editor-page-element");
    const plugin = plugins.find(pl => pl.elementType === type);
    if (!plugin) {
        throw new Error(`There is no plugin in "pb-editor-page-element" for element type ${type}`);
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

type DropElementType = {
    source: PbElement;
    target: {
        id: string;
        type: string;
        position: number;
    };
};
// replaces https://github.com/webiny/webiny-js/blob/master/packages/app-page-builder/src/editor/actions/actions.ts#L226
export const dropElementAction = ({ source, target }: DropElementType) => {
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

    plugin.onReceived({
        source: sourceElement,
        target: targetElement,
        position: position
    });
};
