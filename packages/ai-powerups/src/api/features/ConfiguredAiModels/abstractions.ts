import { createAbstraction, type Result } from "@webiny/feature/api";
import type { AiConnectionPreset } from "~/api/features/Connections/index.js";

export interface ConfiguredAiModel {
    /** The full id `Ai` expects: `"<providerId>/<modelId>"`. */
    id: string;
    /** The provider's human-friendly model name. */
    name: string;
    providerId: string;
    providerName: string;
}

export interface IConfiguredAiModelsService {
    /**
     * `Ai.listModels()` filtered to the providers that have a settings connection with a stored
     * key, deduplicated by `id`. A stored key is not proven to work (A60).
     */
    list(): Promise<Result<ConfiguredAiModel[], Error>>;
    /**
     * The connection the resolver runs `model` on: the first settings connection with a stored key
     * whose `sdkName` is the provider half of `model`. `null` when there is none or `model` is
     * not `<provider>/<id>`.
     */
    findConnection(model: string): Promise<Result<AiConnectionPreset | null, Error>>;
}

/**
 * The one source of "models with a configured connection" (R169): the capability resolver, the
 * workflow editor's model list and the AI step's save-time check all read it.
 */
export const ConfiguredAiModelsService = createAbstraction<IConfiguredAiModelsService>(
    "AiPowerUpsConfiguredAiModelsService"
);

export namespace ConfiguredAiModelsService {
    export type Interface = IConfiguredAiModelsService;
    export type Model = ConfiguredAiModel;
}
