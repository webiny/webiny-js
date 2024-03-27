import { IIsEntryLockedUseCase } from "~/abstractions/IsEntryLocked";
import { IGetLockRecordUseCase } from "~/abstractions/IGetLockRecordUseCase";
import { ILockingMechanismIsLockedParams, ILockingMechanismLockRecord } from "~/types";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId";
import { NotFoundError } from "@webiny/handler-graphql";

/**
 * In milliseconds.
 */
const getTimeout = () => {
    const userDefined = parseInt(process.env.WEBINY_RECORD_LOCK_TIMEOUT || "600");
    return (isNaN(userDefined) ? 600 : userDefined) * 1000;
};

export interface IIsEntryLockedParams {
    getLockRecordUseCase: IGetLockRecordUseCase;
}

export class IsEntryLockedUseCase implements IIsEntryLockedUseCase {
    private readonly getLockRecordUseCase: IGetLockRecordUseCase;

    public constructor(params: IIsEntryLockedParams) {
        this.getLockRecordUseCase = params.getLockRecordUseCase;
    }

    public async execute(params: ILockingMechanismIsLockedParams): Promise<boolean> {
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

    private isLocked(record?: ILockingMechanismLockRecord | null): boolean {
        if (!record || record.lockedOn instanceof Date === false) {
            return false;
        }
        const timeout = getTimeout();
        const now = new Date().getTime();
        const lockedOn = record.lockedOn.getTime();
        return lockedOn + timeout >= now;
    }
}
