import { createAbstraction } from "@webiny/feature/admin";
import type { CmsContentEntry, CmsModel } from "~/types.js";

// Get Singleton

export interface IGetSingletonEntryParams {
    model: CmsModel;
}

export interface IGetSingletonEntryGateway {
    execute(params: IGetSingletonEntryParams): Promise<CmsContentEntry>;
}

export const GetSingletonEntryGateway = createAbstraction<IGetSingletonEntryGateway>(
    "GetSingletonEntryGateway"
);

export namespace GetSingletonEntryGateway {
    export type Interface = IGetSingletonEntryGateway;
}

export interface IGetSingletonEntryUseCase {
    execute(params: IGetSingletonEntryParams): Promise<CmsContentEntry>;
}

export const GetSingletonEntryUseCase = createAbstraction<IGetSingletonEntryUseCase>(
    "GetSingletonEntryUseCase"
);

export namespace GetSingletonEntryUseCase {
    export type Interface = IGetSingletonEntryUseCase;
}

// Update Singleton

export interface IUpdateSingletonEntryParams {
    model: CmsModel;
    data: Record<string, unknown>;
    options?: { skipValidation?: boolean };
}

export interface IUpdateSingletonEntryGateway {
    execute(params: IUpdateSingletonEntryParams): Promise<CmsContentEntry>;
}

export const UpdateSingletonEntryGateway = createAbstraction<IUpdateSingletonEntryGateway>(
    "UpdateSingletonEntryGateway"
);

export namespace UpdateSingletonEntryGateway {
    export type Interface = IUpdateSingletonEntryGateway;
}

export interface IUpdateSingletonEntryUseCase {
    execute(params: IUpdateSingletonEntryParams): Promise<CmsContentEntry>;
}

export const UpdateSingletonEntryUseCase = createAbstraction<IUpdateSingletonEntryUseCase>(
    "UpdateSingletonEntryUseCase"
);

export namespace UpdateSingletonEntryUseCase {
    export type Interface = IUpdateSingletonEntryUseCase;
}
