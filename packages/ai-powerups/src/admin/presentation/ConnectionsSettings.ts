import { generateAlphaNumericId } from "@webiny/utils";
import { AiPowerUpsSettingsGroup } from "./AiPowerUpsSettings/settingsGroup.js";
import {
    ListModelsUseCase,
    ListModelsRepository
} from "~/admin/features/listModels/abstractions.js";

/**
 * One row per API key. The model select moved to Model roles, so adding a second Anthropic model no
 * longer means pasting the same key twice.
 */
class ConnectionsSettingsImpl implements AiPowerUpsSettingsGroup.Interface {
    name = "connections";
    label = "Connections";
    description = "API keys for the AI vendors this project uses.";

    constructor(
        private useCase: ListModelsUseCase.Interface,
        private repository: ListModelsRepository.Interface
    ) {}

    async init(): Promise<void> {
        await this.useCase.execute();
    }

    buildForm(form: AiPowerUpsSettingsGroup.FormBuilder): void {
        form.fields(fields => ({
            presets: fields
                .object()
                .label("Connections")
                .renderer("objectAccordionMultiple", {
                    container: false,
                    addItemLabel: "Add connection",
                    itemTitle: (data, index) => String(data.name || `Connection #${index + 1}`)
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
                            "How this connection appears when picking a model. Name it after the key, not the vendor, so two keys for the same vendor stay distinguishable."
                        ),
                    sdkName: f
                        .text()
                        .label("Vendor")
                        .required("Vendor is required")
                        .description("Which provider this key belongs to.")
                        .options(() => this.getVendorOptions())
                        .renderer("select"),
                    apiKey: f
                        .text()
                        .label("API Key")
                        .required("API Key is required")
                        .description(
                            "Encrypted at rest. Only the last few characters are shown after saving."
                        )
                }))
                .list()
        }));

        form.layout(layout => [layout.row("presets")]);
    }

    /**
     * Derived from the registered SDK factories rather than hardcoded, so a project that registers
     * its own `AiSdkFactory` shows up here without a change to this file.
     */
    private getVendorOptions() {
        const seen = new Map<string, string>();

        for (const model of this.repository.getModels()) {
            seen.set(model.providerId, model.providerName);
        }

        return [...seen.entries()].map(([value, label]) => ({ label, value }));
    }
}

export const ConnectionsSettings = AiPowerUpsSettingsGroup.createImplementation({
    implementation: ConnectionsSettingsImpl,
    dependencies: [ListModelsUseCase, ListModelsRepository]
});
