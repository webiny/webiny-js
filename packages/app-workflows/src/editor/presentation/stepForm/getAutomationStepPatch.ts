import { formDataToJsonSchemaValue } from "@webiny/app-admin";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import { readAutomationConfig } from "~/editor/model/readAutomationConfig.js";
import type { AutomationFormValues } from "./StepFormData.js";
import { getCommonStepPatch } from "./getCommonStepPatch.js";

/*
 * What Done writes for an Automation step: the common fields and the config
 * `{ automationId, settings }` (R270, Review Focus 3). Settings go back through the adapter; a
 * definition with no schema keeps the stored settings of the same automation.
 */
export const getAutomationStepPatch = (
    step: EditorStep,
    values: AutomationFormValues,
    definition: AutomationDefinition | null
): EditorStepPatch => {
    const stored = readAutomationConfig(step.config);
    const common = getCommonStepPatch(step, values);

    // The stored settings belong to the stored automation only; a switched step starts empty (QBZ-14).
    let settings: unknown = {};
    if (values.automationId === stored.automationId) {
        settings = stored.settings;
    }
    if (definition !== null && definition.settingsSchema !== null && values.settings !== null) {
        settings = formDataToJsonSchemaValue(definition.settingsSchema, values.settings);
    }

    return { ...common, config: { automationId: values.automationId ?? "", settings } };
};
