import { createAbstraction } from "@webiny/feature/admin";
import type { CmsContentEntryRevision, CmsModel } from "~/types.js";

export interface IListRevisionsParams {
    model: CmsModel;
    entryId: string;
}

export interface IListRevisionsGateway {
    execute(params: IListRevisionsParams): Promise<CmsContentEntryRevision[]>;
}

export const ListRevisionsGateway =
    createAbstraction<IListRevisionsGateway>("ListRevisionsGateway");

export namespace ListRevisionsGateway {
    export type Interface = IListRevisionsGateway;
}

export interface IListRevisionsRepository {
    execute(params: IListRevisionsParams): Promise<CmsContentEntryRevision[]>;
}

export const ListRevisionsRepository =
    createAbstraction<IListRevisionsRepository>("ListRevisionsRepository");

export namespace ListRevisionsRepository {
    export type Interface = IListRevisionsRepository;
}

export interface IListRevisionsUseCase {
    execute(params: IListRevisionsParams): Promise<CmsContentEntryRevision[]>;
}

export const ListRevisionsUseCase =
    createAbstraction<IListRevisionsUseCase>("ListRevisionsUseCase");

export namespace ListRevisionsUseCase {
    export type Interface = IListRevisionsUseCase;
}
