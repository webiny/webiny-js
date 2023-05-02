import { CMS_ENTRY_BATCH_SCHEDULE_WAIT } from "./constants";

export const createBatchScheduleFn = () => {
    return (callback: () => void) => {
        if (CMS_ENTRY_BATCH_SCHEDULE_WAIT <= 0) {
            callback();
        }
        setTimeout(callback, CMS_ENTRY_BATCH_SCHEDULE_WAIT);
    };
};
