import type {
    IUpdateEntryLockUseCase,
    IUpdateEntryLockUseCaseExecuteParams
} from "~/abstractions/IUpdateEntryLockUseCase.js";
import type {
    IGetIdentity,
    IRecordLockingLockRecord,
    IRecordLockingModelManager
} from "~/types.js";
import type { IGetLockRecordUseCase } from "~/abstractions/IGetLockRecordUseCase.js";
import { WebinyError } from "@webiny/error";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId.js";
import { createIdentifier } from "@webiny/utils";
import { validateSameIdentity } from "~/utils/validateSameIdentity.js";
import type { ILockEntryUseCase } from "~/abstractions/ILockEntryUseCase.js";
import type { ConvertEntryToLockRecordCb } from "~/useCases/types.js";
import type { Security } from "@webiny/api-core/types/security.js";

export interface IUpdateEntryLockUseCaseParams {
    readonly getLockRecordUseCase: IGetLockRecordUseCase;
    readonly lockEntryUseCase: ILockEntryUseCase;
    getManager(): Promise<IRecordLockingModelManager>;
    getSecurity(): Pick<Security, "withoutAuthorization">;
    getIdentity: IGetIdentity;
    convert: ConvertEntryToLockRecordCb;
}

export class UpdateEntryLockUseCase implements IUpdateEntryLockUseCase {
    private readonly getLockRecordUseCase: IGetLockRecordUseCase;
    private readonly lockEntryUseCase: ILockEntryUseCase;
    private readonly getManager: IUpdateEntryLockUseCaseParams["getManager"];
    private readonly getSecurity: IUpdateEntryLockUseCaseParams["getSecurity"];
    private readonly getIdentity: IGetIdentity;
    private readonly convert: ConvertEntryToLockRecordCb;

    public constructor(params: IUpdateEntryLockUseCaseParams) {
        this.getLockRecordUseCase = params.getLockRecordUseCase;
        this.lockEntryUseCase = params.lockEntryUseCase;
        this.getManager = params.getManager;
        this.getSecurity = params.getSecurity;
        this.getIdentity = params.getIdentity;
        this.convert = params.convert;
    }

    public async execute(
        params: IUpdateEntryLockUseCaseExecuteParams
    ): Promise<IRecordLockingLockRecord> {
        /**
         * There is a possibility that the lock record already exists, just that the entry is not actually locked - lock expired.
         */
        const record = await this.getLockRecordUseCase.execute(params);
        /**
         * If it exists, we will update the record with new user and dates.
         * But if it does not exist, we will create a new record.
         */
        if (!record) {
            return this.lockEntryUseCase.execute(params);
        } else if (record.isExpired()) {
            return this.updateOverExistingLockRecord(record);
        }
        /**
         * If the record exists and is not expired, we need to check if the user is the same as the one who locked it.
         */
        validateSameIdentity({
            getIdentity: this.getIdentity,
            target: record.lockedBy
        });
        return this.updateExistingLockRecord(record);
    }

    private async updateOverExistingLockRecord(
        record: Pick<IRecordLockingLockRecord, "id">
    ): Promise<IRecordLockingLockRecord> {
        try {
            const manager = await this.getManager();
            const security = this.getSecurity();
            const identity = this.getIdentity();

            const entryId = createLockRecordDatabaseId(record.id);
            const id = createIdentifier({
                id: entryId,
                version: 1
            });
            return await security.withoutAuthorization(async () => {
                const date = new Date().toISOString();
                const result = await manager.update(id, {
                    savedOn: date,
                    createdOn: date,
                    savedBy: identity,
                    createdBy: identity
                });
                return this.convert(result);
            });
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

    private async updateExistingLockRecord(
        record: Pick<IRecordLockingLockRecord, "id">
    ): Promise<IRecordLockingLockRecord> {
        try {
            const manager = await this.getManager();
            const security = this.getSecurity();

            const entryId = createLockRecordDatabaseId(record.id);
            const id = createIdentifier({
                id: entryId,
                version: 1
            });
            return await security.withoutAuthorization(async () => {
                const result = await manager.update(id, {
                    savedOn: new Date().toISOString()
                });
                return this.convert(result);
            });
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
