import { describe, expect, it } from "vitest";
import { Container } from "@webiny/feature/api";
import { CreateNotificationUseCase } from "@webiny/notifications/api/features/CreateNotification/index.js";
import { WorkflowModelParserService } from "@webiny/api-workflows/features/model/WorkflowModelParserService/index.js";
import {
    ReviewApprovedEventHandler,
    ReviewStepApprovedEventHandler
} from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { ReviewStepRejectedEventHandler } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import type { Actor, ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import { WorkflowApprovedNotificationHandler } from "~/api/workflows/WorkflowApprovedNotificationHandler.js";
import { WorkflowRejectedNotificationHandler } from "~/api/workflows/WorkflowRejectedNotificationHandler.js";

const REQUESTER: Actor = {
    type: "user",
    id: "user-requester",
    displayName: "Rita Requester",
    identityType: "admin"
};
const REVIEWER: Actor = {
    type: "user",
    id: "user-reviewer",
    displayName: "Rob Reviewer",
    identityType: "admin"
};
// An AI or automation actor carries the requester's id and name (D58).
const AI: Actor = { type: "ai", id: REQUESTER.id, displayName: REQUESTER.displayName };
const AUTOMATION: Actor = {
    type: "automation",
    id: REQUESTER.id,
    displayName: REQUESTER.displayName
};

const review = {
    id: "review-1",
    model: "cms.article",
    targetId: "entry-1",
    title: "Spring launch",
    createdBy: REQUESTER,
    steps: [
        { id: "editorial", title: "Editorial check" },
        { id: "legal", title: "Legal sign-off" }
    ]
} as unknown as ReviewData;

const setup = () => {
    const created: CreateNotificationUseCase.Input[] = [];
    const container = new Container();
    container.registerInstance(CreateNotificationUseCase, {
        execute: async (input: CreateNotificationUseCase.Input) => {
            created.push(input);
        }
    } as unknown as CreateNotificationUseCase.Interface);
    container.registerInstance(WorkflowModelParserService, {
        parse: () => ({ app: "cms", modelId: "article" })
    } as unknown as WorkflowModelParserService.Interface);
    container.register(WorkflowApprovedNotificationHandler);
    container.register(WorkflowRejectedNotificationHandler);
    const [approved] = container.resolveAll(ReviewApprovedEventHandler);
    const [rejected] = container.resolveAll(ReviewStepRejectedEventHandler);
    const approve = (actor: Actor) => {
        const fact = {
            type: "approved" as const,
            occurredOn: "2026-10-25T10:00:00.000Z",
            actor
        };
        return approved.handle({
            payload: { review, fact }
        } as ReviewApprovedEventHandler.Event);
    };
    const reject = (actor: Actor, comment: string | null = "Needs work.") => {
        const fact = {
            type: "stepRejected" as const,
            occurredOn: "2026-10-25T10:00:00.000Z",
            actor,
            change: {
                stepId: "legal",
                fromState: "inReview" as const,
                toState: "rejected" as const
            },
            comment
        };
        return rejected.handle({
            payload: { review, fact }
        } as ReviewStepRejectedEventHandler.Event);
    };
    return { container, created, approve, reject };
};

describe("review decision inbox notifications", () => {
    it("only registers a review-level approval handler, no per-step one", () => {
        const { container } = setup();

        expect(container.resolveAll(ReviewStepApprovedEventHandler)).toEqual([]);
        expect(container.resolveAll(ReviewApprovedEventHandler)).toHaveLength(1);
    });

    it("tells the requester that a reviewer approved or rejected, naming the reviewer", async () => {
        const { created, approve, reject } = setup();

        await approve(REVIEWER);
        await reject(REVIEWER);

        expect(created).toEqual([
            expect.objectContaining({
                recipientId: REQUESTER.id,
                type: "approved",
                actor: { id: REVIEWER.id, displayName: "Rob Reviewer", type: "admin" },
                title: "Spring launch",
                snippet: "All steps approved. It’s ready to publish.",
                link: { app: "cms", contentId: "article:entry-1" }
            }),
            expect.objectContaining({
                recipientId: REQUESTER.id,
                type: "rejected",
                actor: { id: REVIEWER.id, displayName: "Rob Reviewer", type: "admin" },
                title: "Spring launch",
                snippet:
                    "Rob Reviewer: “Needs work.”. Create a new revision to fix it, then request a new review.",
                link: { app: "cms", contentId: "article:entry-1" }
            })
        ]);
    });

    it("tells the requester when an AI or automation step decides, naming the step (R149, D107)", async () => {
        const { created, approve, reject } = setup();

        await approve(AI);
        await reject(AUTOMATION);
        await reject(AI, null);

        expect(
            created.map(item => ({
                type: item.type,
                recipientId: item.recipientId,
                actor: item.actor,
                snippet: item.snippet
            }))
        ).toEqual([
            {
                type: "approved",
                recipientId: REQUESTER.id,
                actor: { id: REQUESTER.id, displayName: "Legal sign-off", type: "ai" },
                snippet: "All steps approved. It’s ready to publish."
            },
            {
                type: "rejected",
                recipientId: REQUESTER.id,
                actor: { id: REQUESTER.id, displayName: "Legal sign-off", type: "automation" },
                snippet:
                    "Legal sign-off: “Needs work.”. Create a new revision to fix it, then request a new review."
            },
            {
                type: "rejected",
                recipientId: REQUESTER.id,
                actor: { id: REQUESTER.id, displayName: "Legal sign-off", type: "ai" },
                snippet:
                    "Rejected at Legal sign-off. Create a new revision to fix it, then request a new review."
            }
        ]);
    });

    it("names the person in a rejection without a comment (D126)", async () => {
        const { created, reject } = setup();

        await reject(REVIEWER, null);

        expect(created[0]?.snippet).toBe(
            "Rejected at Legal sign-off by Rob Reviewer. Create a new revision to fix it, then request a new review."
        );
    });

    it("does not tell a requester about a step they decided themselves", async () => {
        const { created, approve, reject } = setup();

        await approve(REQUESTER);
        await reject(REQUESTER);

        expect(created).toEqual([]);
    });
});
