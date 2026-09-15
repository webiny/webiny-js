import { createAbstraction } from "@webiny/feature/admin";

export interface ICompareEntryRevisionsResult {
    html: string;
    summary: string;
}

export interface ICompareEntryRevisionsParams {
    modelId: string;
    revisionId1: string;
    revisionId2: string;
}

export interface ICompareEntryRevisionsUseCase {
    execute(params: ICompareEntryRevisionsParams): Promise<ICompareEntryRevisionsResult>;
}

export const CompareEntryRevisionsUseCase = createAbstraction<ICompareEntryRevisionsUseCase>(
    "AiPowerUps/CompareEntryRevisionsUseCase"
);

export namespace CompareEntryRevisionsUseCase {
    export type Interface = ICompareEntryRevisionsUseCase;
    export type Params = ICompareEntryRevisionsParams;
    export type Result = ICompareEntryRevisionsResult;
}

export interface ICompareEntryRevisionsRepository {
    execute(params: ICompareEntryRevisionsParams): Promise<ICompareEntryRevisionsResult>;
}

export const CompareEntryRevisionsRepository = createAbstraction<ICompareEntryRevisionsRepository>(
    "AiPowerUps/CompareEntryRevisionsRepository"
);

export namespace CompareEntryRevisionsRepository {
    export type Interface = ICompareEntryRevisionsRepository;
}

export interface ICompareEntryRevisionsGateway {
    execute(params: ICompareEntryRevisionsParams): Promise<ICompareEntryRevisionsResult>;
}

export const CompareEntryRevisionsGateway = createAbstraction<ICompareEntryRevisionsGateway>(
    "AiPowerUps/CompareEntryRevisionsGateway"
);

export namespace CompareEntryRevisionsGateway {
    export type Interface = ICompareEntryRevisionsGateway;
}
