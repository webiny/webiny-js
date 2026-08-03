import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CachedCrawl, IExtractionLog } from "~/features/shared/abstractions.js";
import type { ExtractionError } from "~/features/shared/errors.js";

export interface CrawlProgress {
    pagesDone: number;
    pagesTotal: number;
    currentUrl?: string;
}

export interface ICrawlSiteParams {
    extractionId: string;
    entryUrl: string;
    /** Total pages including the entry URL. */
    crawlLimit?: number;
    /** Set to skip the cache and read the site again. */
    force?: boolean;
    onProgress?(progress: CrawlProgress): Promise<void>;
    /**
     * The task's logger, so the debug trail lands on the task record rather than in CloudWatch.
     *
     * Defaults to silent when omitted, which is what a test wants.
     */
    log?: IExtractionLog;
}

export interface ICrawlSiteUseCase {
    execute(params: ICrawlSiteParams): Promise<Result<CachedCrawl, ExtractionError>>;
}

/** Phase one: read the site and produce the inventory the model will judge. */
export const CrawlSiteUseCase = createAbstraction<ICrawlSiteUseCase>("Theme/CrawlSiteUseCase");

export namespace CrawlSiteUseCase {
    export type Interface = ICrawlSiteUseCase;
    export type Params = ICrawlSiteParams;
    export type Progress = CrawlProgress;
}
