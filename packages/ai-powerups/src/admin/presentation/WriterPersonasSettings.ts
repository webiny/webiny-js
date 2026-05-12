import { generateAlphaNumericId } from "@webiny/utils";
import { AiPowerUpsSettingsGroup } from "./AiPowerUpsSettings/settingsGroup.js";

class WriterPersonasSettingsImpl implements AiPowerUpsSettingsGroup.Interface {
    name = "writerPersonas";
    label = "Writer Personas";
    description = "Define how text should be written.";

    buildForm(form: AiPowerUpsSettingsGroup.FormBuilder): void {
        form.fields(fields => ({
            presets: fields
                .object()
                .label("Presets")
                .renderer("objectAccordionMultiple", {
                    container: false,
                    addItemLabel: "Add writer persona",
                    itemTitle: (data, index) => String(data.name || `Writer Persona #${index + 1}`)
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
                            "This name will be used to identify the writer persona in the UI."
                        ),
                    description: f
                        .text()
                        .label("Description")
                        .required("Description is required")
                        .description(
                            "Describe how this persona writes and communicates. This will be used when prompting AI."
                        )
                        .renderer("textarea", { rows: 8 }),
                    style: f
                        .text()
                        .label("Style")
                        .description(
                            "Optional hints about the tone or style this persona should adopt when writing."
                        )
                        .renderer("textarea", { rows: 3 })
                }))
                .list()
        }));

        form.layout(layout => [layout.row("presets")]);
    }
}

export const WriterPersonasSettings = AiPowerUpsSettingsGroup.createImplementation({
    implementation: WriterPersonasSettingsImpl,
    dependencies: []
});
