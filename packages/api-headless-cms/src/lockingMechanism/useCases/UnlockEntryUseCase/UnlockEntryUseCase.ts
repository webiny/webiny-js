import WebinyError from "@webiny/error";
import {
    IUnlockEntryUseCase,
    IUnlockEntryUseCaseExecuteParams
} from "~/lockingMechanism/abstractions/IUnlockEntryUseCase";
import { IIsEntryLockedUseCase } from "~/lockingMechanism/abstractions/IsEntryLocked";
import { ICmsModelLockRecordManager } from "~/lockingMechanism/types";
import { createLockRecordDatabaseId } from "~/lockingMechanism/utils/lockRecordDatabaseId";

export interface IUnlockEntryUseCaseParams {
    isEntryLockedUseCase: IIsEntryLockedUseCase;
    getManager(): Promise<ICmsModelLockRecordManager>;
}

export class UnlockEntryUseCase implements IUnlockEntryUseCase {
    private readonly isEntryLockedUseCase: IIsEntryLockedUseCase;
    private readonly getManager: () => Promise<ICmsModelLockRecordManager>;

    public constructor(params: IUnlockEntryUseCaseParams) {
        this.isEntryLockedUseCase = params.isEntryLockedUseCase;
        this.getManager = params.getManager;
    }

    public async execute(params: IUnlockEntryUseCaseExecuteParams): Promise<void> {
        const locked = await this.isEntryLockedUseCase.execute(params);
        if (!locked) {
            return;
        }
        try {
            const manager = await this.getManager();
            await manager.delete(createLockRecordDatabaseId(params.id));
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
