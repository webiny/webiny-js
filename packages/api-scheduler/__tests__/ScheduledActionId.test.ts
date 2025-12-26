import { describe, expect, it } from "vitest";
import { SCHEDULE_ID_PREFIX } from "~/constants.js";
import { ScheduledActionId } from "~/domain/ScheduledActionId.js";

describe("ScheduledActionId", () => {
    it("should create a valid schedule action id", () => {
        const result = ScheduledActionId.from({
            namespace: "Cms/Entry/Article",
            actionType: "Publish",
            targetId: "target-id#0001"
        });

        expect(result).toEqual(`${SCHEDULE_ID_PREFIX}af6fe9a3643c86f694da7bb5`);
    });
});
