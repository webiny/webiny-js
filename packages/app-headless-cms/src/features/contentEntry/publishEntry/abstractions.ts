import { createAbstraction } from "@webiny/feature/admin";
import type { CmsContentEntry, CmsModel } from "~/types.js";

export interface IPublishEntryParams {
    model: CmsModel;
    revisionId: string;
}

export interface IPublishEntryGateway {
    execute(params: IPublishEntryParams): Promise<CmsContentEntry>;
}

export const PublishEntryGateway = createAbstraction<IPublishEntryGateway>("PublishEntryGateway");

export namespace PublishEntryGateway {
    export type Interface = IPublishEntryGateway;
}

export interface IPublishEntryRepository {
    execute(params: IPublishEntryParams): Promise<CmsContentEntry>;
}

export const PublishEntryRepository =
    createAbstraction<IPublishEntryRepository>("PublishEntryRepository");

export namespace PublishEntryRepository {
    export type Interface = IPublishEntryRepository;
}

export interface IPublishEntryUseCase {
    execute(params: IPublishEntryParams): Promise<CmsContentEntry>;
}

export const PublishEntryUseCase = createAbstraction<IPublishEntryUseCase>("PublishEntryUseCase");

export namespace PublishEntryUseCase {
    export type Interface = IPublishEntryUseCase;
}
