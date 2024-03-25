import WebinyError from "@webiny/error";
import {
    IUnlockEntryRequestUseCase,
    IUnlockEntryRequestUseCaseExecuteParams
} from "~/lockingMechanism/abstractions/IUnlockEntryRequestUseCase";
import {
    ICmsModelLockRecordManager,
    IHeadlessCmsLockRecord,
    IHeadlessCmsLockRecordActionType
} from "~/lockingMechanism/types";
import { IGetLockRecordUseCase } from "~/lockingMechanism/abstractions/IGetLockRecordUseCase";
import { createLockRecordDatabaseId } from "~/lockingMechanism/utils/lockRecordDatabaseId";
import { CmsIdentity } from "~/types";

export interface IUnlockEntryRequestUseCaseParams {
    getLockRecordUseCase: IGetLockRecordUseCase;
    getManager: () => Promise<ICmsModelLockRecordManager>;
    getIdentity: () => CmsIdentity;
}

export class UnlockEntryRequestUseCase implements IUnlockEntryRequestUseCase {
    private readonly getLockRecordUseCase: IGetLockRecordUseCase;
    private readonly getManager: () => Promise<ICmsModelLockRecordManager>;
    private readonly getIdentity: () => CmsIdentity;

    public constructor(params: IUnlockEntryRequestUseCaseParams) {
        this.getLockRecordUseCase = params.getLockRecordUseCase;
        this.getManager = params.getManager;
        this.getIdentity = params.getIdentity;
    }

    public async execute(
        params: IUnlockEntryRequestUseCaseExecuteParams
    ): Promise<IHeadlessCmsLockRecord> {
        const id = createLockRecordDatabaseId(params.id);
        const record = await this.getLockRecordUseCase.execute(id);
        if (!record) {
            throw new WebinyError("Entry is not locked.", "ENTRY_NOT_LOCKED", {
                ...params
            });
        } else if (record.getUnlockRequested()) {
            const approved = record.getUnlockApproved();
            const denied = record.getUnlockDenied();
            if (approved || denied) {
                return record;
            }
            throw new WebinyError("Unlock request already sent.", "UNLOCK_REQUEST_ALREADY_SENT", {
                ...params
            });
        }

        record.addAction({
            type: IHeadlessCmsLockRecordActionType.request,
            createdOn: new Date(),
            createdBy: this.getIdentity()
        });

        return record;
    }
}
