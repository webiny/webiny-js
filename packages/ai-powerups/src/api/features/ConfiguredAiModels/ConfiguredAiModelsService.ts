import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import type { AiModel } from "@webiny/api-core/features/ai/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { sdkNameFromModel } from "~/api/features/shared/modelId.js";
import type { AiConnectionPreset } from "~/api/features/Connections/index.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";
import { ConfiguredAiModelsService as Abstraction } from "./abstractions.js";

class ConfiguredAiModelsServiceImpl implements Abstraction.Interface {
    public constructor(
        private ai: Ai.Interface,
        private getSettings: GetSettingsUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public async list(): Promise<Result<Abstraction.Model[], Error>> {
        // Failures are logged here, once, with the raw error; the callers show their own fixed
        // text and do not log again. The returned Error carries a fixed message only.
        let settings: IAiPowerUpsSettings;
        try {
            const settingsResult = await this.getSettings.execute();
            if (settingsResult.isFail()) {
                this.logger.error(
                    { error: settingsResult.error },
                    "Could not read the AI Power-Ups settings to list the configured models."
                );
                return Result.fail(new Error("Failed to load AI Power-Ups settings."));
            }
            settings = settingsResult.value;
        } catch (error) {
            this.logger.error(
                { error },
                "Could not read the AI Power-Ups settings to list the configured models."
            );
            return Result.fail(new Error("Failed to load AI Power-Ups settings."));
        }

        let models: AiModel[];
        try {
            models = await this.ai.listModels();
        } catch (error) {
            this.logger.error({ error }, "Could not list the AI provider models.");
            return Result.fail(new Error("Failed to list the configured AI models."));
        }

        const presets = settings.connections?.presets ?? [];
        const providerIds = new Set(
            presets.filter(preset => preset.apiKeyEncrypted).map(preset => preset.sdkName)
        );

        const configured = new Map<string, Abstraction.Model>();
        for (const model of models) {
            if (!providerIds.has(model.providerId)) {
                continue;
            }
            const id = `${model.providerId}/${model.modelId}`;
            if (configured.has(id)) {
                continue;
            }
            configured.set(id, {
                id,
                name: model.modelName,
                providerId: model.providerId,
                providerName: model.providerName
            });
        }
        return Result.ok([...configured.values()]);
    }

    public async findConnection(model: string): Promise<Result<AiConnectionPreset | null, Error>> {
        // `<provider>/<id>`: a non-empty provider before the first "/" and a non-empty id after it.
        // The id may contain further "/" (a gateway model), but no empty segment ("a//", "a/b/").
        const separator = model.indexOf("/");
        const idSegments = model.slice(separator + 1).split("/");
        if (separator < 1 || idSegments.some(segment => segment === "")) {
            return Result.ok(null);
        }

        let settings: IAiPowerUpsSettings;
        try {
            const settingsResult = await this.getSettings.execute();
            if (settingsResult.isFail()) {
                this.logger.error(
                    { error: settingsResult.error },
                    "Could not read the AI Power-Ups settings to find a model connection."
                );
                return Result.fail(new Error("Failed to load AI Power-Ups settings."));
            }
            settings = settingsResult.value;
        } catch (error) {
            this.logger.error(
                { error },
                "Could not read the AI Power-Ups settings to find a model connection."
            );
            return Result.fail(new Error("Failed to load AI Power-Ups settings."));
        }

        const sdkName = sdkNameFromModel(model);
        const presets = settings.connections?.presets ?? [];
        const connection = presets.find(preset => {
            return preset.sdkName === sdkName && Boolean(preset.apiKeyEncrypted);
        });
        return Result.ok(connection ?? null);
    }
}

export const ConfiguredAiModelsService = Abstraction.createImplementation({
    implementation: ConfiguredAiModelsServiceImpl,
    dependencies: [Ai, GetSettingsUseCase, Logger]
});
