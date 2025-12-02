import WebinyError from "@webiny/error";
import type {
    IUnlockEntryRequestUseCase,
    IUnlockEntryRequestUseCaseExecuteParams
} from "~/abstractions/IUnlockEntryRequestUseCase.js";
import type {
    IGetIdentity,
    IRecordLockingLockRecord,
    IRecordLockingModelManager
} from "~/types.js";
import { RecordLockingLockRecordActionType } from "~/types.js";
import type { IGetLockRecordUseCase } from "~/abstractions/IGetLockRecordUseCase.js";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId.js";
import { createIdentifier } from "@webiny/utils";
import type { ConvertEntryToLockRecordCb } from "~/useCases/types.js";
import type { Security } from "@webiny/api-core/types/security.js";

export interface IUnlockEntryRequestUseCaseParams {
    getLockRecordUseCase: IGetLockRecordUseCase;
    getManager(): Promise<IRecordLockingModelManager>;
    getSecurity(): Pick<Security, "withoutAuthorization">;
    getIdentity: IGetIdentity;
    convert: ConvertEntryToLockRecordCb;
}

export class UnlockEntryRequestUseCase implements IUnlockEntryRequestUseCase {
    private readonly getLockRecordUseCase: IGetLockRecordUseCase;
    private readonly getManager: IUnlockEntryRequestUseCaseParams["getManager"];
    private readonly getSecurity: IUnlockEntryRequestUseCaseParams["getSecurity"];
    private readonly getIdentity: IGetIdentity;
    private readonly convert: ConvertEntryToLockRecordCb;

    public constructor(params: IUnlockEntryRequestUseCaseParams) {
        this.getLockRecordUseCase = params.getLockRecordUseCase;
        this.getManager = params.getManager;
        this.getSecurity = params.getSecurity;
        this.getIdentity = params.getIdentity;
        this.convert = params.convert;
    }

    public async execute(
        params: IUnlockEntryRequestUseCaseExecuteParams
    ): Promise<IRecordLockingLockRecord> {
        const record = await this.getLockRecordUseCase.execute(params);
        if (!record || record.isExpired()) {
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
            type: RecordLockingLockRecordActionType.requested,
            createdOn: new Date(),
            createdBy: this.getIdentity()
        });

        const security = this.getSecurity();

        try {
            const manager = await this.getManager();

            const entryId = createLockRecordDatabaseId(record.id);
            const id = createIdentifier({
                id: entryId,
                version: 1
            });
            return await security.withoutAuthorization(async () => {
                const result = await manager.update(id, record.toObject());
                return this.convert(result);
            });
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
