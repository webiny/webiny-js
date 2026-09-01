import { createAbstraction } from "@webiny/feature/admin";
import type { CmsContentEntry, CmsModel } from "~/types.js";

export interface IUpdateEntryParams {
    model: CmsModel;
    revisionId: string;
    data: Record<string, unknown>;
    options?: { skipValidation?: boolean };
}

export interface IUpdateEntryGateway {
    execute(params: IUpdateEntryParams): Promise<CmsContentEntry>;
}

export const UpdateEntryGateway = createAbstraction<IUpdateEntryGateway>("UpdateEntryGateway");

export namespace UpdateEntryGateway {
    export type Interface = IUpdateEntryGateway;
}

export interface IUpdateEntryRepository {
    execute(params: IUpdateEntryParams): Promise<CmsContentEntry>;
}

export const UpdateEntryRepository =
    createAbstraction<IUpdateEntryRepository>("UpdateEntryRepository");

export namespace UpdateEntryRepository {
    export type Interface = IUpdateEntryRepository;
}

export interface IUpdateEntryUseCase {
    execute(params: IUpdateEntryParams): Promise<CmsContentEntry>;
}

export const UpdateEntryUseCase = createAbstraction<IUpdateEntryUseCase>("UpdateEntryUseCase");

export namespace UpdateEntryUseCase {
    export type Interface = IUpdateEntryUseCase;
}
