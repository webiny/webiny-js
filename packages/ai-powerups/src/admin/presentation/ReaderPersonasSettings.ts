import { generateAlphaNumericId } from "@webiny/utils";
import { AiPowerUpsSettingsGroup } from "./AiPowerUpsSettings/settingsGroup.js";

class ReaderPersonasSettingsImpl implements AiPowerUpsSettingsGroup.Interface {
    name = "readerPersonas";
    label = "Reader Personas";
    description = "Define who the content is written for.";

    buildForm(form: AiPowerUpsSettingsGroup.FormBuilder): void {
        form.fields(fields => ({
            presets: fields
                .object()
                .label("Presets")
                .renderer("objectAccordionMultiple", {
                    container: false,
                    addItemLabel: "Add reader persona",
                    itemTitle: (data, index) => String(data.name || `Reader Persona #${index + 1}`)
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
                        .description(
                            "This name will be used to identify the reader persona in the UI."
                        ),
                    description: f
                        .text()
                        .label("Description")
                        .required("Description is required")
                        .description(
                            "Describe who this reader is and what they care about. This will be used when prompting AI."
                        )
                        .renderer("textarea", { rows: 8 }),
                    style: f
                        .text()
                        .label("Style")
                        .description(
                            "Optional hints about the expected tone or style when writing for this reader."
                        )
                        .renderer("textarea", { rows: 3 })
                }))
                .list()
        }));

        form.layout(layout => [layout.row("presets")]);
    }
}

export const ReaderPersonasSettings = AiPowerUpsSettingsGroup.createImplementation({
    implementation: ReaderPersonasSettingsImpl,
    dependencies: []
});
