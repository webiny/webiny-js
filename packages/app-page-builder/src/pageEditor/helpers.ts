import invariant from "invariant";
import { plugins } from "@webiny/plugins";
import { getNanoid, prefixElementIdsRecursively, generateBlockVariableIds } from "~/editor/helpers";
import {
    PbEditorBlockPlugin,
    PbEditorElement,
    PbElement,
    PbBlockVariable,
    PbEditorPageElementVariableRendererPlugin
} from "~/types";
import omit from "lodash/omit";

export const createBlockReference = (name: string): PbEditorElement => {
    const plugin = plugins.byName<PbEditorBlockPlugin>(name);

    invariant(plugin, `Missing block plugin "${name}"!`);
    /**
     * Used ts-ignore because TS is complaining about always overriding some properties
     */

    const blockElement = plugin.create();
    const blockId = getNanoid();

    return {
        ...blockElement,
        id: blockId,
        elements: prefixElementIdsRecursively(blockElement.elements as PbEditorElement[], blockId),
        data: {
            ...blockElement.data,
            blockId: plugin.id,
            variables: generateBlockVariableIds(blockElement.data.variables || [], blockId)
        }
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
        const { variableId } = el.data;

        if (variableId) {
            const elementVariables =
                variables.filter(variable => variable.id.split(".")[0] === variableId) || [];

            const elementVariableRendererPlugins =
                plugins.byType<PbEditorPageElementVariableRendererPlugin>(
                    "pb-editor-page-element-variable-renderer"
                );

            const elementVariablePlugin = elementVariableRendererPlugins.find(
                plugin => plugin.elementType === el.type
            );

            if (elementVariablePlugin) {
                // we need to replace element value with the one from variables before removing variableId
                el = elementVariablePlugin.setElementValue(el, elementVariables);
            }

            return { ...el, data: omit(el.data, ["variableId"]) };
        }

        if (el.elements && el.elements.length) {
            return removeElementVariableIds(el, variables);
        }

        return el;
    });

    return el;
};
