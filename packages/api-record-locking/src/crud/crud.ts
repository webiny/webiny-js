import { WebinyError } from "@webiny/error";
import {
    Context,
    IGetIdentity,
    IGetWebsocketsContextCallable,
    IHasFullAccessCallable,
    IRecordLocking,
    IRecordLockingLockRecordValues,
    IRecordLockingModelManager,
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
import { IIsEntryLockedUseCaseExecute } from "~/abstractions/IIsEntryLocked";
import { ILockEntryUseCaseExecute } from "~/abstractions/ILockEntryUseCase";
import { IUnlockEntryUseCaseExecute } from "~/abstractions/IUnlockEntryUseCase";
import { createUseCases } from "~/useCases";
import { IUnlockEntryRequestUseCaseExecute } from "~/abstractions/IUnlockEntryRequestUseCase";
import { createTopic } from "@webiny/pubsub";
import { IListAllLockRecordsUseCaseExecute } from "~/abstractions/IListAllLockRecordsUseCase";
import { IListLockRecordsUseCaseExecute } from "~/abstractions/IListLockRecordsUseCase";
import { IUpdateEntryLockUseCaseExecute } from "~/abstractions/IUpdateEntryLockUseCase";
import { IGetLockedEntryLockRecordUseCaseExecute } from "~/abstractions/IGetLockedEntryLockRecordUseCase";

interface Params {
    context: Pick<Context, "plugins" | "cms" | "benchmark" | "security" | "websockets">;
}

export const createRecordLockingCrud = async ({ context }: Params): Promise<IRecordLocking> => {
    const getModel = async () => {
        const model = await context.cms.getModel(RECORD_LOCKING_MODEL_ID);
        if (model) {
            return model;
        }
        throw new WebinyError("Record Locking model not found.", "MODEL_NOT_FOUND", {
            modelId: RECORD_LOCKING_MODEL_ID
        });
    };

    const getManager = async (): Promise<IRecordLockingModelManager> => {
        return await context.cms.getEntryManager<IRecordLockingLockRecordValues>(
            RECORD_LOCKING_MODEL_ID
        );
    };

    const getIdentity: IGetIdentity = () => {
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

    const hasFullAccess: IHasFullAccessCallable = async () => {
        return await context.security.hasFullAccess();
    };

    const onEntryBeforeLock = createTopic<OnEntryBeforeLockTopicParams>(
        "cms.recordLocking.onEntryBeforeLock"
    );
    const onEntryAfterLock = createTopic<OnEntryAfterLockTopicParams>(
        "cms.recordLocking.onEntryAfterLock"
    );
    const onEntryLockError = createTopic<OnEntryLockErrorTopicParams>(
        "cms.recordLocking.onEntryLockError"
    );

    const onEntryBeforeUnlock = createTopic<OnEntryBeforeUnlockTopicParams>(
        "cms.recordLocking.onEntryBeforeUnlock"
    );
    const onEntryAfterUnlock = createTopic<OnEntryAfterUnlockTopicParams>(
        "cms.recordLocking.onEntryAfterUnlock"
    );
    const onEntryUnlockError = createTopic<OnEntryUnlockErrorTopicParams>(
        "cms.recordLocking.onEntryUnlockError"
    );

    const onEntryBeforeUnlockRequest = createTopic<OnEntryBeforeUnlockRequestTopicParams>(
        "cms.recordLocking.onEntryBeforeUnlockRequest"
    );
    const onEntryAfterUnlockRequest = createTopic<OnEntryAfterUnlockRequestTopicParams>(
        "cms.recordLocking.onEntryAfterUnlockRequest"
    );
    const onEntryUnlockRequestError = createTopic<OnEntryUnlockRequestErrorTopicParams>(
        "cms.recordLocking.onEntryUnlockRequestError"
    );

    const getWebsockets: IGetWebsocketsContextCallable = () => {
        return context.websockets;
    };

    const {
        listLockRecordsUseCase,
        listAllLockRecordsUseCase,
        getLockRecordUseCase,
        isEntryLockedUseCase,
        getLockedEntryLockRecordUseCase,
        lockEntryUseCase,
        updateEntryLockUseCase,
        unlockEntryUseCase,
        unlockEntryRequestUseCase
    } = createUseCases({
        getIdentity,
        getManager,
        hasFullAccess,
        getWebsockets
    });

    const listAllLockRecords: IListAllLockRecordsUseCaseExecute = async params => {
        return context.benchmark.measure("recordLocking.listAllLockRecords", async () => {
            return listAllLockRecordsUseCase.execute(params);
        });
    };

    const listLockRecords: IListLockRecordsUseCaseExecute = async params => {
        return context.benchmark.measure("recordLocking.listLockRecords", async () => {
            return listLockRecordsUseCase.execute(params);
        });
    };

    const getLockRecord: IGetLockRecordUseCaseExecute = async params => {
        return context.benchmark.measure("recordLocking.getLockRecord", async () => {
            return getLockRecordUseCase.execute(params);
        });
    };

    const isEntryLocked: IIsEntryLockedUseCaseExecute = async params => {
        return context.benchmark.measure("recordLocking.isEntryLocked", async () => {
            return isEntryLockedUseCase.execute(params);
        });
    };

    const getLockedEntryLockRecord: IGetLockedEntryLockRecordUseCaseExecute = async params => {
        return context.benchmark.measure("recordLocking.getLockedEntryLockRecord", async () => {
            return getLockedEntryLockRecordUseCase.execute(params);
        });
    };

    const lockEntry: ILockEntryUseCaseExecute = async params => {
        return context.benchmark.measure("recordLocking.lockEntry", async () => {
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

    const updateEntryLock: IUpdateEntryLockUseCaseExecute = async params => {
        return context.benchmark.measure("recordLocking.updateEntryLock", async () => {
            return updateEntryLockUseCase.execute(params);
        });
    };

    const unlockEntry: IUnlockEntryUseCaseExecute = async params => {
        return context.benchmark.measure("recordLocking.unlockEntry", async () => {
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
        return context.benchmark.measure("recordLocking.unlockEntryRequest", async () => {
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
        listAllLockRecords,
        getLockRecord,
        isEntryLocked,
        getLockedEntryLockRecord,
        lockEntry,
        updateEntryLock,
        unlockEntry,
        unlockEntryRequest
    };
};
