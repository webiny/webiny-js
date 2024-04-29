import { IGetLockRecordUseCase } from "~/abstractions/IGetLockRecordUseCase";
import { IGetIdentity, ILockingMechanismLockRecord } from "~/types";
import {
    IGetLockedEntryLockRecordUseCase,
    IGetLockedEntryLockRecordUseCaseExecuteParams
} from "~/abstractions/IGetLockedEntryLockRecordUseCase";
import { IIsLocked } from "~/utils/isLockedFactory";

export interface IGetLockedEntryLockRecordUseCaseParams {
    getLockRecordUseCase: IGetLockRecordUseCase;
    isLocked: IIsLocked;
    getIdentity: IGetIdentity;
}

export class GetLockedEntryLockRecordUseCase implements IGetLockedEntryLockRecordUseCase {
    private readonly getLockRecordUseCase: IGetLockRecordUseCase;
    private readonly isLocked: IIsLocked;
    private readonly getIdentity: IGetIdentity;

    public constructor(params: IGetLockedEntryLockRecordUseCaseParams) {
        this.getLockRecordUseCase = params.getLockRecordUseCase;
        this.isLocked = params.isLocked;
        this.getIdentity = params.getIdentity;
    }

    public async execute(
        params: IGetLockedEntryLockRecordUseCaseExecuteParams
    ): Promise<ILockingMechanismLockRecord | null> {
        const result = await this.getLockRecordUseCase.execute(params);
        if (!result?.lockedBy) {
            return null;
        }
        const identity = this.getIdentity();
        if (identity.id === result.lockedBy.id) {
            return null;
        }
        return this.isLocked(result) ? result : null;
    }
}
