import { createJsonSchemaValidator } from "@webiny/app-admin/features/formModel/jsonSchema/createJsonSchemaValidator.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import { isNonEmptySettings } from "./isNonEmptySettings.js";

export interface AutomationWarningsParams {
    // Every definition the server lists, not only those covering the model.
    definitions: AutomationDefinition[];
    selectedId: string | null;
    // The settings stored on the step when it was loaded.
    storedSettings: unknown;
    // True until the admin changes the settings in this session (QBZ-13).
    settingsPristine: boolean;
}

export interface AutomationWarnings {
    warning: string | null;
    settingsWarning: string | null;
}

/*
 * The two card warnings of R274: the stored automation is not listed (the id stands for the name,
 * the step stores nothing else), and the stored settings fail the definition's schema while the
 * admin has not changed them (QBZ-13). Settings never filled in are not "saved settings".
 */
export const getAutomationWarnings = (params: AutomationWarningsParams): AutomationWarnings => {
    const { definitions, selectedId, storedSettings, settingsPristine } = params;
    const warnings: AutomationWarnings = { warning: null, settingsWarning: null };

    if (selectedId === null) {
        return warnings;
    }

    const definition = definitions.find(item => item.id === selectedId);
    if (!definition) {
        warnings.warning = `The automation “${selectedId}” no longer exists.`;
        return warnings;
    }

    const schema = definition.settingsSchema;
    if (schema === null || !settingsPristine || !isNonEmptySettings(storedSettings)) {
        return warnings;
    }

    const result = createJsonSchemaValidator(schema).validate(storedSettings);
    if (!result.valid && result.issues.length > 0) {
        warnings.settingsWarning = `Saved settings no longer validate: ${result.issues[0].message}`;
    }

    return warnings;
};
