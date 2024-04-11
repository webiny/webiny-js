import {
    IIsEntryLockedUseCase,
    IIsEntryLockedUseCaseExecuteParams
} from "~/abstractions/IsEntryLocked";
import { IGetLockRecordUseCase } from "~/abstractions/IGetLockRecordUseCase";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId";
import { NotFoundError } from "@webiny/handler-graphql";
import { IIsLocked } from "~/utils/isLockedFactory";
import { CmsIdentity } from "@webiny/api-headless-cms/types";

export interface IIsEntryLockedParams {
    getLockRecordUseCase: IGetLockRecordUseCase;
    isLocked: IIsLocked;
    getIdentity(): CmsIdentity;
}

export class IsEntryLockedUseCase implements IIsEntryLockedUseCase {
    private readonly getLockRecordUseCase: IGetLockRecordUseCase;
    private readonly isLocked: IIsLocked;
    public readonly getIdentity: () => CmsIdentity;

    public constructor(params: IIsEntryLockedParams) {
        this.getLockRecordUseCase = params.getLockRecordUseCase;
        this.isLocked = params.isLocked;
        this.getIdentity = params.getIdentity;
    }

    public async execute(params: IIsEntryLockedUseCaseExecuteParams): Promise<boolean> {
        const id = createLockRecordDatabaseId(params.id);
        try {
            const result = await this.getLockRecordUseCase.execute(id);
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
