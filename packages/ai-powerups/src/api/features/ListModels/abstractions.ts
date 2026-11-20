import { createAbstraction, Result } from "@webiny/feature/api";
import type { AiModel } from "@webiny/api-core/features/ai/index.js";

export interface IListModelsUseCase {
    execute(): Promise<Result<AiModel[], Error>>;
}

/** Lists the AI models that can be used in AI Power-Ups provider presets. */
export const ListModelsUseCase = createAbstraction<IListModelsUseCase>(
    "AiPowerUpsListModelsUseCase"
);

export namespace ListModelsUseCase {
    export type Interface = IListModelsUseCase;
}
