import { describe, expect, it } from "vitest";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import {
    ReviewEntryMapper,
    type ReviewEntryStep,
    type ReviewEntryValues
} from "~/features/review/shared/ReviewEntryMapper.js";
import type { ReviewStepRun } from "~/domain/review/types.js";
import { createRequestedReview, NOW, toSaveData } from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";

const toEntry = (values: ReviewEntryValues): CmsEntry<ReviewEntryValues> => {
    return {
        id: "review-1#0001",
        createdOn: NOW,
        savedOn: LATER,
        values
    } as unknown as CmsEntry<ReviewEntryValues>;
};

describe("ReviewEntryMapper step run data (R139)", () => {
    it("maps the task id and the runs both ways", () => {
        const runs: ReviewStepRun[] = [
            {
                taskId: "task-1",
                startedOn: NOW,
                finishedOn: LATER,
                outcome: "failed",
                reason: "The automation failed: boom."
            },
            {
                taskId: null,
                startedOn: LATER,
                finishedOn: null,
                outcome: null,
                reason: null
            }
        ];
        const data = toSaveData(createRequestedReview());
        data.steps[0].taskId = "task-2";
        data.steps[0].runs = runs;

        const values = ReviewEntryMapper.toValues(data);
        const read = ReviewEntryMapper.fromEntry(toEntry(values));

        expect(values.steps?.[0].taskId).toBe("task-2");
        expect(values.steps?.[0].runs).toEqual(runs);
        expect(read.steps[0].taskId).toBe("task-2");
        expect(read.steps[0].runs).toEqual(runs);
        expect(read.steps[1]).toMatchObject({ taskId: null, runs: [] });
    });

    it("reads steps stored without the fields as no task and no runs (no migration)", () => {
        const values = ReviewEntryMapper.toValues(toSaveData(createRequestedReview()));
        const legacySteps = values.steps?.map(step => ({
            ...step,
            taskId: undefined,
            runs: undefined
        })) as unknown as ReviewEntryStep[];

        const read = ReviewEntryMapper.fromEntry(toEntry({ ...values, steps: legacySteps }));

        expect(read.steps.map(step => step.taskId)).toEqual([null, null]);
        expect(read.steps.map(step => step.runs)).toEqual([[], []]);
    });

    it("reads storage dates as ISO strings and storage nulls as null", () => {
        const values = ReviewEntryMapper.toValues(toSaveData(createRequestedReview()));
        const steps = values.steps?.map((step, index) =>
            index === 0
                ? {
                      ...step,
                      taskId: "",
                      runs: [
                          {
                              taskId: "",
                              startedOn: new Date(NOW),
                              finishedOn: new Date(LATER),
                              outcome: "",
                              reason: ""
                          }
                      ]
                  }
                : step
        ) as ReviewEntryStep[];

        const read = ReviewEntryMapper.fromEntry(toEntry({ ...values, steps }));

        expect(read.steps[0].taskId).toBeNull();
        expect(read.steps[0].runs).toEqual([
            { taskId: null, startedOn: NOW, finishedOn: LATER, outcome: null, reason: null }
        ]);
    });
});
