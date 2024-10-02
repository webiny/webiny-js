import { plugins } from "@webiny/plugins";
import { PbBlockVariable, PbEditorPageElementVariableRendererPlugin, PbElement } from "~/types";

export class InjectVariableValuesIntoElement {
    private elementVariablePlugins: PbEditorPageElementVariableRendererPlugin[];

    constructor() {
        this.elementVariablePlugins = plugins.byType<PbEditorPageElementVariableRendererPlugin>(
            "pb-editor-page-element-variable-renderer"
        );
    }
    execute(element: PbElement, variables: PbBlockVariable[]): PbElement {
        element.elements = element.elements.map(element => {
            const { variableId } = element.data;

            if (variableId) {
                const elementVariables =
                    variables.filter(variable => variable.id.split(".")[0] === variableId) || [];

                const elementVariablePlugin = this.elementVariablePlugins.find(
                    plugin => plugin.elementType === element.type
                );

                if (elementVariablePlugin) {
                    // we need to replace element value with the one from variables before removing variableId
                    element = elementVariablePlugin.setElementValue(element, elementVariables);
                }
            }

            if (element.elements && element.elements.length) {
                return this.execute(element, variables);
            }

            return element;
        });

        return element;
    }
}
