import { generateAlphaNumericId } from "@webiny/utils";
import { AiPowerUpsSettingsGroup } from "./AiPowerUpsSettings/settingsGroup.js";

class PersonasSettingsImpl implements AiPowerUpsSettingsGroup.Interface {
    name = "personas";
    label = "Personas";
    description = "Configure personas for content generation.";

    buildForm(form: AiPowerUpsSettingsGroup.FormBuilder): void {
        form.fields(fields => ({
            presets: fields
                .object()
                .renderer("objectAccordionMultiple", {
                    container: false,
                    addItemLabel: "Add persona",
                    itemTitle: (data, index) => String(data.name || `Persona #${index + 1}`)
                })
                .fields(f => ({
                    id: f
                        .text()
                        .hidden()
                        .defaultValue(() => generateAlphaNumericId(10)),
                    name: f
                        .text()
                        .label("Name")
                        .required("Name is required")
                        .description("This name will be used to identify the persona in the UI."),
                    description: f
                        .text()
                        .label("Description")
                        .required("Description is required")
                        .description("Persona description will be used when prompting AI.")
                        .renderer("textarea", { rows: 8 })
                }))
                .list()
        }));

        form.layout(layout => [layout.row("personas")]);
    }
}

export const PersonasSettings = AiPowerUpsSettingsGroup.createImplementation({
    implementation: PersonasSettingsImpl,
    dependencies: []
});
