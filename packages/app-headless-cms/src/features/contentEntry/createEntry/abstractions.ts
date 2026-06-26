import { createAbstraction } from "@webiny/feature/admin";
import type { CmsContentEntry, CmsModel } from "~/types.js";

// Gateway

export interface ICreateEntryGatewayParams {
    model: CmsModel;
    data: Record<string, unknown>;
    options?: { skipValidation?: boolean };
}

export interface ICreateEntryGateway {
    execute(params: ICreateEntryGatewayParams): Promise<CmsContentEntry>;
}

export const CreateEntryGateway = createAbstraction<ICreateEntryGateway>("CreateEntryGateway");

export namespace CreateEntryGateway {
    export type Interface = ICreateEntryGateway;
}

// Repository

export interface ICreateEntryRepository {
    execute(params: ICreateEntryGatewayParams): Promise<CmsContentEntry>;
}

export const CreateEntryRepository =
    createAbstraction<ICreateEntryRepository>("CreateEntryRepository");

export namespace CreateEntryRepository {
    export type Interface = ICreateEntryRepository;
}

// UseCase

export interface ICreateEntryUseCase {
    execute(params: ICreateEntryGatewayParams): Promise<CmsContentEntry>;
}

export const CreateEntryUseCase = createAbstraction<ICreateEntryUseCase>("CreateEntryUseCase");

export namespace CreateEntryUseCase {
    export type Interface = ICreateEntryUseCase;
}
