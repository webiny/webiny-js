import { buildFieldsFromJsonSchema } from "@webiny/app-admin";
import type { FormModelFactory } from "@webiny/app-admin";
import type { JsonSchema } from "@webiny/app-admin";
import type { JsonSchemaFieldOptions } from "@webiny/app-admin";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import { AUTOMATION_FORM_MESSAGES } from "./automationFormMessages.js";
import { buildCommonFields } from "./buildCommonFields.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";
import { validateAfterChange } from "./validateAfterChange.js";

// The `team` hint of a setting renders as the teams picker and the `user` hint as the user picker (R271, R285).
const SETTINGS_OPTIONS: JsonSchemaFieldOptions = {
    uiRenderers: { team: STEP_FORM_RENDERER.teams, user: STEP_FORM_RENDERER.userPicker }
};

function buildSettingsField(
    registry: FormModelFactory.FieldBuilderRegistry,
    automationName: string,
    schema: JsonSchema,
    readOnly: boolean
): FormModelFactory.FieldBuilder {
    return registry
        .object()
        .label("Settings")
        .renderer("objectAccordionSingle", {
            open: true,
            itemDescription: () => `Fields defined by ${automationName}.`
        })
        .fields(nested => {
            const builders = buildFieldsFromJsonSchema(schema, nested, SETTINGS_OPTIONS);
            for (const [key, builder] of Object.entries(builders)) {
                builder.afterChange(validateAfterChange(`settings.${key}`));
                builder.disabled(readOnly);
            }
            return builders;
        });
}

export interface AutomationStepFormParams {
    // The chosen definition; null for a step with no (or an unlisted) automation: no settings field.
    definition: AutomationDefinition | null;
    // Every field is disabled while a save is in flight (the editor ignores edits then).
    readOnly?: boolean;
}

/*
 * The Automation step form (R270, R274): the common fields, the automation cards, the settings
 * generated from the definition's JSON schema, and Notify via. One body, no tabs.
 */
export const buildAutomationStepForm = (
    params: AutomationStepFormParams
): FormModelFactory.Config => {
    const { definition } = params;
    const readOnly = params.readOnly ?? false;

    return {
        fields: registry => {
            const common = buildCommonFields({
                registry,
                descriptionPlaceholder: AUTOMATION_FORM_MESSAGES.descriptionPlaceholder,
                readOnly
            });

            const automationId = registry
                .text()
                .label("Automation")
                .renderer(STEP_FORM_RENDERER.automations)
                .afterChange(validateAfterChange("automationId"))
                .disabled(readOnly);

            const fields: Record<string, FormModelFactory.FieldBuilder> = {
                title: common.title,
                color: common.color,
                description: common.description,
                automationId
            };

            if (definition !== null && definition.settingsSchema !== null) {
                fields.settings = buildSettingsField(
                    registry,
                    definition.name,
                    definition.settingsSchema,
                    readOnly
                );
            }

            fields.notifications = common.notifications;

            return fields;
        }
    };
};
