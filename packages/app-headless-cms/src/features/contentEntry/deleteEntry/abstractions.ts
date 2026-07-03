import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel } from "~/types.js";

export interface IDeleteEntryParams {
    model: CmsModel;
    id: string;
}

export interface IDeleteEntryGateway {
    execute(params: IDeleteEntryParams): Promise<boolean>;
}

export const DeleteEntryGateway = createAbstraction<IDeleteEntryGateway>("DeleteEntryGateway");

export namespace DeleteEntryGateway {
    export type Interface = IDeleteEntryGateway;
}

export interface IDeleteEntryRepository {
    execute(params: IDeleteEntryParams): Promise<boolean>;
}

export const DeleteEntryRepository =
    createAbstraction<IDeleteEntryRepository>("DeleteEntryRepository");

export namespace DeleteEntryRepository {
    export type Interface = IDeleteEntryRepository;
}

export interface IDeleteEntryUseCase {
    execute(params: IDeleteEntryParams): Promise<boolean>;
}

export const DeleteEntryUseCase = createAbstraction<IDeleteEntryUseCase>("DeleteEntryUseCase");

export namespace DeleteEntryUseCase {
    export type Interface = IDeleteEntryUseCase;
}
