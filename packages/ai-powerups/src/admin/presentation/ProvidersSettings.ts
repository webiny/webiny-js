import { AiPowerUpsSettingsGroup } from "./AiPowerUpsSettings/settingsGroup.js";
import {
  ListModelsUseCase,
  ListModelsRepository,
} from "~/admin/features/listModels/abstractions.js";

class ProviderSettingsImpl implements AiPowerUpsSettingsGroup.Interface {
  name = "providers";
  label = "Providers";
  description = "Configure AI model providers.";

  constructor(
    private useCase: ListModelsUseCase.Interface,
    private repository: ListModelsRepository.Interface,
  ) {}

  buildForm(form: AiPowerUpsSettingsGroup.FormBuilder): void {
    void this.useCase.execute();

    form.fields((fields) => ({
      presets: fields
        .object()
        .renderer("objectListFlat", {
          addItemLabel: "Add preset",
          itemTitle: (data, index) =>
            String(data.name || `Preset #${index + 1}`),
        })
        .fields((f) => ({
          name: f.text().label("Name").required("Name is required"),
          model: f
            .select()
            .label("Model")
            .required("Model is required")
            .options(() => this.getModelOptions()),
          apiKey: f.text().label("API Key").required("API Key is required"),
        }))
        .list(),
    }));

    form.layout((layout) => [layout.row("presets")]);
  }

  private getModelOptions() {
    return this.repository.getModels().map((model) => ({
      label: `${model.modelName} (${model.modelId})`,
      value: `${model.providerId}/${model.modelId}`,
    }));
  }
}

export const ProviderSettings = AiPowerUpsSettingsGroup.createImplementation({
  implementation: ProviderSettingsImpl,
  dependencies: [ListModelsUseCase, ListModelsRepository],
});
