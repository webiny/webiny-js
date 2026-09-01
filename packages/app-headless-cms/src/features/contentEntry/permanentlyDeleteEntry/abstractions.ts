import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel } from "~/types.js";

export interface IPermanentlyDeleteEntryParams {
    model: CmsModel;
    id: string;
}

export interface IPermanentlyDeleteEntryGateway {
    execute(params: IPermanentlyDeleteEntryParams): Promise<boolean>;
}

export const PermanentlyDeleteEntryGateway = createAbstraction<IPermanentlyDeleteEntryGateway>(
    "PermanentlyDeleteEntryGateway"
);

export namespace PermanentlyDeleteEntryGateway {
    export type Interface = IPermanentlyDeleteEntryGateway;
}

export interface IPermanentlyDeleteEntryRepository {
    execute(params: IPermanentlyDeleteEntryParams): Promise<boolean>;
}

export const PermanentlyDeleteEntryRepository =
    createAbstraction<IPermanentlyDeleteEntryRepository>("PermanentlyDeleteEntryRepository");

export namespace PermanentlyDeleteEntryRepository {
    export type Interface = IPermanentlyDeleteEntryRepository;
}

export interface IPermanentlyDeleteEntryUseCase {
    execute(params: IPermanentlyDeleteEntryParams): Promise<boolean>;
}

export const PermanentlyDeleteEntryUseCase = createAbstraction<IPermanentlyDeleteEntryUseCase>(
    "PermanentlyDeleteEntryUseCase"
);

export namespace PermanentlyDeleteEntryUseCase {
    export type Interface = IPermanentlyDeleteEntryUseCase;
}
