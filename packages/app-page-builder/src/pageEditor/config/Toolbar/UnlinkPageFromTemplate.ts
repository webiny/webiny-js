import { PbEditorElement, PbElement } from "~/types";
import { InjectVariableValuesIntoElement } from "~/pageEditor/config/Toolbar/InjectVariableValuesIntoElement";

export class UnlinkPageFromTemplate {
    execute(content: PbEditorElement) {
        const newContent = structuredClone(content);
        const injectVariableValues = new InjectVariableValuesIntoElement();

        const unlinkedBlocks = (newContent.elements as PbElement[]).map(block => {
            delete block.data["templateBlockId"];

            if (block.data.blockId) {
                return block;
            }

            const blockVariables = block.data.variables || [];

            const blockWithValues = injectVariableValues.execute(block, blockVariables);

            delete blockWithValues.data["variables"];

            return blockWithValues;
        });

        delete newContent.data["template"];

        return { ...newContent, elements: unlinkedBlocks };
    }
}
