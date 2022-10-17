import invariant from "invariant";
import { plugins } from "@webiny/plugins";
import { getNanoid, addElementId } from "~/editor/helpers";
import { PbEditorBlockPlugin, PbEditorElement, PbElement, PbBlockVariable } from "~/types";

export const createBlockReference = (name: string): PbEditorElement => {
    const plugin = plugins.byName<PbEditorBlockPlugin>(name);

    invariant(plugin, `Missing block plugin "${name}"!`);
    /**
     * Used ts-ignore because TS is complaining about always overriding some properties
     */

    const blockElement = addElementId(plugin.create());
    return {
        // @ts-ignore
        id: getNanoid(),
        // @ts-ignore
        elements: [],
        ...blockElement,
        // @ts-ignore
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
            const variableValue = variables.find(
                (variable: PbBlockVariable) => variable.id === el.data.variableId
            )?.value;

            if (el.data?.text?.data?.text && variableValue) {
                el.data.text.data.text = variableValue;
            }
            // @ts-ignore
            delete el.data?.variableId;
        }
        if (el.elements && el.elements.length) {
            el = removeElementVariableIds(el, variables);
        }

        return el;
    });

    return el;
};
