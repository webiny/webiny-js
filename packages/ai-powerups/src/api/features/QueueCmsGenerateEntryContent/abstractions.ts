import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsGenerateEntryContentParams } from "~/api/features/CmsGenerateEntryContent/abstractions.js";

export interface QueueCmsGenerateEntryContentResult {
    id: string;
}

export interface IQueueCmsGenerateEntryContentUseCase {
    execute(
        params: CmsGenerateEntryContentParams
    ): Promise<Result<QueueCmsGenerateEntryContentResult, Error>>;
}

/** Queues the background task that generates CMS entry content. */
export const QueueCmsGenerateEntryContentUseCase =
    createAbstraction<IQueueCmsGenerateEntryContentUseCase>(
        "AiPowerUpsQueueCmsGenerateEntryContentUseCase"
    );

export namespace QueueCmsGenerateEntryContentUseCase {
    export type Interface = IQueueCmsGenerateEntryContentUseCase;
    export type Params = CmsGenerateEntryContentParams;
    export type Return = Promise<Result<QueueCmsGenerateEntryContentResult, Error>>;
}
