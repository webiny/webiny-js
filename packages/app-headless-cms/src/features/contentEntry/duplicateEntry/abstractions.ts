import { createAbstraction } from "@webiny/feature/admin";
import type { CmsContentEntry, CmsModel } from "~/types.js";

export interface IDuplicateEntryParams {
    model: CmsModel;
    revisionId: string;
}

// Gateway

export interface IDuplicateEntryGateway {
    execute(params: IDuplicateEntryParams): Promise<CmsContentEntry>;
}

export const DuplicateEntryGateway =
    createAbstraction<IDuplicateEntryGateway>("DuplicateEntryGateway");

export namespace DuplicateEntryGateway {
    export type Interface = IDuplicateEntryGateway;
}

// Repository

export interface IDuplicateEntryRepository {
    execute(params: IDuplicateEntryParams): Promise<CmsContentEntry>;
}

export const DuplicateEntryRepository = createAbstraction<IDuplicateEntryRepository>(
    "DuplicateEntryRepository"
);

export namespace DuplicateEntryRepository {
    export type Interface = IDuplicateEntryRepository;
}

// UseCase

export interface IDuplicateEntryUseCase {
    execute(params: IDuplicateEntryParams): Promise<CmsContentEntry>;
}

export const DuplicateEntryUseCase =
    createAbstraction<IDuplicateEntryUseCase>("DuplicateEntryUseCase");

export namespace DuplicateEntryUseCase {
    export type Interface = IDuplicateEntryUseCase;
}
