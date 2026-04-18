import { AiPowerUpsSettingsGroup } from "../AiPowerUpsSettings/settingsGroup.js";
import { ListModelsUseCase, ListModelsRepository } from "../features/listModels/abstractions.js";

class GeneralSettingsGroupImpl implements AiPowerUpsSettingsGroup.Interface {
    name = "general";
    label = "General";
    description = "Configure AI model presets.";

    constructor(
        private useCase: ListModelsUseCase.Interface,
        private repository: ListModelsRepository.Interface
    ) {}

    buildForm(form: AiPowerUpsSettingsGroup.FormBuilder): void {
        void this.useCase.execute();

        form.fields(fields => ({
            presets: fields
                .object()
                .label("Presets")
                .renderer("objectListFlat")
                .fields(f => ({
                    name: f.text().label("Name").required("Name is required"),
                    model: f
                        .select()
                        .label("Model")
                        .required("Model is required")
                        .options(() => this.getModelOptions()),
                    apiKey: f.text().label("API Key").required("API Key is required")
                }))
                .list()
                // .itemTitle(data =>  String(data.name || "Preset"))
        }));

        form.layout(layout => [layout.row("presets")]);
    }

    private getModelOptions() {
        return this.repository.getModels().map(model => ({
            label: model,
            value: model
        }));
    }
}

export const GeneralSettingsGroup = AiPowerUpsSettingsGroup.createImplementation({
    implementation: GeneralSettingsGroupImpl,
    dependencies: [ListModelsUseCase, ListModelsRepository]
});
