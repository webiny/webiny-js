import { beforeEach, describe, expect, it } from "vitest";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import {
    createRoutingContext,
    LEGAL_TEAM_ID,
    resetRoutingFakes
} from "~tests/__helpers/routingContext.js";
import { FakeReviewTargetLoader } from "~tests/__helpers/FakeReviewTargetLoader.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import {
    readableUsers,
    readChecks,
    throwingReadChecks
} from "~tests/__helpers/FakeReviewTargetReadAccess.js";
import { createRequestInput } from "~tests/__helpers/reviewContext.js";
import {
    createReviewStep,
    createWorkflowValues,
    editor,
    expectOk,
    requester,
    REVIEW_TEAM_ID,
    reviewer
} from "~tests/__helpers/fixtures.js";
import type { Actor } from "~/domain/review/types.js";
import type { WorkflowStep } from "~/domain/workflow/types.js";
import type { ReviewStepReassignedEvent } from "~/features/review/events.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { StartReviewStepUseCase } from "~/features/review/StartReviewStep/index.js";
import { CancelReviewUseCase } from "~/features/review/CancelReview/index.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import { ReassignReviewStepUseCase } from "~/features/review/ReassignReviewStep/index.js";

/** Holds `workflows.reassign` in the wrapper; the engine only records it (D132). */
const manager: Actor = {
    type: "user",
    id: "user-manager",
    displayName: "Mona Manager",
    identityType: "admin"
};

const ANNA_OWNER: Actor = {
    type: "user",
    id: "user-anna",
    displayName: "Anna",
    identityType: "admin"
};

const setup = async () => {
    const routing = await createRoutingContext({
        setup: container => {
            container.register(FakeReviewTargetLoader);
            container.registerDecorator(RecordingEventPublisher);
        }
    });
    const { container } = routing.context;
    expectOk(
        await container
            .resolve(StoreWorkflowUseCase)
            .execute({ workflow: createWorkflowValues(), actor: editor })
    );
    const review = expectOk(
        await container.resolve(RequestReviewUseCase).execute(createRequestInput())
    );
    recordedEvents.length = 0;
    readChecks.length = 0;
    routing.users.calls.length = 0;
    return {
        ...routing,
        review,
        reassign: container.resolve(ReassignReviewStepUseCase),
        listRecords: async () => {
            const listed = await container
                .resolve(AssignmentRepository)
                .list({ where: { reviewId: review.id } });
            return expectOk(listed).items;
        }
    };
};

describe("ReassignReviewStepUseCase (spec 5.1, R112, R119)", () => {
    beforeEach(() => {
        resetRoutingFakes();
    });

    it("reassigns an awaiting step to a valid candidate and writes a reassign record", async () => {
        const { reassign, review, users, listRecords } = await setup();
        readableUsers.add("user-anna");

        const reassigned = expectOk(
            await reassign.execute({
                reviewId: review.id,
                stepId: "legal",
                userId: "user-anna",
                actor: manager
            })
        );

        expect(reassigned).toMatchObject({
            currentStepState: "inReview",
            currentOwnerId: "user-anna"
        });
        expect(reassigned.steps[0]).toMatchObject({
            state: "inReview",
            owner: ANNA_OWNER,
            assignmentSource: "reassign",
            assignment: { source: "reassign", by: manager }
        });
        expect(users.calls).toEqual([
            {
                input: { where: { id_in: ["user-anna"], teams_in: [REVIEW_TEAM_ID] } },
                authorizationEnabled: false
            }
        ]);
        expect(readChecks).toEqual([
            {
                userId: "user-anna",
                scope: "target",
                targetRevisionId: review.targetRevisionId,
                folderId: null,
                authorizationEnabled: true
            }
        ]);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepReassigned"]);
        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepReassigned"
        ) as ReviewStepReassignedEvent;
        expect(event.payload.fact).toMatchObject({
            actor: manager,
            owner: ANNA_OWNER,
            previousOwner: null
        });
        const record = (await listRecords()).find(item => item.source === "reassign");
        expect(record).toMatchObject({
            kind: "outcome",
            stepId: "legal",
            userId: "user-anna",
            ruleId: null,
            by: manager,
            reason: null,
            assignedOn: reassigned.steps[0].startedOn
        });
    });

    it("reassigns a step in review away from its owner", async () => {
        const { context, reassign, review, listRecords } = await setup();
        const started = expectOk(
            await context.container.resolve(StartReviewStepUseCase).execute({
                reviewId: review.id,
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID]
            })
        );
        recordedEvents.length = 0;
        readableUsers.add("user-bob");

        const reassigned = expectOk(
            await reassign.execute({
                reviewId: review.id,
                stepId: "legal",
                userId: "user-bob",
                actor: manager
            })
        );

        expect(reassigned.steps[0].owner).toEqual({
            type: "user",
            id: "user-bob",
            displayName: "Bob",
            identityType: "admin"
        });
        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepReassigned"
        ) as ReviewStepReassignedEvent;
        expect(event.payload.fact.previousOwner).toEqual(reviewer);
        expect(reassigned.steps[0].startedOn).toBe(started.steps[0].startedOn);
        const record = (await listRecords()).find(item => item.source === "reassign");
        expect(record).toMatchObject({
            kind: "outcome",
            stepId: "legal",
            userId: "user-bob",
            by: manager
        });
    });

    it("refuses an invalid user with the fixed reason and saves nothing (R112)", async () => {
        const { context, reassign, review, settings } = await setup();
        readableUsers.add("user-anna");
        readableUsers.add("user-cara");
        readableUsers.add("user-dan");
        readableUsers.add(requester.id);
        settings.exclusions = [{ userId: "user-cara", reason: "On leave" }];
        const attempt = (userId: string) => {
            return reassign.execute({
                reviewId: review.id,
                stepId: "legal",
                userId,
                actor: manager
            });
        };

        const byRequester = await attempt(requester.id);
        const byOutsider = await attempt("user-dan");
        const byExcluded = await attempt("user-cara");
        const byUnreadable = await attempt("user-bob");

        expect(byRequester.error.code).toBe("Workflows/Review/ReassignTargetInvalid");
        expect(byRequester.error.data).toEqual({
            reviewId: review.id,
            stepId: "legal",
            userId: requester.id,
            reason: "The requester cannot review."
        });
        expect(byOutsider.error.data).toMatchObject({
            reason: "Not a member of the step's teams."
        });
        expect(byExcluded.error.data).toMatchObject({ reason: "Excluded from reviews." });
        expect(byExcluded.error.message).toBe(
            "This user cannot review this step: Excluded from reviews."
        );
        expect(byUnreadable.error.data).toMatchObject({ reason: "Cannot read this content." });
        expect(workflowEventTypes()).toEqual([]);
        const stored = expectOk(
            await context.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.steps[0]).toMatchObject({ state: "awaiting", owner: null });
    });

    it("refuses the current owner", async () => {
        const { reassign, review } = await setup();
        readableUsers.add("user-anna");
        const input = { reviewId: review.id, stepId: "legal", userId: "user-anna", actor: manager };
        expectOk(await reassign.execute(input));

        const again = await reassign.execute(input);

        expect(again.error.code).toBe("Workflows/Review/AlreadyOwner");
    });

    it("refuses the current owner before any lookup, even when they can no longer review (R126)", async () => {
        const { reassign, review, settings, users } = await setup();
        readableUsers.add("user-anna");
        const input = { reviewId: review.id, stepId: "legal", userId: "user-anna", actor: manager };
        expectOk(await reassign.execute(input));
        settings.exclusions = [{ userId: "user-anna", reason: "On leave" }];
        readableUsers.delete("user-anna");
        users.calls.length = 0;
        readChecks.length = 0;

        const again = await reassign.execute(input);

        expect(again.error.code).toBe("Workflows/Review/AlreadyOwner");
        expect(users.calls).toEqual([]);
        expect(readChecks).toEqual([]);
    });

    it("validates the user against the teams the step was reached with, not all its teams", async () => {
        const routing = await createRoutingContext({
            setup: container => {
                container.register(FakeReviewTargetLoader);
            }
        });
        const { container } = routing.context;
        const toLegal = {
            id: "rule-legal",
            conditions: {},
            target: { type: "team" as const, id: LEGAL_TEAM_ID }
        };
        const legalStep: WorkflowStep = {
            ...createReviewStep({ id: "legal", title: "Legal review" }),
            config: {
                teams: [REVIEW_TEAM_ID, LEGAL_TEAM_ID],
                assignment: { strategy: "none", allowManualPick: false, rules: [toLegal] }
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
        expect(review.steps[0].candidateTeamIds).toEqual([LEGAL_TEAM_ID]);
        readableUsers.add("user-anna");

        const result = await container.resolve(ReassignReviewStepUseCase).execute({
            reviewId: review.id,
            stepId: "legal",
            userId: "user-anna",
            actor: manager
        });

        expect(result.error.code).toBe("Workflows/Review/ReassignTargetInvalid");
        expect(result.error.data).toMatchObject({ reason: "Not a member of the step's teams." });
    });

    it("checks the review state before any lookup", async () => {
        const { context, reassign, review, users } = await setup();
        readableUsers.add("user-anna");

        const otherStep = await reassign.execute({
            reviewId: review.id,
            stepId: "editorial",
            userId: "user-anna",
            actor: manager
        });
        expectOk(
            await context.container
                .resolve(CancelReviewUseCase)
                .execute({ reviewId: review.id, actor: requester })
        );
        const cancelled = await reassign.execute({
            reviewId: review.id,
            stepId: "legal",
            userId: "user-anna",
            actor: manager
        });
        const missing = await reassign.execute({
            reviewId: "review-missing",
            stepId: "legal",
            userId: "user-anna",
            actor: manager
        });

        expect(otherStep.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(cancelled.error.code).toBe("Workflows/Review/InvalidState");
        expect(missing.error.code).toBe("Workflows/Review/NotFound");
        expect(users.calls).toEqual([]);
        expect(readChecks).toEqual([]);
    });

    it("returns the routing dependency error when a lookup fails or a read check throws", async () => {
        const { reassign, review, users } = await setup();
        throwingReadChecks.add("user-anna");
        const input = { reviewId: review.id, stepId: "legal", userId: "user-anna", actor: manager };

        users.failuresLeft = 1;
        const failed = await reassign.execute(input);
        const thrown = await reassign.execute(input);

        expect(failed.error.code).toBe("Workflows/Routing/Dependency");
        expect(hasErrorSource(failed.error) && failed.error.source.message).toBe(
            "Storage is not available."
        );
        expect(thrown.error.code).toBe("Workflows/Routing/Dependency");
        expect(hasErrorSource(thrown.error) && thrown.error.source.message).toBe(
            "The read check crashed."
        );
        expect(workflowEventTypes()).toEqual([]);
    });
});
