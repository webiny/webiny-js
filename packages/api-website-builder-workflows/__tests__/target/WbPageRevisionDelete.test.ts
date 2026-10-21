import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { DeletePageRevisionUseCase } from "@webiny/api-website-builder/features/pages/DeletePageRevision/index.js";
import { DeletePageUseCase } from "@webiny/api-website-builder/features/pages/DeletePage/index.js";
import { TrashPageUseCase } from "@webiny/api-website-builder/features/pages/TrashPage/index.js";
import { CreatePageRevisionFromUseCase } from "@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { captureLoggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { failDeleteTargetReviews } from "~tests/__helpers/FailingDeleteTargetReviews.js";
import { throwDeleteTargetReviews } from "~tests/__helpers/FailingDeleteTargetReviews.js";
import { failGetBoundWorkflow } from "~tests/__helpers/FailingGetBoundWorkflow.js";
import { failListTargetReviews } from "~tests/__helpers/FailingListTargetReviews.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { expectOk } from "~tests/__helpers/pages.js";
import { approvePageReview } from "~tests/__helpers/engine.js";
import { cancelPageReview } from "~tests/__helpers/engine.js";
import { requestPageReview } from "~tests/__helpers/engine.js";
import { storeWbWorkflow } from "~tests/__helpers/engine.js";

const CLEANUP_FAILURE =
    "Could not delete the reviews of a deleted page revision; they are left orphaned.";

/** Page A with revision 1 under review and revision 2 without one, on a bound pages workflow. */
const createScenario = async (legacyPlugins: unknown[] = []) => {
    const context = await createUserContext({ legacyPlugins });
    await storeWbWorkflow(context);
    const page = await createPage(context, { title: "Page A" });
    const review = await requestPageReview(context, page);
    const second = expectOk(
        await context.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
    );
    return { context, page, review, second };
};

describe("WB revision delete with a review in progress (D134, R235)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("refuses to delete the revision under review with the shared error code and data", async () => {
        const { context, page, review } = await createScenario();
        const deleteRevision = context.container.resolve(DeletePageRevisionUseCase);

        // The before event is published outside a try, so the handler's error rejects (A26).
        const error = await deleteRevision.execute({ id: page.id }).catch(thrown => thrown);

        expect(error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(error.data).toEqual({
            model: "wb.page",
            action: "delete",
            reviews: [
                {
                    reviewId: review.id,
                    model: "wb.page",
                    targetId: page.entryId,
                    targetRevisionId: page.id,
                    title: "Page A",
                    stepPosition: 1,
                    stepCount: 1,
                    stepName: "Step 1"
                }
            ]
        });
    });

    it("does not block a revision that has no review, and keeps the other revision's review", async () => {
        const { context, page, review, second } = await createScenario();

        const deleted = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: second.id });

        expect(deleted.isOk()).toBe(true);
        const stored = expectOk(
            await context.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
        expect(stored.targetRevisionId).toBe(page.id);
    });

    it("does not block when no workflow is bound to pages", async () => {
        const context = await createUserContext();
        const page = await createPage(context, { title: "Page A" });
        const second = expectOk(
            await context.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
        );

        const deleted = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: second.id });

        expect(deleted.isOk()).toBe(true);
    });

    it("refuses the delete when the review lookup fails on a bound pages workflow (fail closed)", async () => {
        const context = await createUserContext({ legacyPlugins: [failListTargetReviews] });
        const page = await createPage(context, { title: "Page A" });
        const second = expectOk(
            await context.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
        );
        await storeWbWorkflow(context);

        await expect(
            context.container.resolve(DeletePageRevisionUseCase).execute({ id: second.id })
        ).rejects.toMatchObject({ code: "Workflows/Review/Persistence" });
    });

    it("refuses the delete when the bound workflow lookup fails (fail closed)", async () => {
        const context = await createUserContext({ legacyPlugins: [failGetBoundWorkflow] });
        const page = await createPage(context, { title: "Page A" });
        const second = expectOk(
            await context.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
        );

        await expect(
            context.container.resolve(DeletePageRevisionUseCase).execute({ id: second.id })
        ).rejects.toMatchObject({ code: "Workflows/Workflow/Persistence" });
    });

    it("deletes the reviews of the deleted revision only", async () => {
        const { context, page, review, second } = await createScenario();
        const secondReview = await requestPageReview(context, second);
        await approvePageReview(context, review);
        const getReview = context.container.resolve(GetReviewUseCase);

        const deleted = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: page.id });

        expect(deleted.isOk()).toBe(true);
        expect((await getReview.execute({ id: review.id })).error.code).toBe(
            "Workflows/Review/NotFound"
        );
        expect(expectOk(await getReview.execute({ id: secondReview.id })).state).toBe("inProgress");
    });

    it("keeps the delete when the review cleanup fails, and logs it (R81)", async () => {
        const { context, page, review } = await createScenario([
            captureLoggedErrors,
            failDeleteTargetReviews
        ]);
        await cancelPageReview(context, review);

        const deleted = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: page.id });

        expect(deleted.isOk()).toBe(true);
        expect(loggedErrors).toEqual([
            {
                message: CLEANUP_FAILURE,
                fields: expect.objectContaining({ model: "wb.page", targetRevisionId: page.id })
            }
        ]);
        const orphan = await context.container.resolve(GetReviewUseCase).execute({ id: review.id });
        expect(orphan.isOk()).toBe(true);
    });

    it("keeps the delete when the review cleanup throws, and logs it (R81)", async () => {
        const { context, page, review } = await createScenario([
            captureLoggedErrors,
            throwDeleteTargetReviews
        ]);
        await cancelPageReview(context, review);

        const deleted = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: page.id });

        expect(deleted.isOk()).toBe(true);
        expect(loggedErrors).toEqual([
            {
                message: CLEANUP_FAILURE,
                fields: expect.objectContaining({ model: "wb.page", targetRevisionId: page.id })
            }
        ]);
    });

    it("also refuses the only revision with one error, from the revision block", async () => {
        const context = await createUserContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await requestPageReview(context, page);
        const deleteRevision = context.container.resolve(DeletePageRevisionUseCase);

        const error = await deleteRevision.execute({ id: page.id }).catch(thrown => thrown);

        expect(error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(error.data.action).toBe("delete");
        expect(error.data.reviews).toHaveLength(1);
        expect(error.data.reviews[0].reviewId).toBe(review.id);
        // The revision block runs first and its error ends the before phase, so the page-delete
        // block (`BlockPageDeleteWhileInReview`) is not reached behind it here; it keeps guarding
        // the page-delete event on its own (`WbPageTrashAndDelete.test.ts`).
    });

    it("deletes the only revision after the review is cancelled, and removes its reviews with the page", async () => {
        const context = await createUserContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await requestPageReview(context, page);
        await cancelPageReview(context, review);

        const deleted = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: page.id });

        expect(deleted.isOk()).toBe(true);
        const gone = await context.container.resolve(GetReviewUseCase).execute({ id: review.id });
        expect(gone.error.code).toBe("Workflows/Review/NotFound");
    });

    it("leaves the page delete rules untouched: a trashed page still deletes as before", async () => {
        const context = await createUserContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await approvePageReview(context, await requestPageReview(context, page));
        expectOk(await context.container.resolve(TrashPageUseCase).execute({ id: page.id }));

        expectOk(await context.container.resolve(DeletePageUseCase).execute({ id: page.id }));

        const gone = await context.container.resolve(GetReviewUseCase).execute({ id: review.id });
        expect(gone.error.code).toBe("Workflows/Review/NotFound");
    });
});
