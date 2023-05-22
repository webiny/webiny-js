import { CMS_ENTRY_BATCH_SCHEDULE_WAIT } from "./constants";

/**
 * This is to be used when user wants to wait for a number of milliseconds before the batch is executed.
 * Intended to be used internally or for a specific user case.
 * Not to be documented and exposed to publish as it can slow the data loading a lot.
 *
 * https://github.com/graphql/dataloader#batch-scheduling
 */
export const createBatchScheduleFn = () => {
    if (CMS_ENTRY_BATCH_SCHEDULE_WAIT <= 0) {
        return undefined;
    }
    return (callback: () => void) => {
        setTimeout(callback, CMS_ENTRY_BATCH_SCHEDULE_WAIT);
    };
};
