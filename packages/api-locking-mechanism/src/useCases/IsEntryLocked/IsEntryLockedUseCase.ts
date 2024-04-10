import {
    IIsEntryLockedUseCase,
    IIsEntryLockedUseCaseExecuteParams
} from "~/abstractions/IsEntryLocked";
import { IGetLockRecordUseCase } from "~/abstractions/IGetLockRecordUseCase";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId";
import { NotFoundError } from "@webiny/handler-graphql";
import { IIsLocked } from "~/utils/isLockedFactory";

export interface IIsEntryLockedParams {
    getLockRecordUseCase: IGetLockRecordUseCase;
    isLocked: IIsLocked;
}

export class IsEntryLockedUseCase implements IIsEntryLockedUseCase {
    private readonly getLockRecordUseCase: IGetLockRecordUseCase;
    private readonly isLocked: IIsLocked;

    public constructor(params: IIsEntryLockedParams) {
        this.getLockRecordUseCase = params.getLockRecordUseCase;
        this.isLocked = params.isLocked;
    }

    public async execute(params: IIsEntryLockedUseCaseExecuteParams): Promise<boolean> {
        const id = createLockRecordDatabaseId(params.id);
        try {
            const result = await this.getLockRecordUseCase.execute(id);

            return this.isLocked(result);
        } catch (ex) {
            if (ex instanceof NotFoundError === false) {
                throw ex;
            }
            return false;
        }
    }
}
