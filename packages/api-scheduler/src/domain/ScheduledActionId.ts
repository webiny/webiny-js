import { createCacheKey } from "@webiny/utils";
import { SCHEDULE_ID_PREFIX } from "~/constants.js";

export class ScheduledActionId {
    static from(params: { namespace: string; actionType: string; targetId: string }) {
        return [SCHEDULE_ID_PREFIX, createCacheKey(params).slice(-24)].join("");
    }
}
