import { describe, expect, it } from "vitest";
import { SCHEDULED_ACTION_PUBLISH } from "~/constants.js";
import { ScheduledActionMapper } from "~/domain/ScheduledActionMapper.js";
import type { IScheduledAction } from "~/shared/abstractions.js";

const createAction = (error: string | undefined): IScheduledAction => {
    return {
        id: "wby-schedule-abc#0001",
        namespace: "Cms/Entry/article",
        actionType: SCHEDULED_ACTION_PUBLISH,
        targetId: "target#0001",
        scheduledBy: { id: "admin", type: "admin", displayName: "Admin" },
        scheduledFor: new Date("2026-11-24T10:00:00.000Z"),
        title: "Article",
        payload: {},
        error
    } as IScheduledAction;
};

describe("ScheduledActionMapper.toGraphQL", () => {
    it("should output the execution error", () => {
        const result = ScheduledActionMapper.toGraphQL(
            createAction("Failed to execute scheduled action: Failed to publish entry: target#0001")
        );

        expect(result.error).toBe(
            "Failed to execute scheduled action: Failed to publish entry: target#0001"
        );
    });

    it("should output null when there is no execution error", () => {
        const result = ScheduledActionMapper.toGraphQL(createAction(undefined));

        expect(result.error).toBeNull();
    });
});
