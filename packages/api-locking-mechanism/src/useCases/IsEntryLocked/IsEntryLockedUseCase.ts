import {
    IIsEntryLockedUseCase,
    IIsEntryLockedUseCaseExecuteParams
} from "~/abstractions/IIsEntryLocked";
import { IGetLockRecordUseCase } from "~/abstractions/IGetLockRecordUseCase";
import { NotFoundError } from "@webiny/handler-graphql";
import { IIsLocked } from "~/utils/isLockedFactory";
import { IGetIdentity } from "~/types";

export interface IIsEntryLockedParams {
    getLockRecordUseCase: IGetLockRecordUseCase;
    isLocked: IIsLocked;
    getIdentity: IGetIdentity;
}

export class IsEntryLockedUseCase implements IIsEntryLockedUseCase {
    private readonly getLockRecordUseCase: IGetLockRecordUseCase;
    private readonly isLocked: IIsLocked;
    private readonly getIdentity: IGetIdentity;

    public constructor(params: IIsEntryLockedParams) {
        this.getLockRecordUseCase = params.getLockRecordUseCase;
        this.isLocked = params.isLocked;
        this.getIdentity = params.getIdentity;
    }

    public async execute(params: IIsEntryLockedUseCaseExecuteParams): Promise<boolean> {
        try {
            const result = await this.getLockRecordUseCase.execute(params);
            if (!result) {
                return false;
            }
            const identity = this.getIdentity();
            if (result.lockedBy.id === identity.id) {
                return false;
            }

            return this.isLocked(result);
        } catch (ex) {
            if (ex instanceof NotFoundError === false) {
                throw ex;
            }
            return false;
        }
    }
}
