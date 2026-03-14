import { describe, expect, it } from "vitest";
import { SCHEDULE_ID_PREFIX } from "~/constants.js";
import { ScheduledActionId } from "~/domain/ScheduledActionId.js";

describe("ScheduledActionId", () => {
    it("should create a valid schedule action id", () => {
        const result = ScheduledActionId.from({
            namespace: "Cms/Entry/Article",
            actionType: "publish",
            targetId: "target-id#0001"
        });

        expect(result).toEqual(`${SCHEDULE_ID_PREFIX}e1df7120d362fc84419a2b57`);
    });
});
