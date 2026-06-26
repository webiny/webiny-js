import { createAbstraction } from "@webiny/feature/admin";
import type { CmsContentEntry, CmsModel } from "~/types.js";

export interface ICreateRevisionFromParams {
    model: CmsModel;
    revisionId: string;
    data?: Record<string, unknown>;
    options?: { skipValidation?: boolean };
}

export interface ICreateRevisionFromGateway {
    execute(params: ICreateRevisionFromParams): Promise<CmsContentEntry>;
}

export const CreateRevisionFromGateway = createAbstraction<ICreateRevisionFromGateway>(
    "CreateRevisionFromGateway"
);

export namespace CreateRevisionFromGateway {
    export type Interface = ICreateRevisionFromGateway;
}

export interface ICreateRevisionFromRepository {
    execute(params: ICreateRevisionFromParams): Promise<CmsContentEntry>;
}

export const CreateRevisionFromRepository = createAbstraction<ICreateRevisionFromRepository>(
    "CreateRevisionFromRepository"
);

export namespace CreateRevisionFromRepository {
    export type Interface = ICreateRevisionFromRepository;
}

export interface ICreateRevisionFromUseCase {
    execute(params: ICreateRevisionFromParams): Promise<CmsContentEntry>;
}

export const CreateRevisionFromUseCase = createAbstraction<ICreateRevisionFromUseCase>(
    "CreateRevisionFromUseCase"
);

export namespace CreateRevisionFromUseCase {
    export type Interface = ICreateRevisionFromUseCase;
}
