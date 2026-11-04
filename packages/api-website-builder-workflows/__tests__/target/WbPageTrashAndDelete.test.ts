import { beforeEach, describe, expect, it } from "vitest";
import { TrashPageUseCase } from "@webiny/api-website-builder/features/pages/TrashPage/index.js";
import {
    DeletePageUseCase,
    PageBeforeDeleteEventHandler
} from "@webiny/api-website-builder/features/pages/DeletePage/index.js";
import { PageBeforeDeleteEvent } from "@webiny/api-website-builder/features/pages/DeletePage/events.js";
import { CreatePageRevisionFromUseCase } from "@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    failDeleteTargetReviews,
    throwDeleteTargetReviews
} from "~tests/__helpers/FailingDeleteTargetReviews.js";
import { failGetBoundWorkflow } from "~tests/__helpers/FailingGetBoundWorkflow.js";
import { failListTargetReviews } from "~tests/__helpers/FailingListTargetReviews.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import {
    approvePageReview,
    cancelPageReview,
    requestPageReview,
    storeWbWorkflow
} from "~tests/__helpers/engine.js";

describe("WB trash and delete with a review in progress (D134)", () => {
    it("refuses to trash a page with a review in progress, and trashes it after cancel", async () => {
        const context = await createUserContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await requestPageReview(context, page);
        const trashPage = context.container.resolve(TrashPageUseCase);

        // WB publishes the before event outside a try, so the handler's error rejects (A26).
        await expect(trashPage.execute({ id: page.id })).rejects.toMatchObject({
            code: "Workflows/Review/ActiveReviewOnTrash",
            data: {
                model: "wb.page",
                action: "trash",
                reviews: [{ reviewId: review.id, targetId: page.entryId, title: "Page A" }]
            }
        });
        await cancelPageReview(context, review);
        const trashed = await trashPage.execute({ id: page.id });

        expect(trashed.isOk()).toBe(true);
    });

    it("refuses the trash when the review lookup fails on a bound pages workflow (fail closed)", async () => {
        const context = await createUserContext({
            legacyPlugins: [failListTargetReviews]
        });
        const page = await createPage(context, { title: "Page A" });
        await storeWbWorkflow(context);

        await expect(
            context.container.resolve(TrashPageUseCase).execute({ id: page.id })
        ).rejects.toMatchObject({ code: "Workflows/Review/Persistence" });
    });

    it("refuses a page delete while a review is in progress (handler, races only)", async () => {
        const context = await createUserContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await requestPageReview(context, page);
        const handlers = context.container.resolveAll(PageBeforeDeleteEventHandler);

        const results = await Promise.allSettled(
            handlers.map(handler => handler.handle(new PageBeforeDeleteEvent({ page })))
        );

        expect(results).toContainEqual({
            status: "rejected",
            reason: expect.objectContaining({
                code: "Workflows/Review/ActiveReviewOnTrash",
                data: {
                    model: "wb.page",
                    action: "delete",
                    reviews: [
                        expect.objectContaining({
                            reviewId: review.id,
                            targetId: page.entryId,
                            title: "Page A"
                        })
                    ]
                }
            })
        });
    });

    it("refuses the trash when the bound workflow lookup fails (A38, fail closed)", async () => {
        const context = await createUserContext({ legacyPlugins: [failGetBoundWorkflow] });
        const page = await createPage(context, { title: "Page A" });

        await expect(
            context.container.resolve(TrashPageUseCase).execute({ id: page.id })
        ).rejects.toMatchObject({ code: "Workflows/Workflow/Persistence" });
    });

    it("refuses to trash a newer revision while an older one is in review (A24)", async () => {
        const context = await createUserContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await requestPageReview(context, page);
        const revision = expectOk(
            await context.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
        );

        await expect(
            context.container.resolve(TrashPageUseCase).execute({ id: revision.id })
        ).rejects.toMatchObject({
            code: "Workflows/Review/ActiveReviewOnTrash",
            data: {
                model: "wb.page",
                action: "trash",
                reviews: [{ reviewId: review.id, targetId: page.entryId, title: "Page A" }]
            }
        });
    });

    it("trashes pages without a pages workflow even when the review lookup fails", async () => {
        const context = await createUserContext({
            legacyPlugins: [failListTargetReviews]
        });
        const page = await createPage(context, { title: "Page A" });

        const trashed = await context.container.resolve(TrashPageUseCase).execute({ id: page.id });

        expect(trashed.isOk()).toBe(true);
    });
});

describe("WB review cleanup after a page delete (R56, R81)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("keeps the reviews of a trashed page and deletes them with the page", async () => {
        const context = await createUserContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await approvePageReview(context, await requestPageReview(context, page));
        const getReview = context.container.resolve(GetReviewUseCase);

        expectOk(await context.container.resolve(TrashPageUseCase).execute({ id: page.id }));
        const afterTrash = await getReview.execute({ id: review.id });
        expectOk(await context.container.resolve(DeletePageUseCase).execute({ id: page.id }));
        const afterDelete = await getReview.execute({ id: review.id });

        expect(afterTrash.isOk()).toBe(true);
        expect(afterDelete.error.code).toBe("Workflows/Review/NotFound");
    });

    it("keeps the delete when the review cleanup fails (logged, R81)", async () => {
        const context = await createUserContext({
            legacyPlugins: [captureLoggedErrors, failDeleteTargetReviews]
        });
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await approvePageReview(context, await requestPageReview(context, page));
        expectOk(await context.container.resolve(TrashPageUseCase).execute({ id: page.id }));

        const deleted = await context.container.resolve(DeletePageUseCase).execute({ id: page.id });

        expect(deleted.isOk()).toBe(true);
        expect(loggedErrors).toEqual([
            {
                message: "Could not delete the reviews of a deleted page; they are left orphaned.",
                fields: expect.objectContaining({ model: "wb.page", targetId: page.entryId })
            }
        ]);
        // The review is orphaned (A34).
        const orphan = await context.container.resolve(GetReviewUseCase).execute({ id: review.id });
        expect(orphan.isOk()).toBe(true);
    });

    it("keeps the delete when the review cleanup throws and logs it (R81)", async () => {
        const context = await createUserContext({
            legacyPlugins: [captureLoggedErrors, throwDeleteTargetReviews]
        });
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await approvePageReview(context, await requestPageReview(context, page));
        expectOk(await context.container.resolve(TrashPageUseCase).execute({ id: page.id }));

        const deleted = await context.container.resolve(DeletePageUseCase).execute({ id: page.id });

        expect(deleted.isOk()).toBe(true);
        expect(loggedErrors).toEqual([
            {
                message: "Could not delete the reviews of a deleted page; they are left orphaned.",
                fields: expect.objectContaining({ model: "wb.page", targetId: page.entryId })
            }
        ]);
        const orphan = await context.container.resolve(GetReviewUseCase).execute({ id: review.id });
        expect(orphan.isOk()).toBe(true);
    });
});
