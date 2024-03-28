import WebinyError from "@webiny/error";
import {
    IUnlockEntryUseCase,
    IUnlockEntryUseCaseExecuteParams
} from "~/abstractions/IUnlockEntryUseCase";
import { ILockingMechanismLockRecord, ILockingMechanismModelManager } from "~/types";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId";
import { IGetLockRecordUseCase } from "~/abstractions/IGetLockRecordUseCase";

export interface IUnlockEntryUseCaseParams {
    readonly getLockRecordUseCase: IGetLockRecordUseCase;
    getManager(): Promise<ILockingMechanismModelManager>;
}

export class UnlockEntryUseCase implements IUnlockEntryUseCase {
    private readonly getLockRecordUseCase: IGetLockRecordUseCase;
    private readonly getManager: () => Promise<ILockingMechanismModelManager>;

    public constructor(params: IUnlockEntryUseCaseParams) {
        this.getLockRecordUseCase = params.getLockRecordUseCase;
        this.getManager = params.getManager;
    }

    public async execute(
        params: IUnlockEntryUseCaseExecuteParams
    ): Promise<ILockingMechanismLockRecord> {
        const record = await this.getLockRecordUseCase.execute(params);
        if (!record) {
            throw new WebinyError("Lock Record not found.", "LOCK_RECORD_NOT_FOUND", {
                ...params
            });
        }
        try {
            const manager = await this.getManager();
            await manager.delete(createLockRecordDatabaseId(params.id));
            return record;
        } catch (ex) {
            throw new WebinyError(
                `Could not unlock entry: ${ex.message}`,
                ex.code || "UNLOCK_ENTRY_ERROR",
                {
                    ...ex.data
                }
            );
        }
    }
}
