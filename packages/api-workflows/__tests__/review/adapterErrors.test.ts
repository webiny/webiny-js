import { describe, expect, it } from "vitest";
import {
    ReviewActiveOnTrashError,
    ReviewPublishBlockedError,
    ReviewTargetLockedError
} from "~/domain/review/errors.js";

describe("Adapter errors", () => {
    it("explains an update blocked by an active review (D62, D80)", () => {
        const error = new ReviewTargetLockedError({
            reviewId: "review-1",
            model: "cms.article",
            targetRevisionId: "article-1#0001",
            reviewState: "approved",
            action: "update"
        });

        expect(error.code).toBe("Workflows/Review/TargetLocked");
        expect(error.message).toBe(
            'This content cannot be changed while its review is active (review state "approved"). Create a new revision to make changes.'
        );
        expect(error.data).toEqual({
            reviewId: "review-1",
            model: "cms.article",
            targetRevisionId: "article-1#0001",
            reviewState: "approved",
            action: "update"
        });
    });

    it("explains a move blocked by an in-progress review (D84)", () => {
        const error = new ReviewTargetLockedError({
            reviewId: "review-1",
            model: "wb.page",
            targetRevisionId: "page-1#0002",
            reviewState: "inProgress",
            action: "move"
        });

        expect(error.message).toBe(
            "This content cannot be moved to another folder while its review is in progress."
        );
    });

    it("explains a publish without an approved review (D79)", () => {
        const missing = new ReviewPublishBlockedError({
            model: "cms.article",
            targetRevisionId: "article-1#0001",
            workflowId: "workflow-1",
            reviewState: null
        });
        const inProgress = new ReviewPublishBlockedError({
            model: "cms.article",
            targetRevisionId: "article-1#0001",
            workflowId: "workflow-1",
            reviewState: "inProgress"
        });

        expect(missing.code).toBe("Workflows/Review/PublishBlocked");
        expect(missing.message).toBe(
            "This content can only be published after its review is approved. Request a review first."
        );
        expect(inProgress.message).toBe(
            'This content can only be published after its review is approved. The review is "inProgress".'
        );
        expect(inProgress.data).toEqual({
            model: "cms.article",
            targetRevisionId: "article-1#0001",
            workflowId: "workflow-1",
            reviewState: "inProgress"
        });
    });

    it("explains a trash or delete refused while a review is in progress (D134)", () => {
        const review = {
            reviewId: "review-1",
            model: "cms.article",
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article 1",
            stepPosition: 1,
            stepCount: 2,
            stepName: "Legal review"
        };
        const trash = new ReviewActiveOnTrashError({
            model: "cms.article",
            action: "trash",
            reviews: [review]
        });
        const remove = new ReviewActiveOnTrashError({
            model: "cms.article",
            action: "delete",
            reviews: [review]
        });

        expect(trash.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(trash.message).toBe(
            "This content has a review in progress. Trashing it cancels the review."
        );
        expect(remove.message).toBe(
            "This content has a review in progress. Deleting it cancels the review."
        );
        expect(trash.data).toEqual({
            model: "cms.article",
            action: "trash",
            reviews: [review]
        });
    });
});
