import type { AutomationDefinition } from "~/editor/domain/types.js";
import { matchesAutomationScope } from "~/editor/model/matchesAutomationScope.js";
import type { StepFormAutomationOption } from "./StepFormOptions.js";
import { getSchemaDescription } from "./getSchemaDescription.js";

export interface AutomationCardsParams {
    definitions: AutomationDefinition[];
    // The workflow's model, e.g. `cms.article` or `wb.page`; null when no model is open (R284): nothing covers it.
    namespace: string | null;
    selectedId: string | null;
}

/*
 * The cards of the automation field (D35, R274): the definitions covering the workflow's model,
 * plus the stored one even when it does not cover it, so the field never points at a hidden card.
 */
export const getAutomationCards = (params: AutomationCardsParams): StepFormAutomationOption[] => {
    const { definitions, namespace, selectedId } = params;
    const cards: StepFormAutomationOption[] = [];

    for (const definition of definitions) {
        const covers = namespace !== null && matchesAutomationScope(definition.models, [namespace]);
        if (!covers && definition.id !== selectedId) {
            continue;
        }
        cards.push({
            id: definition.id,
            name: definition.name,
            description: getSchemaDescription(definition.settingsSchema)
        });
    }

    return cards;
};
