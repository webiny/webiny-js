import { jsonSchemaValueToFormData } from "@webiny/app-admin";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { readAutomationConfig } from "~/editor/model/readAutomationConfig.js";
import type { AutomationFormValues } from "./StepFormData.js";
import { getCommonFormData } from "./getCommonFormData.js";

/*
 * The Automation step as form values: the common fields, the stored automation id (null for none)
 * and the settings converted to form data by the adapter (R271). A definition with no schema has
 * no settings form.
 */
export const getAutomationFormData = (
    step: EditorStep,
    definition: AutomationDefinition | null
): AutomationFormValues => {
    const config = readAutomationConfig(step.config);
    const common = getCommonFormData(step);

    let automationId: string | null = null;
    if (config.automationId !== "") {
        automationId = config.automationId;
    }

    let settings: Record<string, unknown> | null = null;
    if (definition !== null && definition.settingsSchema !== null) {
        settings = jsonSchemaValueToFormData(definition.settingsSchema, config.settings);
    }

    return { ...common, automationId, settings };
};
