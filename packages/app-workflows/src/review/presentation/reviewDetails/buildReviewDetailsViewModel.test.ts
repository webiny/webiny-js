import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { buildReviewDetailsViewModel } from "./buildReviewDetailsViewModel.js";
import { SKIPPED_PERSON_LABEL } from "./buildReviewDetailsViewModel.js";
import { formatReviewTimeFull } from "./formatReviewTimeFull.js";
import { getRevisionNumber } from "./getRevisionNumber.js";
import { getStepTimes } from "./getStepTimes.js";
import { getWhyOwner } from "./getWhyOwner.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import type { ReviewAssignmentEntry } from "~/review/domain/types.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";

const NOW = new Date(2026, 9, 16, 15, 0);
const at = (day: number, hour: number, minute: number): string => {
    return new Date(2026, 9, day, hour, minute).toISOString();
};
const LUKA = createActor({ id: "user-2", displayName: "Luka Perić" });

describe("getRevisionNumber", () => {
    it("strips the leading zeros of the version", () => {
        expect(getRevisionNumber("entry-1#0003")).toBe("3");
        expect(getRevisionNumber("entry-1#0012")).toBe("12");
    });

    it("returns null without a version or with a non-numeric one", () => {
        expect(getRevisionNumber("entry-1")).toBeNull();
        expect(getRevisionNumber("entry-1#abc")).toBeNull();
    });
});

describe("getWhyOwner", () => {
    const assignment = (source: string, overrides = {}) => ({
        source,
        ruleId: null,
        reason: null,
        by: null,
        ...overrides
    });

    it("maps every source to the design text", () => {
        const table: Array<[string, string]> = [
            ["picked", "Picked by requester"],
            ["rule", "Assigned by a routing rule"],
            ["roundRobin", "Round-robin"],
            ["leastLoaded", "Least-loaded"],
            ["pool", "Sent to team pool"],
            ["poolStart", "Started from team pool"]
        ];
        table.forEach(([source, text]) => {
            const step = createStep({ owner: LUKA, assignment: assignment(source) });
            expect(getWhyOwner(step)).toBe(text);
        });
    });

    it("uses the server reason for a pool outcome", () => {
        const step = createStep({
            owner: null,
            assignment: assignment("pool", { reason: "No rule matched and the strategy is None" })
        });
        expect(getWhyOwner(step)).toBe("No rule matched and the strategy is None");
    });

    it("names who took over or reassigned", () => {
        const operator = createActor({ id: "user-3", displayName: "Jana Dolenc" });
        const takeOver = createStep({
            owner: LUKA,
            assignment: assignment("takeOver", { by: LUKA })
        });
        const reassign = createStep({
            owner: LUKA,
            assignment: assignment("reassign", { by: operator })
        });
        expect(getWhyOwner(takeOver)).toBe("Taken over by Luka Perić");
        expect(getWhyOwner(reassign)).toBe("Reassigned by Jana Dolenc");
    });

    it("hides the row for AI and automation owners (R216, QBZ-63)", () => {
        const ai = createStep({
            owner: createActor({ type: "ai", displayName: "model" }),
            assignment: assignment("rule")
        });
        expect(getWhyOwner(ai)).toBeNull();
    });

    it("hides the row without an assignment", () => {
        expect(getWhyOwner(createStep({ owner: LUKA, assignment: null }))).toBeNull();
    });
});

describe("getStepTimes (QBZ-54)", () => {
    it("is null for a step that was not reached", () => {
        expect(getStepTimes(createStep(), NOW)).toBeNull();
    });

    it("writes the date once when everything falls on the day of 'reached'", () => {
        const step = createStep({
            reachedOn: at(6, 10, 41),
            startedOn: at(6, 11, 5),
            finishedOn: at(6, 11, 20)
        });
        expect(getStepTimes(step, NOW)).toBe(
            "Reached 6 Oct, 10:41 · started 11:05 · finished 11:20"
        );
    });

    it("writes the date again for a later day", () => {
        const step = createStep({
            reachedOn: at(6, 10, 41),
            startedOn: at(7, 9, 0),
            finishedOn: null
        });
        expect(getStepTimes(step, NOW)).toBe("Reached 6 Oct, 10:41 · started 7 Oct, 09:00");
    });

    it("is null when the reached date is invalid", () => {
        expect(getStepTimes(createStep({ reachedOn: "not a date" }), NOW)).toBeNull();
    });

    it("leaves out a started or finished time that is invalid", () => {
        const step = createStep({
            reachedOn: at(6, 10, 41),
            startedOn: "not a date",
            finishedOn: at(6, 11, 20)
        });
        expect(getStepTimes(step, NOW)).toBe("Reached 6 Oct, 10:41 · finished 11:20");
    });

    it("shows only 'reached' for a step that was not started", () => {
        expect(getStepTimes(createStep({ reachedOn: at(16, 14, 20) }), NOW)).toBe("Reached 14:20");
    });
});

const skip = (
    userId: string,
    reason: string | null,
    userDisplayName: string | null = null
): ReviewAssignmentEntry => ({
    id: `skip-${userId.replace("user-", "u")}`,
    kind: "skip",
    userId,
    userDisplayName,
    assignedOn: at(6, 10, 0),
    source: "pool",
    ruleId: null,
    by: null,
    reason
});

describe("buildReviewDetailsViewModel", () => {
    const build = (review = createReview(), flags = createFlags()) => {
        return buildReviewDetailsViewModel({
            status: "loaded",
            review: createReviewWithFlags(review, flags),
            error: null,
            openAction: null,
            now: NOW
        });
    };

    it("builds the header lines", () => {
        const review = createReview({
            title: "Spring campaign review",
            targetRevisionId: "entry-1#0003",
            createdOn: at(16, 9, 5),
            createdBy: createActor({ displayName: "Maja Kos" }),
            targetContext: {
                folder: null,
                modelId: "article",
                title: "Spring campaign",
                author: { id: "user-1", displayName: "Maja Kos" }
            }
        });

        const { header } = build(review);

        expect(header).toEqual({
            title: "Spring campaign review",
            stateLabel: "In progress",
            stateVariant: "accent-light",
            contentLine: "Content: Spring campaign (#3)",
            requesterLine: "Requester: Maja Kos",
            requestedLine: "Requested: 09:05",
            requestedTitle: formatReviewTimeFull(at(16, 9, 5))
        });
    });

    it("builds a timeline for all six step states", () => {
        const review = createReview({
            steps: [
                createStep({ id: "a", title: "S pending", state: StepState.Pending }),
                createStep({
                    id: "b",
                    title: "S awaiting",
                    state: StepState.Awaiting,
                    reachedOn: at(16, 10, 0)
                }),
                createStep({
                    id: "c",
                    title: "S in review",
                    state: StepState.InReview,
                    owner: LUKA,
                    reachedOn: at(16, 10, 0)
                }),
                createStep({
                    id: "d",
                    title: "S approved",
                    state: StepState.Approved,
                    owner: LUKA,
                    comment: "Looks fine.",
                    reachedOn: at(16, 10, 0)
                }),
                createStep({
                    id: "e",
                    title: "S rejected",
                    state: StepState.Rejected,
                    owner: LUKA,
                    comment: null,
                    reachedOn: at(16, 10, 0)
                }),
                createStep({
                    id: "f",
                    title: "S failed",
                    state: StepState.Failed,
                    owner: createActor({ type: "automation", displayName: "Send webhook" }),
                    reachedOn: at(16, 10, 0)
                })
            ]
        });

        const { steps } = build(review);

        expect(steps.map(step => step.stateLabel)).toEqual([
            "Pending",
            "Awaiting",
            "In review",
            "Approved",
            "Rejected",
            "Failed"
        ]);
        expect(steps[0].ownerLine).toBeNull();
        expect(steps[0].times).toBeNull();
        expect(steps[1].ownerLine).toBe("Team pool");
        expect(steps[2].ownerLine).toBe("Luka Perić");
        expect(steps[3].comment).toBe("Luka Perić: “Looks fine.”");
        expect(steps[4].comment).toBe("Rejected at S rejected.");
        expect(steps[5].ownerLine).toBe("S failed");
    });

    it("hides 'Why this owner' for an AI step and shows it for a person", () => {
        const review = createReview({
            steps: [
                createStep({
                    id: "a",
                    title: "AI check",
                    type: "ai",
                    state: StepState.Approved,
                    owner: createActor({ type: "ai", displayName: "model" }),
                    assignment: { source: "rule", ruleId: null, reason: null, by: null },
                    reachedOn: at(16, 10, 0)
                }),
                createStep({
                    id: "b",
                    state: StepState.InReview,
                    owner: LUKA,
                    assignment: { source: "poolStart", ruleId: null, reason: null, by: null },
                    reachedOn: at(16, 10, 0)
                })
            ]
        });

        const { steps } = build(review);

        expect(steps[0].typeLabel).toBe("AI");
        expect(steps[0].whyOwner).toBeNull();
        expect(steps[1].typeLabel).toBe("People");
        expect(steps[1].whyOwner).toBe("Started from team pool");
    });

    it("shows the skipped-by-assignment box exactly as received (D89)", () => {
        const review = createReview({
            steps: [
                createStep({
                    state: StepState.InReview,
                    owner: LUKA,
                    reachedOn: at(16, 10, 0),
                    assignments: [
                        skip("user-9", "is the requester", "Pat Kim"),
                        skip("user-8", "excluded until 20 Oct: on leave"),
                        skip("user-7", "is on leave", "   "),
                        {
                            id: "outcome-1",
                            kind: "outcome",
                            userId: "user-2",
                            userDisplayName: "Luka Perić",
                            assignedOn: at(16, 10, 0),
                            source: "pool",
                            ruleId: null,
                            by: null,
                            reason: null
                        }
                    ]
                })
            ]
        });

        const { steps } = build(review);

        expect(steps[0].skipped).toEqual([
            { id: "skip-u9", name: "Pat Kim", reason: "is the requester" },
            {
                id: "skip-u8",
                name: SKIPPED_PERSON_LABEL,
                reason: "excluded until 20 Oct: on leave"
            },
            { id: "skip-u7", name: SKIPPED_PERSON_LABEL, reason: "is on leave" }
        ]);
        expect(SKIPPED_PERSON_LABEL).toBe("A person");
        expect(JSON.stringify(steps[0])).not.toContain("user-9");
        expect(JSON.stringify(steps[0])).not.toContain("user-8");
        expect(JSON.stringify(steps[0])).not.toContain("user-7");
    });

    it("gives two unresolved users with the same reason distinct ids", () => {
        const review = createReview({
            steps: [
                createStep({
                    assignments: [skip("user-1", "is on leave"), skip("user-2", "is on leave")]
                })
            ]
        });

        const skipped = build(review).steps[0].skipped ?? [];

        expect(skipped.map(item => item.id)).toEqual(["skip-u1", "skip-u2"]);
    });

    it("has no skipped box without skip entries or without assignments", () => {
        const none = build(createReview({ steps: [createStep({ assignments: null })] }));
        const empty = build(createReview({ steps: [createStep({ assignments: [] })] }));
        expect(none.steps[0].skipped).toBeNull();
        expect(empty.steps[0].skipped).toBeNull();
    });

    it("offers the footer actions from the server flags for the current step", () => {
        const review = createReview({ currentStepId: "step-1" });

        const { actions } = build(review, createFlags({ canTakeOver: true, canReassign: true }));

        expect(actions.map(action => [action.kind, action.stepId])).toEqual([
            ["reassign", "step-1"],
            ["takeOver", "step-1"]
        ]);
    });

    it("shows a cancelled review with its header, no timeline and no actions (QBZ-1)", () => {
        const review = createReview({
            state: ReviewState.Cancelled,
            isActive: false,
            lastChangedOn: at(16, 14, 20)
        });

        const vm = build(review, createFlags({ canCancel: true }));

        expect(vm.header?.stateLabel).toBe("Cancelled");
        expect(vm.steps).toEqual([]);
        expect(vm.actions).toEqual([]);
        expect(vm.cancelledText).toBe(
            "Someone cancelled this review at 14:20. The revision has no review now; a new request starts again from the first step."
        );
    });

    it("names who cancelled the review when the review carries it (R252)", () => {
        const review = createReview({
            state: ReviewState.Cancelled,
            isActive: false,
            lastChangedOn: at(16, 14, 20),
            cancelledBy: createActor({ id: "user-5", displayName: "Nina Cole" })
        });

        const vm = build(review);

        expect(vm.cancelledText).toBe(
            "Nina Cole cancelled this review at 14:20. The revision has no review now; a new request starts again from the first step."
        );
    });

    it("falls back to 'Someone' for a blank canceller name", () => {
        const review = createReview({
            state: ReviewState.Cancelled,
            isActive: false,
            lastChangedOn: at(16, 14, 20),
            cancelledBy: createActor({ displayName: "  " })
        });

        expect(build(review).cancelledText).toContain("Someone cancelled this review at 14:20.");
    });

    it("builds the loading and failed states without a header", () => {
        const loading = buildReviewDetailsViewModel({
            status: "loading",
            review: null,
            error: null,
            openAction: null,
            now: NOW
        });
        const failed = buildReviewDetailsViewModel({
            status: "failed",
            review: null,
            error: "The server did not respond. Try again in a moment.",
            openAction: null,
            now: NOW
        });

        expect(loading.header).toBeNull();
        expect(loading.steps).toEqual([]);
        expect(failed.error).toBe("The server did not respond. Try again in a moment.");
        expect(failed.actions).toEqual([]);
    });

    it("never carries runs, issues or the task id (R203)", () => {
        const review = createReview({
            steps: [
                createStep({
                    state: StepState.Failed,
                    owner: createActor({ type: "ai", displayName: "model" }),
                    reachedOn: at(16, 10, 0),
                    taskId: "task-secret-1",
                    runs: [
                        {
                            taskId: "task-secret-0",
                            startedOn: at(16, 9, 0),
                            finishedOn: at(16, 9, 5),
                            outcome: "failed",
                            reason: "run reason secret"
                        }
                    ],
                    issues: [
                        {
                            fieldPath: "title",
                            severity: "error",
                            message: "issue message secret",
                            suggestion: "issue suggestion secret"
                        }
                    ]
                })
            ]
        });

        const text = JSON.stringify(build(review));
        const secrets = [
            "task-secret-1",
            "task-secret-0",
            "run reason secret",
            "issue message secret",
            "issue suggestion secret"
        ];

        secrets.forEach(secret => expect(text).not.toContain(secret));
    });

    it("gives every time a full date, time and timezone on hover (QBZ-54)", () => {
        const review = createReview({
            steps: [
                createStep({
                    state: StepState.Approved,
                    owner: LUKA,
                    reachedOn: at(6, 10, 41),
                    startedOn: at(6, 11, 5),
                    finishedOn: at(6, 11, 20)
                })
            ]
        });

        const { steps } = build(review);

        expect(steps[0].timesTitle).toContain("Reached");
        expect(steps[0].timesTitle).toContain("6 Oct 2026");
        expect(steps[0].timesTitle).toContain("Finished");
    });

    it("is render-ready: plain data only (R234)", () => {
        const vm = build();
        expect(JSON.parse(JSON.stringify(vm))).toEqual(vm);
    });
});
