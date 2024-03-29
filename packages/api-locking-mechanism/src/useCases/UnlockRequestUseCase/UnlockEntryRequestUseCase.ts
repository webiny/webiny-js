import WebinyError from "@webiny/error";
import {
    IUnlockEntryRequestUseCase,
    IUnlockEntryRequestUseCaseExecuteParams
} from "~/abstractions/IUnlockEntryRequestUseCase";
import {
    ILockingMechanismModelManager,
    ILockingMechanismLockRecord,
    ILockingMechanismLockRecordActionType
} from "~/types";
import { IGetLockRecordUseCase } from "~/abstractions/IGetLockRecordUseCase";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId";
import { CmsIdentity } from "~/types";
import { createIdentifier } from "@webiny/utils";
import { convertEntryToLockRecord } from "~/utils/convertEntryToLockRecord";

export interface IUnlockEntryRequestUseCaseParams {
    getLockRecordUseCase: IGetLockRecordUseCase;
    getManager: () => Promise<ILockingMechanismModelManager>;
    getIdentity: () => CmsIdentity;
}

export class UnlockEntryRequestUseCase implements IUnlockEntryRequestUseCase {
    private readonly getLockRecordUseCase: IGetLockRecordUseCase;
    private readonly getManager: () => Promise<ILockingMechanismModelManager>;
    private readonly getIdentity: () => CmsIdentity;

    public constructor(params: IUnlockEntryRequestUseCaseParams) {
        this.getLockRecordUseCase = params.getLockRecordUseCase;
        this.getManager = params.getManager;
        this.getIdentity = params.getIdentity;
    }

    public async execute(
        params: IUnlockEntryRequestUseCaseExecuteParams
    ): Promise<ILockingMechanismLockRecord> {
        const id = createLockRecordDatabaseId(params.id);
        const record = await this.getLockRecordUseCase.execute(id);
        if (!record) {
            throw new WebinyError("Entry is not locked.", "ENTRY_NOT_LOCKED", {
                ...params
            });
        }
        const unlockRequested = record.getUnlockRequested();
        if (unlockRequested) {
            const currentIdentity = this.getIdentity();
            /**
             * If a current identity did not request unlock, we will not allow that user to continue.
             */
            if (unlockRequested.createdBy.id !== currentIdentity.id) {
                throw new WebinyError(
                    "Unlock request already sent.",
                    "UNLOCK_REQUEST_ALREADY_SENT",
                    {
                        ...params,
                        identity: unlockRequested.createdBy
                    }
                );
            }
            const approved = record.getUnlockApproved();
            const denied = record.getUnlockDenied();
            if (approved || denied) {
                return record;
            }
            throw new WebinyError("Unlock request already sent.", "UNLOCK_REQUEST_ALREADY_SENT", {
                ...params,
                identity: unlockRequested.createdBy
            });
        }

        record.addAction({
            type: ILockingMechanismLockRecordActionType.requested,
            createdOn: new Date(),
            createdBy: this.getIdentity()
        });

        try {
            const manager = await this.getManager();

            const entryId = createLockRecordDatabaseId(record.id);
            const id = createIdentifier({
                id: entryId,
                version: 1
            });
            const result = await manager.update(id, record.toObject());
            return convertEntryToLockRecord(result);
        } catch (ex) {
            throw new WebinyError(
                "Could not update record with a unlock request.",
                "UNLOCK_REQUEST_ERROR",
                {
                    ...ex.data,
                    error: {
                        message: ex.message,
                        code: ex.code
                    },
                    id: params.id,
                    type: params.type,
                    recordId: record.id
                }
            );
        }
    }
}
