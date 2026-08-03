import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CachedCrawl, IExtractionLog } from "~/features/shared/abstractions.js";
import type { ExtractionError } from "~/features/shared/errors.js";
import type { ExtractionMetadata } from "~/model/applyAssignment.js";

export interface IAnalyseCrawlParams {
    crawl: CachedCrawl;
    /** Name for the draft theme. */
    themeName: string;
    /** The task's logger; silent when omitted. */
    log?: IExtractionLog;
}

export interface AnalysedCrawl {
    themeId: string;
    metadata: ExtractionMetadata;
}

export interface IAnalyseCrawlUseCase {
    execute(params: IAnalyseCrawlParams): Promise<Result<AnalysedCrawl, ExtractionError>>;
}

/** Phase two: ask the model to judge the inventory, then write the draft theme. */
export const AnalyseCrawlUseCase = createAbstraction<IAnalyseCrawlUseCase>(
    "Theme/AnalyseCrawlUseCase"
);

export namespace AnalyseCrawlUseCase {
    export type Interface = IAnalyseCrawlUseCase;
    export type Params = IAnalyseCrawlParams;
    export type Output = AnalysedCrawl;
}
