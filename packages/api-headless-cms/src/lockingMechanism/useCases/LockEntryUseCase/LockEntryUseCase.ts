import WebinyError from "@webiny/error";
import {
    ILockEntryUseCase,
    ILockEntryUseCaseExecuteParams
} from "~/lockingMechanism/abstractions/ILockEntryUseCase";
import { ICmsModelLockRecordManager, IHeadlessCmsLockRecord } from "~/lockingMechanism/types";
import { IIsEntryLockedUseCase } from "~/lockingMechanism/abstractions/IsEntryLocked";
import { convertEntryToLockRecord } from "~/lockingMechanism/utils/convertEntryToLockRecord";

export interface ILockEntryUseCaseParams {
    isEntryLockedUseCase: IIsEntryLockedUseCase;
    getManager(): Promise<ICmsModelLockRecordManager>;
}

export class LockEntryUseCase implements ILockEntryUseCase {
    private readonly isEntryLockedUseCase: IIsEntryLockedUseCase;
    private readonly getManager: () => Promise<ICmsModelLockRecordManager>;

    public constructor(params: ILockEntryUseCaseParams) {
        this.isEntryLockedUseCase = params.isEntryLockedUseCase;
        this.getManager = params.getManager;
    }

    public async execute(params: ILockEntryUseCaseExecuteParams): Promise<IHeadlessCmsLockRecord> {
        const locked = await this.isEntryLockedUseCase.execute(params);
        if (locked) {
            throw new WebinyError("Entry is already locked for editing.", "ENTRY_ALREADY_LOCKED", {
                ...params
            });
        }
        try {
            const manager = await this.getManager();

            const entry = await manager.create({
                recordModelId: params.id,
                type: params.type
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
