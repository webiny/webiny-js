import {
    IUpdateEntryLockUseCase,
    IUpdateEntryLockUseCaseExecuteParams
} from "~/abstractions/IUpdateEntryLockUseCase";
import { IGetIdentity, ILockingMechanismLockRecord, ILockingMechanismModelManager } from "~/types";
import { IGetLockRecordUseCase } from "~/abstractions/IGetLockRecordUseCase";
import { WebinyError } from "@webiny/error";
import { convertEntryToLockRecord } from "~/utils/convertEntryToLockRecord";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId";
import { createIdentifier } from "@webiny/utils";
import { validateSameIdentity } from "~/utils/validateSameIdentity";
import { ILockEntryUseCase } from "~/abstractions/ILockEntryUseCase";

export interface IUpdateEntryLockUseCaseParams {
    readonly getLockRecordUseCase: IGetLockRecordUseCase;
    readonly lockEntryUseCase: ILockEntryUseCase;
    getManager(): Promise<ILockingMechanismModelManager>;
    getIdentity: IGetIdentity;
}

export class UpdateEntryLockUseCase implements IUpdateEntryLockUseCase {
    private readonly getLockRecordUseCase: IGetLockRecordUseCase;
    private readonly lockEntryUseCase: ILockEntryUseCase;
    private readonly getManager: () => Promise<ILockingMechanismModelManager>;
    private readonly getIdentity: IGetIdentity;

    public constructor(params: IUpdateEntryLockUseCaseParams) {
        this.getLockRecordUseCase = params.getLockRecordUseCase;
        this.lockEntryUseCase = params.lockEntryUseCase;
        this.getManager = params.getManager;
        this.getIdentity = params.getIdentity;
    }

    public async execute(
        params: IUpdateEntryLockUseCaseExecuteParams
    ): Promise<ILockingMechanismLockRecord> {
        const record = await this.getLockRecordUseCase.execute(params);
        if (!record) {
            return this.lockEntryUseCase.execute(params);
        }

        validateSameIdentity({
            getIdentity: this.getIdentity,
            target: record.lockedBy
        });

        try {
            const manager = await this.getManager();

            const entryId = createLockRecordDatabaseId(record.id);
            const id = createIdentifier({
                id: entryId,
                version: 1
            });
            const result = await manager.update(id, {
                savedOn: new Date().toISOString()
            });
            return convertEntryToLockRecord(result);
        } catch (ex) {
            throw new WebinyError(
                `Could not update lock entry: ${ex.message}`,
                ex.code || "UPDATE_LOCK_ENTRY_ERROR",
                {
                    ...ex.data
                }
            );
        }
    }
}
