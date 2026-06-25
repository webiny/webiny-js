import { createAbstraction } from "@webiny/feature/admin";
import type { CmsContentEntry, CmsModel } from "~/types.js";

export interface IUnpublishEntryParams {
    model: CmsModel;
    revisionId: string;
}

export interface IUnpublishEntryGateway {
    execute(params: IUnpublishEntryParams): Promise<CmsContentEntry>;
}

export const UnpublishEntryGateway =
    createAbstraction<IUnpublishEntryGateway>("UnpublishEntryGateway");

export namespace UnpublishEntryGateway {
    export type Interface = IUnpublishEntryGateway;
}

export interface IUnpublishEntryRepository {
    execute(params: IUnpublishEntryParams): Promise<CmsContentEntry>;
}

export const UnpublishEntryRepository = createAbstraction<IUnpublishEntryRepository>(
    "UnpublishEntryRepository"
);

export namespace UnpublishEntryRepository {
    export type Interface = IUnpublishEntryRepository;
}

export interface IUnpublishEntryUseCase {
    execute(params: IUnpublishEntryParams): Promise<CmsContentEntry>;
}

export const UnpublishEntryUseCase =
    createAbstraction<IUnpublishEntryUseCase>("UnpublishEntryUseCase");

export namespace UnpublishEntryUseCase {
    export type Interface = IUnpublishEntryUseCase;
}
