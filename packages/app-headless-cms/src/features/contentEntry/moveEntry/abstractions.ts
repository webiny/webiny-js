import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel } from "~/types.js";

export interface IMoveEntryParams {
    model: CmsModel;
    id: string;
    folderId: string;
}

export interface IMoveEntryGateway {
    execute(params: IMoveEntryParams): Promise<boolean>;
}

export const MoveEntryGateway = createAbstraction<IMoveEntryGateway>("MoveEntryGateway");

export namespace MoveEntryGateway {
    export type Interface = IMoveEntryGateway;
}

export interface IMoveEntryRepository {
    execute(params: IMoveEntryParams): Promise<boolean>;
}

export const MoveEntryRepository = createAbstraction<IMoveEntryRepository>("MoveEntryRepository");

export namespace MoveEntryRepository {
    export type Interface = IMoveEntryRepository;
}

export interface IMoveEntryUseCase {
    execute(params: IMoveEntryParams): Promise<boolean>;
}

export const MoveEntryUseCase = createAbstraction<IMoveEntryUseCase>("MoveEntryUseCase");

export namespace MoveEntryUseCase {
    export type Interface = IMoveEntryUseCase;
}
