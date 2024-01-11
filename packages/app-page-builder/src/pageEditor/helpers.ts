import invariant from "invariant";
import { plugins } from "@webiny/plugins";
import { getNanoid, addElementId } from "~/editor/helpers";
import {
    PbEditorBlockPlugin,
    PbEditorElement,
    PbElement,
    PbBlockVariable,
    PbEditorPageElementVariableRendererPlugin
} from "~/types";

export const createBlockReference = (name?: string): PbEditorElement => {
    const plugin = plugins.byName<PbEditorBlockPlugin>(name);

    invariant(plugin, `Missing block plugin "${name}"!`);
    /**
     * Used ts-ignore because TS is complaining about always overriding some properties
     */

    const blockElement = addElementId(plugin.create());
    return {
        // @ts-expect-error
        id: getNanoid(),
        // @ts-expect-error
        elements: [],
        ...blockElement,
        data: { ...blockElement.data, blockId: plugin.id }
    };
};

/**
 * Remove variableId from elements recursively
 */
export const removeElementVariableIds = (
    el: PbElement,
    variables: PbBlockVariable[]
): PbElement => {
    el.elements = el.elements.map(el => {
        if (el.data?.variableId) {
            const elementVariables =
                variables.filter(
                    (variable: PbBlockVariable) => variable.id.split(".")[0] === el.data.variableId
                ) || [];
            const elementVariableRendererPlugins =
                plugins.byType<PbEditorPageElementVariableRendererPlugin>(
                    "pb-editor-page-element-variable-renderer"
                );
            const elementVariablePlugin = elementVariableRendererPlugins.find(
                plugin => plugin.elementType === el?.type
            );

            // we need to replace element value with the one from variables before removing variableId
            el = elementVariablePlugin?.setElementValue(el, elementVariables) || el;

            delete el.data?.variableId;
        }
        if (el.elements && el.elements.length) {
            el = removeElementVariableIds(el, variables);
        }

        return el;
    });

    return el;
};
