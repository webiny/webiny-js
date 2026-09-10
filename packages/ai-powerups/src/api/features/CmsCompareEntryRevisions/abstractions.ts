import { createAbstraction } from "@webiny/feature/api";

export interface ICmsCompareEntryRevisionsResult {
    html: string;
    summary: string;
}

export interface ICmsCompareEntryRevisionsParams {
    modelId: string;
    revisionId1: string;
    revisionId2: string;
}

export interface ICmsCompareEntryRevisionsUseCase {
    execute(params: ICmsCompareEntryRevisionsParams): Promise<ICmsCompareEntryRevisionsResult>;
}

export const CmsCompareEntryRevisionsUseCase = createAbstraction<ICmsCompareEntryRevisionsUseCase>(
    "AiPowerUpsCmsCompareEntryRevisionsUseCase"
);

export namespace CmsCompareEntryRevisionsUseCase {
    export type Interface = ICmsCompareEntryRevisionsUseCase;
    export type Params = ICmsCompareEntryRevisionsParams;
    export type Result = ICmsCompareEntryRevisionsResult;
}
