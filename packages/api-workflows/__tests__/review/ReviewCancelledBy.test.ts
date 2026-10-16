import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { ARTICLE_MODEL } from "~tests/__helpers/fixtures.js";
import { createRequestedReview } from "~tests/__helpers/fixtures.js";
import { createStartedReview } from "~tests/__helpers/fixtures.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { otherReviewer } from "~tests/__helpers/fixtures.js";
import { REVIEW_TEAM_ID } from "~tests/__helpers/fixtures.js";
import { requester } from "~tests/__helpers/fixtures.js";
import { reviewer } from "~tests/__helpers/fixtures.js";
import { toSaveData } from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewModelProvider } from "~/domain/review/abstractions/ReviewModelProvider.js";
import { ReviewEntryMapper } from "~/features/review/shared/ReviewEntryMapper.js";
import type { ReviewEntryValues } from "~/features/review/shared/ReviewEntryMapper.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import { CancelReviewUseCase } from "~/features/review/CancelReview/index.js";
import { CancelTargetReviewsUseCase } from "~/features/review/CancelTargetReviews/index.js";

const LATER = "2026-10-09T11:00:00.000Z";

interface ObjectFieldChild {
    fieldId: string;
}

interface ObjectFieldSettings {
    fields: ObjectFieldChild[];
}

describe("Review.cancel stores who cancelled (R252)", () => {
    it("sets cancelledBy to a copy of the cancelling actor", () => {
        const review = createStartedReview();

        expectOk(review.cancel({ actor: otherReviewer, now: LATER }));

        const data = review.toData();
        expect(data.state).toBe("cancelled");
        expect(data.cancelledBy).toEqual(otherReviewer);
        expect(data.cancelledBy).not.toBe(otherReviewer);
    });

    it("leaves cancelledBy null for a review that is in progress, approved or rejected", () => {
        const inProgress = createStartedReview();
        const rejected = createStartedReview();
        expectOk(
            rejected.reject({
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                comment: "Needs another pass.",
                now: LATER
            })
        );

        const approved = createStartedReview();
        expectOk(
            approved.approve({
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                comment: null,
                now: LATER
            })
        );

        expect(inProgress.toData().cancelledBy).toBeNull();
        expect(approved.toData().cancelledBy).toBeNull();
        expect(rejected.toData().cancelledBy).toBeNull();
    });

    it("keeps the first actor when a second cancel is refused (a cancelled review is terminal, D75)", () => {
        const review = createStartedReview();
        expectOk(review.cancel({ actor: requester, now: LATER }));

        const second = review.cancel({ actor: otherReviewer, now: LATER });

        expect(second.isFail()).toBe(true);
        expect(review.toData().cancelledBy).toEqual(requester);
    });
});

describe("the review model and cancelledBy (A91)", () => {
    it("has an optional object field written like the requester object", async () => {
        const { context } = await createContextHandler();
        const model = await context.container.resolve(ReviewModelProvider).get();

        const field = model.fields.find(candidate => candidate.fieldId === "cancelledBy");
        const requesterField = model.fields.find(candidate => candidate.fieldId === "requester");

        expect(field?.type).toBe("object");
        const settings = field?.settings as ObjectFieldSettings | undefined;
        const requesterSettings = requesterField?.settings as ObjectFieldSettings | undefined;
        expect(settings?.fields.map(child => child.fieldId)).toEqual([
            "type",
            "id",
            "displayName",
            "identityType"
        ]);
        expect(settings?.fields.map(child => child.fieldId)).toEqual(
            requesterSettings?.fields.map(child => child.fieldId)
        );
        // Optional: it carries the same validation as the (optional-by-default) requester object.
        expect(field?.validation).toEqual(requesterField?.validation);
    });
});

describe("cancelledBy through the use cases and the storage (R252, A91)", () => {
    const setup = async () => {
        const { context } = await createContextHandler();
        const repository = context.container.resolve(ReviewRepository);
        return {
            context,
            repository,
            cancelReview: context.container.resolve(CancelReviewUseCase),
            cancelTargetReviews: context.container.resolve(CancelTargetReviewsUseCase),
            getReview: context.container.resolve(GetReviewUseCase)
        };
    };

    it("stores the requester's cancel, reads it back and keeps it through a re-save", async () => {
        const { repository, cancelReview, getReview } = await setup();
        expectOk(await repository.save(toSaveData(createRequestedReview({ id: "review-1" }))));

        const cancelled = expectOk(
            await cancelReview.execute({ reviewId: "review-1", actor: requester })
        );
        const read = expectOk(await getReview.execute({ id: "review-1" }));
        expectOk(await repository.save(read));
        const resaved = expectOk(await repository.get("review-1"));

        expect(cancelled.state).toBe("cancelled");
        expect(cancelled.cancelledBy).toEqual(requester);
        expect(read.cancelledBy).toEqual(requester);
        expect(resaved.cancelledBy).toEqual(requester);
    });

    it("records another user, such as one with reassign, who cancels a review they did not request", async () => {
        const { repository, cancelReview, getReview } = await setup();
        expectOk(await repository.save(toSaveData(createRequestedReview({ id: "review-1" }))));

        expectOk(await cancelReview.execute({ reviewId: "review-1", actor: otherReviewer }));

        const read = expectOk(await getReview.execute({ id: "review-1" }));
        expect(read.cancelledBy).toEqual(otherReviewer);
        expect(read.createdBy.id).toBe(requester.id);
    });

    it("records the caller of the delete-time cancel and stores no reason on the review", async () => {
        const { repository, cancelTargetReviews } = await setup();
        expectOk(await repository.save(toSaveData(createRequestedReview({ id: "review-1" }))));

        const cancelled = expectOk(
            await cancelTargetReviews.execute({
                model: ARTICLE_MODEL,
                targetId: "article-1",
                actor: otherReviewer,
                reason: "content trashed"
            })
        );

        expect(cancelled.map(review => review.id)).toEqual(["review-1"]);
        const read = expectOk(await repository.get("review-1"));
        expect(read.cancelledBy).toEqual(otherReviewer);
        expect(Object.keys(read.cancelledBy ?? {}).sort()).toEqual(["displayName", "id", "type"]);
        expect(JSON.stringify(read)).not.toContain("content trashed");
    });

    it("reads null for an in-progress review and for a cancelled review stored before the field existed", async () => {
        const { context, repository } = await setup();
        expectOk(await repository.save(toSaveData(createRequestedReview({ id: "review-1" }))));
        const model = await context.container.resolve(ReviewModelProvider).get();
        const legacy: Partial<ReviewEntryValues> = {
            ...ReviewEntryMapper.toValues(toSaveData(createRequestedReview({ id: "review-2" }))),
            state: "cancelled",
            isActive: false
        };
        delete legacy.cancelledBy;
        expectOk(
            await context.container
                .resolve(CreateEntryUseCase)
                .execute(model, { id: "review-legacy", values: legacy })
        );

        const inProgress = expectOk(await repository.get("review-1"));
        const legacyRead = expectOk(await repository.get("review-legacy"));

        expect(inProgress.state).toBe("inProgress");
        expect(inProgress.cancelledBy).toBeNull();
        expect(legacyRead.state).toBe("cancelled");
        expect(legacyRead.cancelledBy).toBeNull();
    });
});
