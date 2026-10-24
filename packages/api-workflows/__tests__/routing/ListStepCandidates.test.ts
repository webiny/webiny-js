import { beforeEach, describe, expect, it } from "vitest";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import {
    createRoutingContext,
    LEGAL_TEAM_ID,
    resetRoutingFakes
} from "~tests/__helpers/routingContext.js";
import { FakeListUsers } from "~tests/__helpers/FakeListUsers.js";
import { FakeReviewTargetLoader } from "~tests/__helpers/FakeReviewTargetLoader.js";
import {
    readableUsers,
    readChecks,
    throwingReadChecks
} from "~tests/__helpers/FakeReviewTargetReadAccess.js";
import { createRequestInput } from "~tests/__helpers/reviewContext.js";
import {
    ARTICLE_MODEL,
    createReviewStep,
    createWorkflowValues,
    editor,
    expectOk,
    requester,
    REVIEW_TEAM_ID
} from "~tests/__helpers/fixtures.js";
import type { WorkflowStep } from "~/domain/workflow/types.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { CancelReviewUseCase } from "~/features/review/CancelReview/index.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { ListStepCandidatesUseCase } from "~/features/routing/ListStepCandidates/index.js";

const PAST = "2000-01-01T00:00:00.000Z";

const REQUEST_INPUT = {
    workflowId: "workflow-1",
    stepId: "legal",
    model: ARTICLE_MODEL,
    targetId: "article-1",
    targetRevisionId: "article-1#0001",
    requesterId: requester.id
};

/** Anna can read; Bob is excluded with a reason; Cara's exclusion expired, but she cannot read. */
const EXPECTED_ROWS = [
    { id: "user-anna", displayName: "Anna", excluded: false, excludedReason: null },
    { id: "user-bob", displayName: "Bob", excluded: true, excludedReason: "On leave" },
    {
        id: "user-cara",
        displayName: "Cara",
        excluded: true,
        excludedReason: "Cannot read this content."
    }
];

const setup = async () => {
    const routing = await createRoutingContext({
        setup: container => {
            container.register(FakeReviewTargetLoader);
        }
    });
    const { container } = routing.context;
    expectOk(
        await container
            .resolve(StoreWorkflowUseCase)
            .execute({ workflow: createWorkflowValues(), actor: editor })
    );
    routing.settings.exclusions = [
        { userId: "user-bob", reason: "On leave" },
        { userId: "user-cara", reason: "Holiday", endsOn: PAST }
    ];
    routing.users.calls.length = 0;
    return { ...routing, listCandidates: container.resolve(ListStepCandidatesUseCase) };
};

describe("ListStepCandidatesUseCase (D97, D128, R120)", () => {
    beforeEach(() => {
        resetRoutingFakes();
        readableUsers.add("user-anna");
        readableUsers.add("user-bob");
    });

    it("lists the members of a stored step for a request, without the requester", async () => {
        const { listCandidates, users } = await setup();

        const rows = expectOk(await listCandidates.execute(REQUEST_INPUT));

        expect(rows).toEqual(EXPECTED_ROWS);
        expect(users.calls).toEqual([
            { input: { where: { teams_in: [REVIEW_TEAM_ID] } }, authorizationEnabled: false }
        ]);
        expect(
            readChecks.map(check => [check.userId, check.scope, check.targetRevisionId])
        ).toEqual([
            ["user-anna", "target", "article-1#0001"],
            ["user-bob", "target", "article-1#0001"],
            ["user-cara", "target", "article-1#0001"]
        ]);
        expect(readChecks.every(check => check.authorizationEnabled)).toBe(true);
    });

    it("lists the members of a review's step for reassign, from the snapshot", async () => {
        const { context, listCandidates } = await setup();
        const review = expectOk(
            await context.container.resolve(RequestReviewUseCase).execute(createRequestInput())
        );
        readChecks.length = 0;

        const rows = expectOk(
            await listCandidates.execute({ reviewId: review.id, stepId: "legal" })
        );

        expect(rows).toEqual(EXPECTED_ROWS);
        expect(readChecks.map(check => check.targetRevisionId)).toEqual([
            review.targetRevisionId,
            review.targetRevisionId,
            review.targetRevisionId
        ]);
    });

    it("sorts by display name, not by id", async () => {
        const users = new FakeListUsers([
            { id: "user-a", displayName: "Zoe", teams: [REVIEW_TEAM_ID] },
            { id: "user-b", displayName: "Adam", teams: [REVIEW_TEAM_ID] }
        ]);
        const routing = await createRoutingContext({
            setup: container => {
                container.registerInstance(ListUsersUseCase, users);
            }
        });
        expectOk(
            await routing.context.container
                .resolve(StoreWorkflowUseCase)
                .execute({ workflow: createWorkflowValues(), actor: editor })
        );
        readableUsers.add("user-a");
        readableUsers.add("user-b");

        const rows = expectOk(
            await routing.context.container
                .resolve(ListStepCandidatesUseCase)
                .execute(REQUEST_INPUT)
        );

        expect(rows.map(row => row.displayName)).toEqual(["Adam", "Zoe"]);
    });

    it("gives an exclusion without its own reason the fixed reason", async () => {
        const { listCandidates, settings } = await setup();
        settings.exclusions = [{ userId: "user-anna" }];

        const rows = expectOk(await listCandidates.execute(REQUEST_INPUT));

        expect(rows[0]).toEqual({
            id: "user-anna",
            displayName: "Anna",
            excluded: true,
            excludedReason: "Excluded from reviews."
        });
    });

    it("refuses an unknown workflow, an unbound model, an unknown step and an unknown review", async () => {
        const { listCandidates } = await setup();

        const noWorkflow = await listCandidates.execute({ ...REQUEST_INPUT, workflowId: "nope" });
        const otherModel = await listCandidates.execute({ ...REQUEST_INPUT, model: "cms.recipe" });
        const noStep = await listCandidates.execute({ ...REQUEST_INPUT, stepId: "nope" });
        const noReview = await listCandidates.execute({
            reviewId: "review-missing",
            stepId: "legal"
        });

        expect(noWorkflow.error.code).toBe("Workflows/Workflow/NotFound");
        expect(otherModel.error.code).toBe("Workflows/Review/Validation");
        expect(otherModel.error.message).toBe(
            'The workflow "Article review" is not bound to the model "cms.recipe".'
        );
        expect(noStep.error.code).toBe("Workflows/Review/Validation");
        expect(noStep.error.message).toBe(
            'Step "nope" does not exist in workflow "Article review".'
        );
        expect(noReview.error.code).toBe("Workflows/Review/NotFound");
        expect(readChecks).toEqual([]);
    });

    it("refuses a non-review step for a request", async () => {
        const routing = await createRoutingContext();
        const { container } = routing.context;
        expectOk(
            await container.resolve(WorkflowRepository).create(
                createWorkflowValues({
                    steps: [
                        {
                            ...createReviewStep({ id: "legal", title: "Legal review" }),
                            type: "approval"
                        }
                    ]
                })
            )
        );

        const result = await container.resolve(ListStepCandidatesUseCase).execute(REQUEST_INPUT);

        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe('Step "Legal review" is not a review step.');
        expect(readChecks).toEqual([]);
    });

    it("refuses a request for a step that does not allow picking a reviewer, before any lookup", async () => {
        const routing = await createRoutingContext();
        const { container } = routing.context;
        expectOk(
            await container.resolve(WorkflowRepository).create(
                createWorkflowValues({
                    steps: [createReviewStep({ id: "legal", title: "Legal review" })]
                })
            )
        );

        const result = await container.resolve(ListStepCandidatesUseCase).execute(REQUEST_INPUT);

        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe('Step "Legal review" does not allow picking a reviewer.');
        expect(readChecks).toEqual([]);
    });

    it("refuses reassign candidates for an unknown step, another step and a finished review", async () => {
        const { context, listCandidates, users } = await setup();
        const review = expectOk(
            await context.container.resolve(RequestReviewUseCase).execute(createRequestInput())
        );
        readChecks.length = 0;
        users.calls.length = 0;

        const noStep = await listCandidates.execute({ reviewId: review.id, stepId: "nope" });
        const otherStep = await listCandidates.execute({
            reviewId: review.id,
            stepId: "editorial"
        });
        expectOk(
            await context.container
                .resolve(CancelReviewUseCase)
                .execute({ reviewId: review.id, actor: requester })
        );
        const cancelled = await listCandidates.execute({ reviewId: review.id, stepId: "legal" });

        expect(noStep.error.code).toBe("Workflows/Review/Validation");
        expect(noStep.error.message).toBe('Step "nope" does not exist in this review.');
        expect(otherStep.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(cancelled.error.code).toBe("Workflows/Review/InvalidState");
        expect(users.calls).toEqual([]);
        expect(readChecks).toEqual([]);
    });

    it("lists for reassign only the members of the teams the step was reached with", async () => {
        const routing = await createRoutingContext({
            setup: container => {
                container.register(FakeReviewTargetLoader);
            }
        });
        const { container } = routing.context;
        const legalStep: WorkflowStep = {
            ...createReviewStep({ id: "legal", title: "Legal review" }),
            config: {
                teams: [REVIEW_TEAM_ID, LEGAL_TEAM_ID],
                assignment: {
                    strategy: "none",
                    allowManualPick: false,
                    rules: [
                        {
                            id: "rule-legal",
                            conditions: {},
                            target: { type: "team", id: LEGAL_TEAM_ID }
                        }
                    ]
                }
            }
        };
        expectOk(
            await container
                .resolve(StoreWorkflowUseCase)
                .execute({ workflow: createWorkflowValues({ steps: [legalStep] }), actor: editor })
        );
        const review = expectOk(
            await container.resolve(RequestReviewUseCase).execute(createRequestInput())
        );
        readableUsers.add("user-cara");
        routing.users.calls.length = 0;

        const rows = expectOk(
            await container
                .resolve(ListStepCandidatesUseCase)
                .execute({ reviewId: review.id, stepId: "legal" })
        );

        expect(rows.map(row => row.id)).toEqual(["user-cara"]);
        expect(routing.users.calls).toEqual([
            { input: { where: { teams_in: [LEGAL_TEAM_ID] } }, authorizationEnabled: false }
        ]);
    });

    it("returns the routing dependency error when a lookup fails or a read check throws", async () => {
        const { listCandidates, users } = await setup();
        throwingReadChecks.add("user-bob");

        users.failuresLeft = 1;
        const failed = await listCandidates.execute(REQUEST_INPUT);
        const thrown = await listCandidates.execute(REQUEST_INPUT);

        expect(failed.error.code).toBe("Workflows/Routing/Dependency");
        expect(hasErrorSource(failed.error) && failed.error.source.message).toBe(
            "Storage is not available."
        );
        expect(thrown.error.code).toBe("Workflows/Routing/Dependency");
        expect(hasErrorSource(thrown.error) && thrown.error.source.message).toBe(
            "The read check crashed."
        );
    });
});
