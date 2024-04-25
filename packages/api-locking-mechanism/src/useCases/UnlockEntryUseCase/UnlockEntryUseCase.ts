import WebinyError from "@webiny/error";
import {
    IUnlockEntryUseCase,
    IUnlockEntryUseCaseExecuteParams
} from "~/abstractions/IUnlockEntryUseCase";
import {
    CmsIdentity,
    IHasFullAccess,
    ILockingMechanismLockRecord,
    ILockingMechanismModelManager
} from "~/types";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId";
import { IGetLockRecordUseCase } from "~/abstractions/IGetLockRecordUseCase";
import { validateSameIdentity } from "~/utils/validateSameIdentity";
import { NotAuthorizedError } from "@webiny/api-security";

export interface IUnlockEntryUseCaseParams {
    readonly getLockRecordUseCase: IGetLockRecordUseCase;
    getManager(): Promise<ILockingMechanismModelManager>;
    getIdentity: () => CmsIdentity;
    hasFullAccess: IHasFullAccess;
}

export class UnlockEntryUseCase implements IUnlockEntryUseCase {
    private readonly getLockRecordUseCase: IGetLockRecordUseCase;
    private readonly getManager: () => Promise<ILockingMechanismModelManager>;
    private readonly getIdentity: () => CmsIdentity;
    private readonly hasFullAccess: IHasFullAccess;

    public constructor(params: IUnlockEntryUseCaseParams) {
        this.getLockRecordUseCase = params.getLockRecordUseCase;
        this.getManager = params.getManager;
        this.getIdentity = params.getIdentity;
        this.hasFullAccess = params.hasFullAccess;
    }

    public async execute(
        params: IUnlockEntryUseCaseExecuteParams
    ): Promise<ILockingMechanismLockRecord> {
        const record = await this.getLockRecordUseCase.execute(params.id);
        if (!record) {
            throw new WebinyError("Lock Record not found.", "LOCK_RECORD_NOT_FOUND", {
                ...params
            });
        }

        /**
         * We need to validate that the user executing unlock is the same user that locked the entry.
         * In case it is not the same user, there is a possibility that it is a user which has full access,
         * and at that point, we allow unlocking, but we also need to message the user who locked the entry.
         *
         * TODO implement websockets
         */
        // eslint-disable-next-line
        let sendMessage = false;
        try {
            validateSameIdentity({
                getIdentity: this.getIdentity,
                target: record.lockedBy
            });
        } catch (ex) {
            if (!params.force) {
                throw ex;
            }
            const hasFullAccess = await this.hasFullAccess();
            if (ex instanceof NotAuthorizedError === false || !hasFullAccess) {
                throw ex;
            }
            // eslint-disable-next-line
            sendMessage = true;
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
