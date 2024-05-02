import WebinyError from "@webiny/error";
import {
    ILockEntryUseCase,
    ILockEntryUseCaseExecuteParams
} from "~/abstractions/ILockEntryUseCase";
import {
    IRecordLockingLockRecord,
    IRecordLockingLockRecordValues,
    IRecordLockingModelManager
} from "~/types";
import { IIsEntryLockedUseCase } from "~/abstractions/IIsEntryLocked";
import { convertEntryToLockRecord } from "~/utils/convertEntryToLockRecord";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId";
import { NotFoundError } from "@webiny/handler-graphql";

export interface ILockEntryUseCaseParams {
    isEntryLockedUseCase: IIsEntryLockedUseCase;
    getManager(): Promise<IRecordLockingModelManager>;
}

export class LockEntryUseCase implements ILockEntryUseCase {
    private readonly isEntryLockedUseCase: IIsEntryLockedUseCase;
    private readonly getManager: () => Promise<IRecordLockingModelManager>;

    public constructor(params: ILockEntryUseCaseParams) {
        this.isEntryLockedUseCase = params.isEntryLockedUseCase;
        this.getManager = params.getManager;
    }

    public async execute(
        params: ILockEntryUseCaseExecuteParams
    ): Promise<IRecordLockingLockRecord> {
        let locked = false;
        try {
            locked = await this.isEntryLockedUseCase.execute(params);
        } catch (ex) {
            if (ex instanceof NotFoundError === false) {
                throw ex;
            }
            locked = false;
        }
        if (locked) {
            throw new WebinyError("Entry is already locked for editing.", "ENTRY_ALREADY_LOCKED", {
                ...params
            });
        }
        try {
            const manager = await this.getManager();

            const id = createLockRecordDatabaseId(params.id);
            const entry = await manager.create<IRecordLockingLockRecordValues>({
                id,
                targetId: params.id,
                type: params.type,
                actions: []
            });
            return convertEntryToLockRecord(entry);
        } catch (ex) {
            throw new WebinyError(
                `Could not lock entry: ${ex.message}`,
                ex.code || "LOCK_ENTRY_ERROR",
                {
                    ...ex.data
                }
            );
        }
    }
}
