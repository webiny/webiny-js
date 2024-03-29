import { WebinyError } from "@webiny/error";
import { Context, CmsIdentity } from "~/types";
import {
    ILockingMechanismModelManager,
    ILockingMechanism,
    ILockingMechanismLockRecordValues,
    OnEntryAfterLockTopicParams,
    OnEntryAfterUnlockRequestTopicParams,
    OnEntryAfterUnlockTopicParams,
    OnEntryBeforeLockTopicParams,
    OnEntryBeforeUnlockRequestTopicParams,
    OnEntryBeforeUnlockTopicParams,
    OnEntryLockErrorTopicParams,
    OnEntryUnlockErrorTopicParams,
    OnEntryUnlockRequestErrorTopicParams
} from "~/types";
import { RECORD_LOCKING_MODEL_ID } from "./model";
import { IGetLockRecordUseCaseExecute } from "~/abstractions/IGetLockRecordUseCase";
import { IIsEntryLockedUseCaseExecute } from "~/abstractions/IsEntryLocked";
import { ILockEntryUseCaseExecute } from "~/abstractions/ILockEntryUseCase";
import { IUnlockEntryUseCaseExecute } from "~/abstractions/IUnlockEntryUseCase";
import { createUseCases } from "~/useCases";
import { IUnlockEntryRequestUseCaseExecute } from "~/abstractions/IUnlockEntryRequestUseCase";
import { createTopic } from "@webiny/pubsub";
import { IListLockRecordsUseCaseExecute } from "~/abstractions/IListLockRecordsUseCase";

interface Params {
    context: Pick<Context, "plugins" | "cms" | "benchmark" | "security">;
}

export const createLockingMechanismCrud = async ({
    context
}: Params): Promise<ILockingMechanism> => {
    const getModel = async () => {
        const model = await context.cms.getModel(RECORD_LOCKING_MODEL_ID);
        if (model) {
            return model;
        }
        throw new WebinyError("Locking Mechanism model not found", "MODEL_NOT_FOUND", {
            modelId: RECORD_LOCKING_MODEL_ID
        });
    };

    const getManager = async (): Promise<ILockingMechanismModelManager> => {
        return await context.cms.getEntryManager<ILockingMechanismLockRecordValues>(
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
        listLockRecordsUseCase,
        getLockRecordUseCase,
        isEntryLockedUseCase,
        lockEntryUseCase,
        unlockEntryUseCase,
        unlockEntryRequestUseCase
    } = createUseCases({
        getIdentity,
        getManager
    });

    const listLockRecords: IListLockRecordsUseCaseExecute = async params => {
        return context.benchmark.measure("lockingMechanism.listLockRecords", async () => {
            return listLockRecordsUseCase.execute(params);
        });
    };

    const getLockRecord: IGetLockRecordUseCaseExecute = async id => {
        return context.benchmark.measure("lockingMechanism.getLockRecord", async () => {
            return getLockRecordUseCase.execute(id);
        });
    };

    const isEntryLocked: IIsEntryLockedUseCaseExecute = async params => {
        return context.benchmark.measure("lockingMechanism.isEntryLocked", async () => {
            return isEntryLockedUseCase.execute(params);
        });
    };

    const lockEntry: ILockEntryUseCaseExecute = async params => {
        return context.benchmark.measure("lockingMechanism.lockEntry", async () => {
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
        return context.benchmark.measure("lockingMechanism.unlockEntry", async () => {
            try {
                await onEntryBeforeUnlock.publish({
                    ...params,
                    getIdentity
                });
                const record = await unlockEntryUseCase.execute(params);
                await onEntryAfterUnlock.publish({
                    ...params,
                    record
                });
                return record;
            } catch (ex) {
                await onEntryUnlockError.publish({
                    ...params,
                    error: ex
                });
                throw ex;
            }
        });
    };

    const unlockEntryRequest: IUnlockEntryRequestUseCaseExecute = async params => {
        return context.benchmark.measure("lockingMechanism.unlockEntryRequest", async () => {
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
        });
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
        getModel,
        listLockRecords,
        getLockRecord,
        isEntryLocked,
        lockEntry,
        unlockEntry,
        unlockEntryRequest
    };
};
