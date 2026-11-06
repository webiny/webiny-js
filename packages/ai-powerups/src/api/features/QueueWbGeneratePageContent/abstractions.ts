import { createAbstraction, Result } from "@webiny/feature/api";
import type { WbGeneratePageContentParams } from "~/api/features/WbGeneratePageContent/abstractions.js";

export interface QueueWbGeneratePageContentResult {
    id: string;
}

export interface IQueueWbGeneratePageContentUseCase {
    execute(
        params: WbGeneratePageContentParams
    ): Promise<Result<QueueWbGeneratePageContentResult, Error>>;
}

/** Queues the background task that generates Website Builder page content. */
export const QueueWbGeneratePageContentUseCase =
    createAbstraction<IQueueWbGeneratePageContentUseCase>(
        "AiPowerUpsQueueWbGeneratePageContentUseCase"
    );

export namespace QueueWbGeneratePageContentUseCase {
    export type Interface = IQueueWbGeneratePageContentUseCase;
    export type Params = WbGeneratePageContentParams;
    export type Return = Promise<Result<QueueWbGeneratePageContentResult, Error>>;
}
