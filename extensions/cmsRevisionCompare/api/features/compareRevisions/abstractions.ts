import { createAbstraction } from "webiny/api";

export interface ICompareRevisionsResult {
    html: string;
    summary: string;
}

export interface ICompareRevisionsParams {
    modelId: string;
    revisionId1: string;
    revisionId2: string;
}

export interface ICompareRevisionsUseCase {
    execute(params: ICompareRevisionsParams): Promise<ICompareRevisionsResult>;
}

export const CompareRevisionsUseCase = createAbstraction<ICompareRevisionsUseCase>(
    "CmsRevisionCompare/CompareRevisionsUseCase"
);

export namespace CompareRevisionsUseCase {
    export type Interface = ICompareRevisionsUseCase;
    export type Params = ICompareRevisionsParams;
    export type Result = ICompareRevisionsResult;
}
