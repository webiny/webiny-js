import { createAbstraction } from "@webiny/feature/admin";
import type { IRecordLockingLockRecord } from "~/types.js";

export interface IListLockRecordsParams {
    where?: {
        id_in?: string[];
        type?: string;
    };
    limit?: number;
}

export interface IListLockRecordsGateway {
    execute(params: IListLockRecordsParams): Promise<IRecordLockingLockRecord[]>;
}

export const ListLockRecordsGateway =
    createAbstraction<IListLockRecordsGateway>("ListLockRecordsGateway");

export namespace ListLockRecordsGateway {
    export type Interface = IListLockRecordsGateway;
}

export interface IListLockRecordsUseCase {
    execute(params: IListLockRecordsParams): Promise<IRecordLockingLockRecord[]>;
}

export const ListLockRecordsUseCase =
    createAbstraction<IListLockRecordsUseCase>("ListLockRecordsUseCase");

export namespace ListLockRecordsUseCase {
    export type Interface = IListLockRecordsUseCase;
}
