import { createAbstraction } from "@webiny/feature/admin";
import type { CmsContentEntry, CmsModel } from "~/types.js";

export interface IRestoreFromTrashParams {
    model: CmsModel;
    id: string;
}

export interface IRestoreFromTrashGateway {
    execute(params: IRestoreFromTrashParams): Promise<CmsContentEntry>;
}

export const RestoreFromTrashGateway =
    createAbstraction<IRestoreFromTrashGateway>("RestoreFromTrashGateway");

export namespace RestoreFromTrashGateway {
    export type Interface = IRestoreFromTrashGateway;
}

export interface IRestoreFromTrashRepository {
    execute(params: IRestoreFromTrashParams): Promise<CmsContentEntry>;
}

export const RestoreFromTrashRepository = createAbstraction<IRestoreFromTrashRepository>(
    "RestoreFromTrashRepository"
);

export namespace RestoreFromTrashRepository {
    export type Interface = IRestoreFromTrashRepository;
}

export interface IRestoreFromTrashUseCase {
    execute(params: IRestoreFromTrashParams): Promise<CmsContentEntry>;
}

export const RestoreFromTrashUseCase =
    createAbstraction<IRestoreFromTrashUseCase>("RestoreFromTrashUseCase");

export namespace RestoreFromTrashUseCase {
    export type Interface = IRestoreFromTrashUseCase;
}
