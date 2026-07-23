import { createAbstraction } from "webiny/admin";

export interface ICompareRevisionsResult {
    html: string;
    summary: string;
}

export interface ICompareRevisionsGateway {
    execute(params: {
        modelId: string;
        revisionId1: string;
        revisionId2: string;
    }): Promise<ICompareRevisionsResult>;
}

export const CompareRevisionsGateway = createAbstraction<ICompareRevisionsGateway>(
    "CmsRevisionCompare/CompareRevisionsGateway"
);

export namespace CompareRevisionsGateway {
    export type Interface = ICompareRevisionsGateway;
}
