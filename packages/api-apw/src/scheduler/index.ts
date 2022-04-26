import { createScheduleActionMethods } from "./createScheduleActionMethods";
import { ApwScheduleActionCrud, CreateScheduleActionParams } from "./types";

export const createScheduler = (params: CreateScheduleActionParams): ApwScheduleActionCrud => {
    const { getLocale, getIdentity, getTenant, getPermission, storageOperations } = params;

    return createScheduleActionMethods({
        getLocale,
        getIdentity,
        getTenant,
        getPermission,
        storageOperations
    });
};
