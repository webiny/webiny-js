import { WebinyError } from "@webiny/error";
import { CmsContext, CmsIdentity } from "~/types";
import {
    ICmsModelLockRecordManager,
    IHeadlessCmsLockingMechanism,
    IHeadlessCmsLockRecordValues,
    OnEntryAfterLockTopicParams,
    OnEntryAfterUnlockRequestTopicParams,
    OnEntryAfterUnlockTopicParams,
    OnEntryBeforeLockTopicParams,
    OnEntryBeforeUnlockRequestTopicParams,
    OnEntryBeforeUnlockTopicParams,
    OnEntryLockErrorTopicParams,
    OnEntryUnlockErrorTopicParams,
    OnEntryUnlockRequestErrorTopicParams
} from "./types";
import { createLockingModel, RECORD_LOCKING_MODEL_ID } from "./model";
import { IGetLockRecordUseCaseExecute } from "./abstractions/IGetLockRecordUseCase";
import { IIsEntryLockedUseCaseExecute } from "./abstractions/IsEntryLocked";
import { ILockEntryUseCaseExecute } from "~/lockingMechanism/abstractions/ILockEntryUseCase";
import { IUnlockEntryUseCaseExecute } from "~/lockingMechanism/abstractions/IUnlockEntryUseCase";
import { createUseCases } from "./useCases";
import { IUnlockEntryRequestUseCaseExecute } from "./abstractions/IUnlockEntryRequestUseCase";
import { createTopic } from "@webiny/pubsub";

interface Params {
    context: Pick<CmsContext, "plugins" | "cms" | "benchmark" | "security">;
}

export const createLockingMechanismCrud = ({ context }: Params): IHeadlessCmsLockingMechanism => {
    context.plugins.register([createLockingModel()]);

    const getManager = async (): Promise<ICmsModelLockRecordManager> => {
        return await context.cms.getEntryManager<IHeadlessCmsLockRecordValues>(
            RECORD_LOCKING_MODEL_ID
        );
    };

    const getIdentity = (): CmsIdentity => {
        const identity = context.security.getIdentity();
        if (!identity) {
            throw new WebinyError("Identity missing.");
        }
        return {
            id: identity.id,
            displayName: identity.displayName,
            type: identity.type
        };
    };

    const onEntryBeforeLock = createTopic<OnEntryBeforeLockTopicParams>(
        "cms.lockingMechanism.onEntryBeforeLock"
    );
    const onEntryAfterLock = createTopic<OnEntryAfterLockTopicParams>(
        "cms.lockingMechanism.onEntryAfterLock"
    );
    const onEntryLockError = createTopic<OnEntryLockErrorTopicParams>(
        "cms.lockingMechanism.onEntryLockError"
    );
    const onEntryBeforeUnlock = createTopic<OnEntryBeforeUnlockTopicParams>(
        "cms.lockingMechanism.onEntryBeforeUnlock"
    );
    const onEntryAfterUnlock = createTopic<OnEntryAfterUnlockTopicParams>(
        "cms.lockingMechanism.onEntryAfterUnlock"
    );
    const onEntryUnlockError = createTopic<OnEntryUnlockErrorTopicParams>(
        "cms.lockingMechanism.onEntryUnlockError"
    );
    const onEntryBeforeUnlockRequest = createTopic<OnEntryBeforeUnlockRequestTopicParams>(
        "cms.lockingMechanism.onEntryBeforeUnlockRequest"
    );
    const onEntryAfterUnlockRequest = createTopic<OnEntryAfterUnlockRequestTopicParams>(
        "cms.lockingMechanism.onEntryAfterUnlockRequest"
    );
    const onEntryUnlockRequestError = createTopic<OnEntryUnlockRequestErrorTopicParams>(
        "cms.lockingMechanism.onEntryUnlockRequestError"
    );

    const {
        getLockRecordUseCase,
        isEntryLockedUseCase,
        lockEntryUseCase,
        unlockEntryUseCase,
        unlockEntryRequestUseCase
    } = createUseCases({
        getIdentity,
        getManager
    });

    const getLockRecord: IGetLockRecordUseCaseExecute = async input => {
        return context.benchmark.measure("headlessCms.crud.locking.getLockRecord", async () => {
            return getLockRecordUseCase.execute(input);
        });
    };

    const isEntryLocked: IIsEntryLockedUseCaseExecute = async params => {
        return context.benchmark.measure("headlessCms.crud.locking.isEntryLocked", async () => {
            return isEntryLockedUseCase.execute(params);
        });
    };

    const lockEntry: ILockEntryUseCaseExecute = async params => {
        return context.benchmark.measure("headlessCms.crud.locking.lockEntry", async () => {
            try {
                await onEntryBeforeLock.publish(params);
                const record = await lockEntryUseCase.execute(params);
                await onEntryAfterLock.publish({
                    ...params,
                    record
                });
                return record;
            } catch (ex) {
                await onEntryLockError.publish({
                    ...params,
                    error: ex
                });
                throw ex;
            }
        });
    };

    const unlockEntry: IUnlockEntryUseCaseExecute = async params => {
        return context.benchmark.measure("headlessCms.crud.locking.unlockEntry", async () => {
            try {
                await onEntryBeforeUnlock.publish({
                    ...params,
                    getIdentity
                });
                await unlockEntryUseCase.execute(params);
                await onEntryAfterUnlock.publish({
                    ...params,
                    getIdentity
                });
            } catch (ex) {
                await onEntryUnlockError.publish({
                    ...params,
                    getIdentity
                });
                throw ex;
            }
        });
    };

    const unlockEntryRequest: IUnlockEntryRequestUseCaseExecute = async params => {
        return context.benchmark.measure(
            "headlessCms.crud.locking.unlockEntryRequest",
            async () => {
                try {
                    await onEntryBeforeUnlockRequest.publish(params);
                    const record = await unlockEntryRequestUseCase.execute(params);
                    await onEntryAfterUnlockRequest.publish({
                        ...params,
                        record
                    });
                    return record;
                } catch (ex) {
                    await onEntryUnlockRequestError.publish({
                        ...params,
                        error: ex
                    });
                    throw ex;
                }
            }
        );
    };

    return {
        /**
         * Lifecycle events
         */
        onEntryBeforeLock,
        onEntryAfterLock,
        onEntryLockError,
        onEntryBeforeUnlock,
        onEntryAfterUnlock,
        onEntryUnlockError,
        onEntryBeforeUnlockRequest,
        onEntryAfterUnlockRequest,
        onEntryUnlockRequestError,
        /**
         * Methods
         */
        isEntryLocked,
        getLockRecord,
        lockEntry,
        unlockEntry,
        unlockEntryRequest
    };
};
