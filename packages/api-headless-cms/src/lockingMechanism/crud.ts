import { CmsContext } from "~/types";
import {
    ICmsModelLockRecordManager,
    IHeadlessCmsLockingMechanism,
    IHeadlessCmsLockRecordValues
} from "./types";
import { createLockingModel, RECORD_LOCKING_MODEL_ID } from "./model";
import { IGetLockRecordUseCaseExecute } from "./abstractions/IGetLockRecordUseCase";
import { IIsEntryLockedUseCaseExecute } from "./abstractions/IsEntryLocked";
import { ILockEntryUseCaseExecute } from "~/lockingMechanism/abstractions/ILockEntryUseCase";
import { IUnlockEntryUseCaseExecute } from "~/lockingMechanism/abstractions/IUnlockEntryUseCase";
import { createUseCases } from "./useCases";

interface Params {
    context: Pick<CmsContext, "plugins" | "cms" | "benchmark">;
}

export const createLockingMechanismCrud = ({ context }: Params): IHeadlessCmsLockingMechanism => {
    context.plugins.register([createLockingModel()]);

    const getManager = async (): Promise<ICmsModelLockRecordManager> => {
        return await context.cms.getEntryManager<IHeadlessCmsLockRecordValues>(
            RECORD_LOCKING_MODEL_ID
        );
    };

    const { unlockEntryUseCase, lockEntryUseCase, getLockRecordUseCase, isEntryLockedUseCase } =
        createUseCases({
            getManager
        });

    const getLockRecord: IGetLockRecordUseCaseExecute = async (id: string) => {
        return context.benchmark.measure("headlessCms.crud.locking.getLockRecord", async () => {
            return getLockRecordUseCase.execute(id);
        });
    };

    const isEntryLocked: IIsEntryLockedUseCaseExecute = async params => {
        return context.benchmark.measure("headlessCms.crud.locking.isEntryLocked", async () => {
            return isEntryLockedUseCase.execute(params);
        });
    };

    const lockEntry: ILockEntryUseCaseExecute = async params => {
        return context.benchmark.measure("headlessCms.crud.locking.lockEntry", async () => {
            return lockEntryUseCase.execute(params);
        });
    };

    const unlockEntry: IUnlockEntryUseCaseExecute = async params => {
        return context.benchmark.measure("headlessCms.crud.locking.unlockEntry", async () => {
            return unlockEntryUseCase.execute(params);
        });
    };

    return {
        isEntryLocked,
        getLockRecord,
        lockEntry,
        unlockEntry
    };
};
