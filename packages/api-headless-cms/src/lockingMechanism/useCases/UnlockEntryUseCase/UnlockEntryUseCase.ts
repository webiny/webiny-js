import WebinyError from "@webiny/error";
import {
    IUnlockEntryUseCase,
    IUnlockEntryUseCaseExecuteParams
} from "~/lockingMechanism/abstractions/IUnlockEntryUseCase";
import { ICmsModelLockRecordManager } from "~/lockingMechanism/types";
import { createLockRecordDatabaseId } from "~/lockingMechanism/utils/lockRecordDatabaseId";
import { IGetLockRecordUseCase } from "~/lockingMechanism/abstractions/IGetLockRecordUseCase";

export interface IUnlockEntryUseCaseParams {
    readonly getLockRecordUseCase: IGetLockRecordUseCase;
    getManager(): Promise<ICmsModelLockRecordManager>;
}

export class UnlockEntryUseCase implements IUnlockEntryUseCase {
    private readonly getLockRecordUseCase: IGetLockRecordUseCase;
    private readonly getManager: () => Promise<ICmsModelLockRecordManager>;

    public constructor(params: IUnlockEntryUseCaseParams) {
        this.getLockRecordUseCase = params.getLockRecordUseCase;
        this.getManager = params.getManager;
    }

    public async execute(params: IUnlockEntryUseCaseExecuteParams): Promise<void> {
        const record = await this.getLockRecordUseCase.execute(params.id);
        if (!record) {
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
