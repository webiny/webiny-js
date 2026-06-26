import { createAbstraction } from "@webiny/feature/admin";
import type { CmsContentEntryRevision, CmsModel } from "~/types.js";

export interface IDeleteEntryRevisionParams {
    model: CmsModel;
    revisionId: string;
}

export interface IDeleteEntryRevisionResult {
    newLatestRevision: CmsContentEntryRevision | null;
}

export interface IDeleteEntryRevisionGateway {
    execute(params: IDeleteEntryRevisionParams): Promise<boolean>;
}

export const DeleteEntryRevisionGateway = createAbstraction<IDeleteEntryRevisionGateway>(
    "DeleteEntryRevisionGateway"
);

export namespace DeleteEntryRevisionGateway {
    export type Interface = IDeleteEntryRevisionGateway;
}

export interface IDeleteEntryRevisionRepository {
    execute(params: IDeleteEntryRevisionParams): Promise<boolean>;
}

export const DeleteEntryRevisionRepository = createAbstraction<IDeleteEntryRevisionRepository>(
    "DeleteEntryRevisionRepository"
);

export namespace DeleteEntryRevisionRepository {
    export type Interface = IDeleteEntryRevisionRepository;
}

export interface IDeleteEntryRevisionUseCase {
    execute(params: IDeleteEntryRevisionParams): Promise<boolean>;
}

export const DeleteEntryRevisionUseCase = createAbstraction<IDeleteEntryRevisionUseCase>(
    "DeleteEntryRevisionUseCase"
);

export namespace DeleteEntryRevisionUseCase {
    export type Interface = IDeleteEntryRevisionUseCase;
}
