import { createAbstraction } from "@webiny/feature/admin";
import type { CmsReferenceEntry } from "../refTypes.js";

// Gateway

export interface IGetContentEntriesGatewayParams {
    entries: Array<{ id: string; modelId: string }>;
}

export interface IGetContentEntriesGatewayResult {
    latest: CmsReferenceEntry[];
    published: CmsReferenceEntry[];
}

export interface IGetContentEntriesGateway {
    execute(params: IGetContentEntriesGatewayParams): Promise<IGetContentEntriesGatewayResult>;
}

export const GetContentEntriesGateway = createAbstraction<IGetContentEntriesGateway>(
    "GetContentEntriesGateway"
);

export namespace GetContentEntriesGateway {
    export type Interface = IGetContentEntriesGateway;
}

// UseCase

export interface IGetContentEntriesUseCaseParams {
    entries: Array<{ id: string; modelId: string }>;
}

export interface IGetContentEntriesUseCaseResult {
    latest: CmsReferenceEntry[];
    published: CmsReferenceEntry[];
}

export interface IGetContentEntriesUseCase {
    execute(params: IGetContentEntriesUseCaseParams): Promise<IGetContentEntriesUseCaseResult>;
}

export const GetContentEntriesUseCase = createAbstraction<IGetContentEntriesUseCase>(
    "GetContentEntriesUseCase"
);

export namespace GetContentEntriesUseCase {
    export type Interface = IGetContentEntriesUseCase;
}
