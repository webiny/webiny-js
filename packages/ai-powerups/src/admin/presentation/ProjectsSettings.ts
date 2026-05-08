import { generateAlphaNumericId } from "@webiny/utils";
import type { IFormModel } from "@webiny/app-admin";
import { AiPowerUpsSettingsGroup } from "./AiPowerUpsSettings/settingsGroup.js";

class ProjectsSettingsImpl implements AiPowerUpsSettingsGroup.Interface {
    name = "projects";
    label = "Projects";
    description = "Predefined prompting contexts.";

    buildForm(form: AiPowerUpsSettingsGroup.FormBuilder): void {
        form.fields(fields => ({
            presets: fields
                .object()
                .label("Presets")
                .renderer("objectAccordionMultiple", {
                    container: false,
                    addItemLabel: "Add project",
                    itemTitle: (data, index) => String(data.name || `Project #${index + 1}`)
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
                        .description("This name will be used to identify the project in the UI."),
                    description: f
                        .text()
                        .label("Description")
                        .description(
                            "Human-facing description shown in the project picker. Not sent to the LLM."
                        )
                        .renderer("textarea", { rows: 3 }),
                    instructions: f
                        .text()
                        .label("Instructions")
                        .description(
                            "System-prompt-style guidance that will be sent to the LLM when this project is selected."
                        )
                        .renderer("textarea", { rows: 6 }),
                    defaultReaderPersonaId: f
                        .text()
                        .label("Default Reader Persona")
                        .description(
                            "Auto-populates the reader persona when this project is selected."
                        )
                        .options((formModel: IFormModel) => {
                            const data = formModel.getData();
                            const presets = data?.readerPersonas?.presets;
                            if (!presets || presets.length === 0) {
                                return [];
                            }
                            return presets.map((preset: { id: string; name: string }) => ({
                                label: preset.name,
                                value: preset.id
                            }));
                        }),
                    defaultWriterPersonaId: f
                        .text()
                        .label("Default Writer Persona")
                        .description(
                            "Auto-populates the writer persona when this project is selected."
                        )
                        .options((formModel: IFormModel) => {
                            const data = formModel.getData();
                            const presets = data?.writerPersonas?.presets;
                            if (!presets || presets.length === 0) {
                                return [];
                            }
                            return presets.map((preset: { id: string; name: string }) => ({
                                label: preset.name,
                                value: preset.id
                            }));
                        }),
                    files: f
                        .file()
                        .label("Files")
                        .list()
                        .description(
                            "Reference files from the DAM to include as context for the LLM."
                        )
                        .note("Only JSON and text files will be sent to the LLM.")
                }))
                .list()
        }));

        form.layout(layout => [layout.row("presets")]);
    }
}

export const ProjectsSettings = AiPowerUpsSettingsGroup.createImplementation({
    implementation: ProjectsSettingsImpl,
    dependencies: []
});
