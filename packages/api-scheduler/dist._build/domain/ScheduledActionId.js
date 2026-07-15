import { createCacheKey } from "@webiny/utils";
import { SCHEDULE_ID_PREFIX } from "../constants.js";
class ScheduledActionId {
    static from(params) {
        return [
            SCHEDULE_ID_PREFIX,
            createCacheKey([
                params.namespace,
                params.actionType,
                params.targetId
            ]).slice(-24)
        ].join("");
    }
}
export { ScheduledActionId };

//# sourceMappingURL=ScheduledActionId.js.map