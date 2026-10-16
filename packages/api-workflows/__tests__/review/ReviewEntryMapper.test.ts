import { describe, expect, it } from "vitest";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import {
    ReviewEntryMapper,
    type ReviewEntryStep,
    type ReviewEntryValues
} from "~/features/review/shared/ReviewEntryMapper.js";
import type { ReviewStepRun } from "~/domain/review/types.js";
import { createAiIssue } from "~tests/__helpers/fixtures.js";
import { createRequestedReview } from "~tests/__helpers/fixtures.js";
import { NOW } from "~tests/__helpers/fixtures.js";
import { otherReviewer } from "~tests/__helpers/fixtures.js";
import { requester } from "~tests/__helpers/fixtures.js";
import { toSaveData } from "~tests/__helpers/fixtures.js";

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

describe("ReviewEntryMapper step issues (R171)", () => {
    it("maps the issues both ways", () => {
        const issues = [
            createAiIssue(),
            createAiIssue({
                fieldPath: null,
                severity: "error",
                message: "The page is empty.",
                suggestion: null
            }),
            createAiIssue({ severity: "info", suggestion: "Keep it." })
        ];
        const data = toSaveData(createRequestedReview());
        data.steps[0].issues = issues;

        const values = ReviewEntryMapper.toValues(data);
        const read = ReviewEntryMapper.fromEntry(toEntry(values));

        expect(values.steps?.[0].issues).toEqual(issues);
        expect(read.steps[0].issues).toEqual(issues);
        expect(read.steps[1].issues).toEqual([]);
    });

    it("does not share the issue objects with the review data", () => {
        const data = toSaveData(createRequestedReview());
        data.steps[0].issues = [createAiIssue()];

        const values = ReviewEntryMapper.toValues(data);
        data.steps[0].issues[0].message = "Changed after mapping.";

        expect(values.steps?.[0].issues?.[0].message).toBe(
            "The title is longer than 60 characters."
        );
    });

    it("reads steps stored without the field, or with null, as no issues (no migration)", () => {
        const values = ReviewEntryMapper.toValues(toSaveData(createRequestedReview()));
        const absent = values.steps?.map(step => ({
            ...step,
            issues: undefined
        })) as unknown as ReviewEntryStep[];
        const nulled = values.steps?.map(step => ({
            ...step,
            issues: null
        })) as unknown as ReviewEntryStep[];

        const readAbsent = ReviewEntryMapper.fromEntry(toEntry({ ...values, steps: absent }));
        const readNull = ReviewEntryMapper.fromEntry(toEntry({ ...values, steps: nulled }));

        expect(readAbsent.steps.map(step => step.issues)).toEqual([[], []]);
        expect(readNull.steps.map(step => step.issues)).toEqual([[], []]);
    });

    it("reads storage nulls and empty strings of the optional fields as null", () => {
        const values = ReviewEntryMapper.toValues(toSaveData(createRequestedReview()));
        const steps = values.steps?.map((step, index) =>
            index === 0
                ? {
                      ...step,
                      issues: [
                          {
                              fieldPath: "",
                              severity: "error",
                              message: "Broken.",
                              suggestion: ""
                          },
                          {
                              fieldPath: null,
                              severity: "info",
                              message: "Fine.",
                              suggestion: null
                          }
                      ]
                  }
                : step
        ) as ReviewEntryStep[];

        const read = ReviewEntryMapper.fromEntry(toEntry({ ...values, steps }));

        expect(read.steps[0].issues).toEqual([
            { fieldPath: null, severity: "error", message: "Broken.", suggestion: null },
            { fieldPath: null, severity: "info", message: "Fine.", suggestion: null }
        ]);
    });
});

describe("ReviewEntryMapper cancelledBy (R252, A91)", () => {
    it("maps the cancelling actor both ways, with and without an identity type", () => {
        const withIdentityType = toSaveData(createRequestedReview());
        withIdentityType.state = "cancelled";
        withIdentityType.cancelledBy = requester;
        const withoutIdentityType = toSaveData(createRequestedReview());
        withoutIdentityType.state = "cancelled";
        withoutIdentityType.cancelledBy = otherReviewer;

        const first = ReviewEntryMapper.toValues(withIdentityType);
        const second = ReviewEntryMapper.toValues(withoutIdentityType);

        expect(first.cancelledBy).toEqual({
            type: "user",
            id: "user-requester",
            displayName: "Rita Requester",
            identityType: "admin"
        });
        expect(second.cancelledBy).toEqual({
            type: "user",
            id: "user-other-reviewer",
            displayName: "Olga Reviewer",
            identityType: null
        });
        expect(ReviewEntryMapper.fromEntry(toEntry(first)).cancelledBy).toEqual(requester);
        expect(ReviewEntryMapper.fromEntry(toEntry(second)).cancelledBy).toEqual(otherReviewer);
    });

    it("writes null for a review that is not cancelled", () => {
        const values = ReviewEntryMapper.toValues(toSaveData(createRequestedReview()));

        expect(values.cancelledBy).toBeNull();
        expect(ReviewEntryMapper.fromEntry(toEntry(values)).cancelledBy).toBeNull();
    });

    it("reads an entry stored without the field, or with an empty actor, as null (no migration)", () => {
        const values = ReviewEntryMapper.toValues(toSaveData(createRequestedReview()));
        const absent: ReviewEntryValues = { ...values };
        delete absent.cancelledBy;
        const empty: ReviewEntryValues = {
            ...values,
            cancelledBy: { type: "", id: "", displayName: "", identityType: null }
        };

        expect(ReviewEntryMapper.fromEntry(toEntry(absent)).cancelledBy).toBeNull();
        expect(ReviewEntryMapper.fromEntry(toEntry(empty)).cancelledBy).toBeNull();
    });

    it("does not share the actor object with the review data", () => {
        const data = toSaveData(createRequestedReview());
        data.state = "cancelled";
        data.cancelledBy = { ...requester };

        const values = ReviewEntryMapper.toValues(data);
        data.cancelledBy.displayName = "Changed after mapping.";

        expect(values.cancelledBy?.displayName).toBe("Rita Requester");
    });
});
