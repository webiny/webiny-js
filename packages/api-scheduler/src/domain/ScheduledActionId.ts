import { createCacheKey } from "@webiny/utils";
import { SCHEDULE_ID_PREFIX } from "~/constants.js";

export interface IScheduledActionIdParams {
    namespace: string;
    actionType: string;
    targetId: string;
}

export class ScheduledActionId {
    static from(params: IScheduledActionIdParams) {
        return [
            SCHEDULE_ID_PREFIX,
            createCacheKey([params.namespace, params.actionType, params.targetId]).slice(-24)
        ].join("");
    }
}
