import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { mapReview } from "./mapReview.js";
import type { ReviewDto } from "./dto.js";
import type { ReviewStepDto } from "./dto.js";
import { createActorDto } from "~/review/testing/reviewFixtures.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { createStepDto } from "~/review/testing/reviewFixtures.js";
import { T0 } from "~/review/testing/reviewFixtures.js";
import { T1 } from "~/review/testing/reviewFixtures.js";
import { T2 } from "~/review/testing/reviewFixtures.js";
import { T3 } from "~/review/testing/reviewFixtures.js";

describe("mapReview", () => {
    it("maps every field of a fully populated review", () => {
        const owner = createActorDto({ id: "user-7", displayName: "Edsger Dijkstra" });
        const assigner = createActorDto({
            type: "automation",
            id: "auto-1",
            displayName: "Router"
        });
        const step: ReviewStepDto = createStepDto({
            id: "step-1",
            title: "Draft check",
            color: "#eb5757",
            description: "Check the draft.",
            type: "review",
            state: "approved",
            owner,
            comment: "Looks good.",
            pickedUserId: "user-7",
            candidateTeamIds: ["team-1", "team-2"],
            candidateTeams: [
                { id: "team-1", name: "Editors" },
                { id: "team-2", name: "Legal" }
            ],
            assignmentSource: "pick",
            assignment: {
                source: "pick",
                ruleId: "rule-1",
                reason: "Picked by the requester.",
                by: assigner
            },
            reachedOn: T1,
            startedOn: T1,
            finishedOn: T2,
            taskId: "task-1",
            runs: [
                {
                    taskId: "task-0",
                    startedOn: T0,
                    finishedOn: T1,
                    outcome: "failed",
                    reason: "Timed out."
                }
            ],
            issues: [
                {
                    fieldPath: "values.title",
                    severity: "warning",
                    message: "Too long.",
                    suggestion: "Shorten it."
                }
            ],
            assignments: [
                {
                    id: "assignment-1",
                    kind: "skip",
                    userId: "user-9",
                    userDisplayName: "Pat Kim",
                    assignedOn: T1,
                    source: "strategy",
                    ruleId: "rule-2",
                    by: assigner,
                    reason: "On leave."
                }
            ]
        });
        const dto = createReviewDto({
            steps: [step],
            currentStepId: "step-1",
            currentStepState: "approved",
            currentStepType: "review",
            currentOwnerId: "user-7"
        });

        const review = mapReview(dto);

        expect(review).toEqual({
            id: "review-1",
            workflowId: "workflow-1",
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            title: "Launch article",
            isActive: true,
            state: "inProgress",
            currentStepId: "step-1",
            currentStepType: "review",
            currentOwnerId: "user-7",
            currentStepState: "approved",
            currentCandidateTeamIds: ["team-1"],
            targetContext: {
                folder: { id: "folder-1", type: "FmCmsEntry" },
                modelId: "article",
                title: "Launch article",
                author: { id: "user-2", displayName: "Grace Hopper" }
            },
            workflowName: "Editorial",
            steps: [
                {
                    id: "step-1",
                    title: "Draft check",
                    color: "#eb5757",
                    description: "Check the draft.",
                    type: "review",
                    state: "approved",
                    owner: {
                        type: "user",
                        id: "user-7",
                        displayName: "Edsger Dijkstra",
                        identityType: "admin"
                    },
                    comment: "Looks good.",
                    pickedUserId: "user-7",
                    candidateTeamIds: ["team-1", "team-2"],
                    candidateTeams: [
                        { id: "team-1", name: "Editors" },
                        { id: "team-2", name: "Legal" }
                    ],
                    assignmentSource: "pick",
                    assignment: {
                        source: "pick",
                        ruleId: "rule-1",
                        reason: "Picked by the requester.",
                        by: {
                            type: "automation",
                            id: "auto-1",
                            displayName: "Router",
                            identityType: "admin"
                        }
                    },
                    reachedOn: T1,
                    startedOn: T1,
                    finishedOn: T2,
                    taskId: "task-1",
                    runs: [
                        {
                            taskId: "task-0",
                            startedOn: T0,
                            finishedOn: T1,
                            outcome: "failed",
                            reason: "Timed out."
                        }
                    ],
                    issues: [
                        {
                            fieldPath: "values.title",
                            severity: "warning",
                            message: "Too long.",
                            suggestion: "Shorten it."
                        }
                    ],
                    assignments: [
                        {
                            id: "assignment-1",
                            kind: "skip",
                            userId: "user-9",
                            userDisplayName: "Pat Kim",
                            assignedOn: T1,
                            source: "strategy",
                            ruleId: "rule-2",
                            by: {
                                type: "automation",
                                id: "auto-1",
                                displayName: "Router",
                                identityType: "admin"
                            },
                            reason: "On leave."
                        }
                    ]
                }
            ],
            createdBy: {
                type: "user",
                id: "user-2",
                displayName: "Grace Hopper",
                identityType: "admin"
            },
            cancelledBy: null,
            createdOn: T0,
            savedOn: T3,
            lastChangedOn: T3
        });
    });

    it("renames model to namespace and workflow.name to workflowName", () => {
        const review = mapReview(
            createReviewDto({
                model: "wb.page",
                workflow: { name: "Page flow", models: ["wb.page"] }
            })
        );

        expect(review.namespace).toBe("wb.page");
        expect(review.workflowName).toBe("Page flow");
    });

    it("keeps candidateTeams as received and defaults an absent list to empty", () => {
        const withTeams = mapReview(
            createReviewDto({
                steps: [
                    createStepDto({
                        candidateTeams: [{ id: "team-9", name: "Press" }]
                    })
                ]
            })
        );
        const step = createStepDto();
        const withoutTeams = mapReview(
            createReviewDto({
                steps: [
                    {
                        ...step,
                        candidateTeams: undefined as unknown as ReviewStepDto["candidateTeams"]
                    }
                ]
            })
        );

        expect(withTeams.steps[0].candidateTeams).toEqual([{ id: "team-9", name: "Press" }]);
        expect(withoutTeams.steps[0].candidateTeams).toEqual([]);
    });

    it("maps nulls: no folder, no owner, no assignment, no timestamps, no comment", () => {
        const review = mapReview(
            createReviewDto({
                state: "cancelled",
                isActive: false,
                currentStepId: null,
                currentStepState: null,
                currentStepType: null,
                currentOwnerId: null,
                targetContext: {
                    folder: null,
                    modelId: "article",
                    title: "Launch article",
                    author: { id: "user-2", displayName: "Grace Hopper" }
                },
                steps: [
                    createStepDto({
                        description: null,
                        owner: null,
                        assignmentSource: null,
                        assignment: null,
                        reachedOn: null,
                        startedOn: null,
                        finishedOn: null
                    })
                ]
            })
        );

        expect(review.currentStepId).toBeNull();
        expect(review.currentStepState).toBeNull();
        expect(review.currentStepType).toBeNull();
        expect(review.currentOwnerId).toBeNull();
        expect(review.targetContext.folder).toBeNull();
        const step = review.steps[0];
        expect(step.description).toBeNull();
        expect(step.owner).toBeNull();
        expect(step.comment).toBeNull();
        expect(step.pickedUserId).toBeNull();
        expect(step.assignmentSource).toBeNull();
        expect(step.assignment).toBeNull();
        expect(step.reachedOn).toBeNull();
        expect(step.startedOn).toBeNull();
        expect(step.finishedOn).toBeNull();
        expect(step.taskId).toBeNull();
    });

    it("maps cancelledBy to an actor and an absent cancelledBy to null (R252)", () => {
        const cancelled = mapReview(
            createReviewDto({
                state: "cancelled",
                isActive: false,
                cancelledBy: createActorDto({ id: "user-5", displayName: "Nina Cole" })
            })
        );
        const running = mapReview(createReviewDto());
        const withoutField = mapReview({
            ...createReviewDto(),
            cancelledBy: undefined as unknown as ReviewDto["cancelledBy"]
        });

        expect(cancelled.cancelledBy).toEqual({
            type: "user",
            id: "user-5",
            displayName: "Nina Cole",
            identityType: "admin"
        });
        expect(running.cancelledBy).toBeNull();
        expect(withoutField.cancelledBy).toBeNull();
    });

    it("keeps the skipped person's display name and maps an absent one to null (R251)", () => {
        const entry = {
            id: "assignment-1",
            kind: "skip" as const,
            userId: "user-9",
            assignedOn: T1,
            source: "strategy",
            ruleId: null,
            by: null,
            reason: "On leave."
        };
        const review = mapReview(
            createReviewDto({
                steps: [
                    createStepDto({
                        assignments: [
                            { ...entry, userDisplayName: "Pat Kim" },
                            {
                                ...entry,
                                id: "assignment-2",
                                userDisplayName: undefined as unknown as string | null
                            },
                            { ...entry, id: "assignment-3", userDisplayName: null }
                        ]
                    })
                ]
            })
        );

        const names = review.steps[0].assignments?.map(item => item.userDisplayName);
        expect(names).toEqual(["Pat Kim", null, null]);
    });

    it("maps absent assignments (a list selection) to null and an empty log to an empty array", () => {
        const onList = mapReview(createReviewDto({ steps: [createStepDto()] }));
        const onSingle = mapReview(
            createReviewDto({ steps: [createStepDto({ assignments: [] })] })
        );

        expect(onList.steps[0].assignments).toBeNull();
        expect(onSingle.steps[0].assignments).toEqual([]);
    });

    it("maps an actor without an identity type to null", () => {
        const actor = createActorDto({ identityType: null });
        const review = mapReview(createReviewDto({ createdBy: actor }));

        expect(review.createdBy.identityType).toBeNull();
    });
});
