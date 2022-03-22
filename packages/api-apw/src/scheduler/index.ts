import { createApwScheduleAction } from "./createScheduleAction";
import { ApwScheduleActionCrud, CreateApwContextParams } from "./types";
import { CreateApwParams } from "~/types";

interface CreateSchedulerParams
    extends Pick<CreateApwParams, "getLocale" | "getTenant" | "getIdentity" | "getPermission">,
        CreateApwContextParams {}

export const createScheduler = (params: CreateSchedulerParams): ApwScheduleActionCrud => {
    const { getLocale, getIdentity, getTenant, getPermission, storageOperations } = params;

    return createApwScheduleAction({
        getLocale,
        getIdentity,
        getTenant,
        getPermission,
        storageOperations
    });
};
