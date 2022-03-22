import { createScheduleActionMethods } from "./createScheduleActionMethods";
import { ApwScheduleActionCrud, CreateScheduleActionParams } from "../types";

export const createApwScheduleAction = (
    params: CreateScheduleActionParams
): ApwScheduleActionCrud => {
    return createScheduleActionMethods(params);
};
