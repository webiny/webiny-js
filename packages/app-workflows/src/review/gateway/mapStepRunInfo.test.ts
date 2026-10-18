import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapStepRunInfo } from "./mapStepRunInfo.js";
import { StepRunTaskStatus } from "~/review/domain/StepRunTaskStatus.js";
import { T1 } from "~/review/testing/reviewFixtures.js";
import { T2 } from "~/review/testing/reviewFixtures.js";
import { createStepRunInfoDto } from "~/review/testing/reviewFixtures.js";

describe("mapStepRunInfo", () => {
    it("maps every field", () => {
        const info = mapStepRunInfo(
            createStepRunInfoDto({
                taskId: "task-7",
                status: "failed",
                startedOn: T1,
                finishedOn: T2,
                iterations: 3,
                outcome: "failed",
                reason: "The step could not run."
            })
        );

        expect(info).toEqual({
            taskId: "task-7",
            status: "failed",
            startedOn: T1,
            finishedOn: T2,
            iterations: 3,
            outcome: "failed",
            reason: "The step could not run."
        });
    });

    it("keeps null times, outcome and reason (a task that has not finished)", () => {
        const info = mapStepRunInfo(
            createStepRunInfoDto({
                status: "running",
                startedOn: null,
                finishedOn: null,
                outcome: null,
                reason: null
            })
        );

        expect(info.startedOn).toBeNull();
        expect(info.finishedOn).toBeNull();
        expect(info.outcome).toBeNull();
        expect(info.reason).toBeNull();
    });

    it.each(Object.values(StepRunTaskStatus))("accepts the status %s", status => {
        const info = mapStepRunInfo(createStepRunInfoDto({ status }));

        expect(info.status).toBe(status);
    });

    it("throws for a status outside the union instead of showing a wrong one", () => {
        expect(() => mapStepRunInfo(createStepRunInfoDto({ status: "success" }))).toThrow(
            "Unknown step run status: success."
        );
    });
});
