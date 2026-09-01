import { createAbstraction } from "@webiny/feature/admin";
import type { CmsContentEntry, CmsModel } from "~/types.js";

// Extension point for field selection

export interface IGetEntryGraphQLFieldSelection {
    getSelection(): string[];
}

export const GetEntryGraphQLFieldSelection = createAbstraction<IGetEntryGraphQLFieldSelection>(
    "GetEntryGraphQLFieldSelection"
);

export namespace GetEntryGraphQLFieldSelection {
    export type Interface = IGetEntryGraphQLFieldSelection;
}

export interface IGetEntryParams {
    model: CmsModel;
    id: string;
}

// Gateway

export interface IGetEntryGateway {
    execute(params: IGetEntryParams): Promise<CmsContentEntry>;
}

export const GetEntryGateway = createAbstraction<IGetEntryGateway>("GetEntryGateway");

export namespace GetEntryGateway {
    export type Interface = IGetEntryGateway;
}

// Repository

export interface IGetEntryRepository {
    execute(params: IGetEntryParams): Promise<CmsContentEntry>;
}

export const GetEntryRepository = createAbstraction<IGetEntryRepository>("GetEntryRepository");

export namespace GetEntryRepository {
    export type Interface = IGetEntryRepository;
}

// UseCase

export interface IGetEntryUseCase {
    execute(params: IGetEntryParams): Promise<CmsContentEntry>;
}

export const GetEntryUseCase = createAbstraction<IGetEntryUseCase>("GetEntryUseCase");

export namespace GetEntryUseCase {
    export type Interface = IGetEntryUseCase;
}
