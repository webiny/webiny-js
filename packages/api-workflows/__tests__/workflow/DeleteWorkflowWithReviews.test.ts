import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    createRequestedReview,
    createStartedReview,
    createWorkflowValues,
    expectOk,
    poolResolution,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { DeleteWorkflowUseCase } from "~/features/workflow/DeleteWorkflow/index.js";

const LATER = "2026-10-09T11:00:00.000Z";

describe("Delete workflow with reviews", () => {
    it("blocks deleting a workflow while reviews are in progress", async () => {
        const { context } = await createContextHandler();
        const workflow = expectOk(
            await context.container
                .resolve(StoreWorkflowUseCase)
                .execute({ workflow: createWorkflowValues() })
        );
        const repository = context.container.resolve(ReviewRepository);
        const deleteWorkflow = context.container.resolve(DeleteWorkflowUseCase);

        const first = createRequestedReview({ id: "review-1", workflow });
        expectOk(await repository.save(toSaveData(first)));
        const second = createStartedReview({
            id: "review-2",
            targetRevisionId: "article-2#0001",
            workflow
        });
        expectOk(await repository.save(toSaveData(second)));

        // An approved review stays `isActive: true` but is finished, so it never blocks (D81).
        const approved = createStartedReview({
            id: "review-3",
            targetRevisionId: "article-3#0001",
            workflow
        });
        const decide = (stepId: string) => ({
            stepId,
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID],
            comment: null,
            now: LATER
        });
        expectOk(approved.approve(decide("legal")));
        expectOk(approved.reach({ resolution: poolResolution(), actor: reviewer, now: LATER }));
        expectOk(
            approved.start({
                stepId: "editorial",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                now: LATER
            })
        );
        expectOk(approved.approve(decide("editorial")));
        const approvedData = expectOk(await repository.save(toSaveData(approved)));
        expect(approvedData).toMatchObject({ state: "approved", isActive: true });

        const blocked = await deleteWorkflow.execute({ id: workflow.id });

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Workflow/HasActiveReviews");
        expect(blocked.error.data).toEqual({ count: 2 });

        // Finished reviews (cancelled, rejected) do not block the delete (D81).
        expectOk(first.cancel({ actor: requester, now: LATER }));
        expectOk(await repository.save(toSaveData(first)));
        expectOk(
            second.reject({
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                comment: "Not this time.",
                now: LATER
            })
        );
        expectOk(await repository.save(toSaveData(second)));

        const deleted = await deleteWorkflow.execute({ id: workflow.id });

        expect(deleted.isOk()).toBe(true);
    });
});
