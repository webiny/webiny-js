import { afterEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { PAGE_MODEL_ID } from "@webiny/api-website-builder/domain/page/page.model.js";
import { PublishPageUseCase } from "@webiny/api-website-builder/features/pages/PublishPage/index.js";
import { UnpublishPageUseCase } from "@webiny/api-website-builder/features/pages/UnpublishPage/index.js";
import { MovePageUseCase } from "@webiny/api-website-builder/features/pages/MovePage/index.js";
import { UpdatePageUseCase } from "@webiny/api-website-builder/features/pages/UpdatePage/index.js";
import { CreatePageRevisionFromUseCase } from "@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/index.js";
import { CreateExperimentUseCase } from "@webiny/api-website-builder/features/experiments/CreateExperiment/index.js";
import { CreateVariantUseCase } from "@webiny/api-website-builder/features/variants/CreateVariant/index.js";
import { GraduateVariantUseCase } from "@webiny/api-website-builder/features/experiments/GraduateVariant/index.js";
import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { ReviewTargetSync } from "@webiny/api-workflows/features/review/ReviewTargetSync/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { UpdateEntrySystemUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntrySystem/index.js";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import {
    ReviewPersistenceError,
    ReviewTargetLockedError
} from "@webiny/api-workflows/domain/review/errors.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import {
    approvePageReview,
    cancelPageReview,
    readPage,
    rejectPageReview,
    requestPageReview,
    STEP_ID,
    storeWbWorkflow
} from "~tests/__helpers/engine.js";
import { ADMIN, NOBODY, READER, WB_READER } from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { FakeAdminUsers } from "~tests/__helpers/FakeAdminUsers.js";
import { failClearWorkflowSystemWrite } from "~tests/__helpers/FailingUpdateEntrySystem.js";
import { captureLoggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { loggedErrors } from "~tests/__helpers/CapturingLogger.js";

/** READER and NOBODY are admin users of the tenant; "user-elsewhere" is not (R68). */
const createAdminContext = (extraPlugins: unknown[] = []) => {
    return createUserContext({
        permissionsByIdentity: { [READER.id]: WB_READER, "user-elsewhere": WB_READER },
        legacyPlugins: [
            (container: Container) => {
                container.registerInstance(
                    GetUserUseCase,
                    new FakeAdminUsers([READER.id, NOBODY.id])
                );
            },
            ...extraPlugins
        ]
    });
};

class FailingListWorkflows implements ListWorkflowsUseCase.Interface {
    public constructor(private decoratee: ListWorkflowsUseCase.Interface) {}

    public async execute(): ListWorkflowsUseCase.Return {
        return Result.fail(new WorkflowPersistenceError(new Error("Storage is down.")));
    }
}

class FailingListTargetReviews implements ListTargetReviewsUseCase.Interface {
    public constructor(private decoratee: ListTargetReviewsUseCase.Interface) {}

    public async execute(): ListTargetReviewsUseCase.Return {
        return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
    }
}

class ThrowingTargetReader implements WbPageTargetReader.Interface {
    public constructor(private decoratee: WbPageTargetReader.Interface) {}

    public async read(): Promise<WbPageTargetReader.Target | null> {
        throw new Error("Storage is down.");
    }
}

const ThrowingTargetReaderDecorator = WbPageTargetReader.createDecorator({
    decorator: ThrowingTargetReader,
    dependencies: []
});

class ThrowingUpdateEntrySystem implements UpdateEntrySystemUseCase.Interface {
    public constructor(private decoratee: UpdateEntrySystemUseCase.Interface) {}

    public async execute(): Promise<never> {
        throw new Error("Storage is down.");
    }
}

const ThrowingUpdateEntrySystemDecorator = UpdateEntrySystemUseCase.createDecorator({
    decorator: ThrowingUpdateEntrySystem,
    dependencies: []
});

class FailingGetTargetReview implements GetTargetReviewUseCase.Interface {
    public constructor(private decoratee: GetTargetReviewUseCase.Interface) {}

    public async execute(): GetTargetReviewUseCase.Return {
        return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
    }
}

const getReadAccess = (context: CmsContext): ReviewTargetReadAccess.Interface => {
    return context.container
        .resolveAll(ReviewTargetReadAccess)
        .find(item => item.canHandle("wb.page"))!;
};

describe("WB page adapter", () => {
    afterEach(() => {
        folderLevels.clear();
        loggedErrors.length = 0;
    });

    it("loads a page revision's title and typed context", async () => {
        const context = await createAdminContext();
        const page = await createPage(context, { title: "Page A", folderId: "folder-1" });
        const loaders = context.container.resolveAll(ReviewTargetLoader);
        const loader = loaders.find(item => item.canLoad("wb.page"))!;

        const loaded = await loader.load({
            model: "wb.page",
            targetId: page.entryId,
            targetRevisionId: page.id
        });

        expect(loaded).toEqual({
            title: "Page A",
            context: {
                folder: { id: "folder-1", type: "wb:page" },
                modelId: PAGE_MODEL_ID,
                title: "Page A",
                author: { id: ADMIN.id, displayName: ADMIN.displayName }
            }
        });
        // The CMS adapter does not claim pages (R52).
        expect(loaders.filter(item => item.canLoad("wb.page"))).toHaveLength(1);
    });

    it("writes system.workflow on request and clears it on cancel", async () => {
        const context = await createAdminContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });

        const review = await requestPageReview(context, page);
        const requested = await readPage(context, page.id);
        await cancelPageReview(context, review);
        const cancelled = await readPage(context, page.id);

        expect(requested.system?.workflow).toEqual({
            workflowId: "wb-workflow",
            reviewState: "inProgress",
            stepId: STEP_ID,
            stepName: "Step 1",
            stepState: "awaiting"
        });
        expect(cancelled.system?.workflow).toBeNull();
    });

    it("answers read access for another user with that user's permissions (R48)", async () => {
        const context = await createAdminContext();
        const page = await createPage(context, { title: "Page A", folderId: "folder-1" });
        const access = getReadAccess(context);
        const params = { model: "wb.page", targetId: page.entryId, targetRevisionId: page.id };

        const reader = await access.canUserRead({ ...params, userId: READER.id });
        const nobody = await access.canUserRead({ ...params, userId: NOBODY.id });
        const elsewhere = await access.canUserRead({ ...params, userId: "user-elsewhere" });
        folderLevels.set("folder-1", new Map([[READER.id, "no-access"]]));
        const readerWithoutFolder = await access.canUserRead({ ...params, userId: READER.id });

        expect(reader).toBe(true);
        expect(nobody).toBe(false);
        expect(elsewhere).toBe(false);
        expect(readerWithoutFolder).toBe(false);
    });

    it("answers with the user's permissions, not a less privileged caller's (R48, R67)", async () => {
        const admin = await createAdminContext();
        const page = await createPage(admin, { title: "Page A" });
        const params = { model: "wb.page", targetId: page.entryId, targetRevisionId: page.id };
        // The engine asks as the request identity (here a reader), never from inside
        // withoutAuthorization: the page model is read as that caller.
        const context = await createUserContext({
            identity: READER,
            permissions: WB_READER,
            permissionsByIdentity: { [READER.id]: WB_READER },
            legacyPlugins: [
                (container: Container) => {
                    container.registerInstance(
                        GetUserUseCase,
                        new FakeAdminUsers([READER.id, NOBODY.id])
                    );
                }
            ]
        });
        const access = getReadAccess(context);

        const reader = await access.canUserRead({ ...params, userId: READER.id });
        const nobody = await access.canUserRead({ ...params, userId: NOBODY.id });

        expect({ reader, nobody }).toEqual({ reader: true, nobody: false });
        expect(context.container.resolve(IdentityContext).getIdentity().id).toBe(READER.id);
    });

    it("denies read access when reading the target throws (R50)", async () => {
        const context = await createUserContext({
            permissionsByIdentity: { [READER.id]: WB_READER },
            legacyPlugins: [
                (container: Container) => {
                    container.registerDecorator(ThrowingTargetReaderDecorator);
                    container.registerInstance(GetUserUseCase, new FakeAdminUsers([READER.id]));
                }
            ]
        });

        const canRead = await getReadAccess(context).canUserRead({
            userId: READER.id,
            model: "wb.page",
            targetId: "any",
            targetRevisionId: "any#0001"
        });

        expect(canRead).toBe(false);
    });

    it("fails the sync instead of throwing when the page model or write throws", async () => {
        const context = await createUserContext({
            legacyPlugins: [
                (container: Container) => {
                    container.registerDecorator(ThrowingUpdateEntrySystemDecorator);
                }
            ]
        });
        const page = await createPage(context, { title: "Page A" });
        const sync = context.container
            .resolveAll(ReviewTargetSync)
            .find(item => item.canSync("wb.page"))!;

        const result = await sync.sync({
            review: { model: "wb.page", targetRevisionId: page.id },
            systemWorkflow: null
        } as unknown as ReviewTargetSync.Params);

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("Storage is down.");
    });

    it("starts a new page revision without system.workflow (D59)", async () => {
        const context = await createAdminContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        await approvePageReview(context, await requestPageReview(context, page));

        const revision = expectOk(
            await context.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
        );

        expect((await readPage(context, revision.id)).system?.workflow).toBeNull();
    });

    it("starts a graduated variant revision without system.workflow (D59)", async () => {
        const context = await createAdminContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        await approvePageReview(context, await requestPageReview(context, page));
        const experiment = expectOk(
            await context.container.resolve(CreateExperimentUseCase).execute({
                pageEntryId: page.entryId,
                baselineRevisionId: page.id,
                name: "Experiment A"
            })
        );
        const variant = expectOk(
            await context.container
                .resolve(CreateVariantUseCase)
                .execute({ experimentId: experiment.id, name: "Variant A" })
        );

        const revision = expectOk(
            await context.container
                .resolve(GraduateVariantUseCase)
                .execute({ experimentId: experiment.id, variantId: variant.id })
        );

        expect(revision.id).not.toBe(page.id);
        expect(revision.system?.workflow).toBeNull();
        expect((await readPage(context, revision.id)).system?.workflow).toBeNull();
    });

    it("logs a failed review state reset of a graduated variant revision with the page id", async () => {
        const context = await createAdminContext([
            captureLoggedErrors,
            failClearWorkflowSystemWrite
        ]);
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        await approvePageReview(context, await requestPageReview(context, page));
        const experiment = expectOk(
            await context.container.resolve(CreateExperimentUseCase).execute({
                pageEntryId: page.entryId,
                baselineRevisionId: page.id,
                name: "Experiment A"
            })
        );
        const variant = expectOk(
            await context.container
                .resolve(CreateVariantUseCase)
                .execute({ experimentId: experiment.id, name: "Variant A" })
        );

        const revision = expectOk(
            await context.container
                .resolve(GraduateVariantUseCase)
                .execute({ experimentId: experiment.id, variantId: variant.id })
        );

        expect(revision.system?.workflow).toMatchObject({ reviewState: "approved" });
        expect(loggedErrors).toEqual([
            {
                message:
                    "Could not clear the review state of a graduated variant revision; it keeps the copied state.",
                fields: {
                    err: expect.objectContaining({ message: "Storage is down." }),
                    pageId: revision.id
                }
            }
        ]);
    });

    it("blocks updates to a page under review on the page update event (R54)", async () => {
        const context = await createAdminContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await requestPageReview(context, page);
        const updatePage = context.container.resolve(UpdatePageUseCase);

        // WB publishes the before event outside a try, so the handler's error rejects (A26).
        await expect(
            updatePage.execute(page.id, { properties: { title: "Changed" } })
        ).rejects.toMatchObject({
            code: "Workflows/Review/TargetLocked",
            message: new ReviewTargetLockedError({
                reviewId: review.id,
                model: "wb.page",
                targetRevisionId: page.id,
                reviewState: "inProgress",
                action: "update"
            }).message
        });
        await cancelPageReview(context, review);
        const allowed = await updatePage.execute(page.id, { properties: { title: "Changed" } });

        expect(allowed.isOk()).toBe(true);
    });

    it("publishes normally without a pages workflow", async () => {
        const context = await createAdminContext();
        const page = await createPage(context, { title: "Page A" });

        const published = await context.container
            .resolve(PublishPageUseCase)
            .execute({ id: page.id });

        expect(published.isOk()).toBe(true);
    });

    it("blocks publishing without an approved review (D79)", async () => {
        const context = await createAdminContext();
        await storeWbWorkflow(context);
        const withoutReview = await createPage(context, { title: "No review" });
        const rejected = await createPage(context, { title: "Rejected" });
        await rejectPageReview(context, await requestPageReview(context, rejected));
        const inProgress = await createPage(context, { title: "In progress" });
        await requestPageReview(context, inProgress);
        const publishPage = context.container.resolve(PublishPageUseCase);

        // WB publishes the before event outside a try, so the handler's error rejects (A26).
        await expect(publishPage.execute({ id: withoutReview.id })).rejects.toMatchObject({
            code: "Workflows/Review/PublishBlocked",
            data: { reviewState: null }
        });
        await expect(publishPage.execute({ id: rejected.id })).rejects.toMatchObject({
            code: "Workflows/Review/PublishBlocked",
            data: { reviewState: "rejected" }
        });
        await expect(publishPage.execute({ id: inProgress.id })).rejects.toMatchObject({
            code: "Workflows/Review/PublishBlocked",
            data: { reviewState: "inProgress" }
        });
    });

    it("blocks publishing when the workflow lookup fails (fail closed)", async () => {
        const context = await createUserContext({
            legacyPlugins: [
                (container: Container) => {
                    container.registerDecorator(
                        ListWorkflowsUseCase.createDecorator({
                            decorator: FailingListWorkflows,
                            dependencies: []
                        })
                    );
                }
            ]
        });
        const page = await createPage(context, { title: "Page A" });

        // WB publishes the before event outside a try, so the handler's error rejects (A26).
        await expect(
            context.container.resolve(PublishPageUseCase).execute({ id: page.id })
        ).rejects.toMatchObject({ code: "Workflows/Workflow/Persistence" });
    });

    it("blocks a folder change through the page update while its review is in progress (D84)", async () => {
        const context = await createAdminContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A", folderId: "folder-1" });
        const review = await requestPageReview(context, page);
        // The save block only covers the revision in review; the folder rule covers the others.
        const revision = expectOk(
            await context.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
        );
        // A page update that carries a new `location` relocates the page without `MovePage`.
        const updatePage = context.container.resolve(UpdatePageUseCase);

        await expect(
            updatePage.execute(revision.id, { location: { folderId: "folder-2" } })
        ).rejects.toMatchObject({
            code: "Workflows/Review/TargetLocked",
            message: new ReviewTargetLockedError({
                reviewId: review.id,
                model: "wb.page",
                targetRevisionId: page.id,
                reviewState: "inProgress",
                action: "move"
            }).message
        });
        await cancelPageReview(context, review);
        const allowed = await updatePage.execute(revision.id, {
            location: { folderId: "folder-2" }
        });

        expect(allowed.isOk()).toBe(true);
    });

    it("publishes a page of an unbound model even when the review lookup fails (R84)", async () => {
        const context = await createUserContext({
            legacyPlugins: [
                (container: Container) => {
                    container.registerDecorator(
                        GetTargetReviewUseCase.createDecorator({
                            decorator: FailingGetTargetReview,
                            dependencies: []
                        })
                    );
                }
            ]
        });
        const page = await createPage(context, { title: "Page A" });

        const published = await context.container
            .resolve(PublishPageUseCase)
            .execute({ id: page.id });

        expect(published.isOk()).toBe(true);
    });

    it("blocks publishing a bound page when the review lookup fails (fail closed)", async () => {
        const context = await createUserContext({
            legacyPlugins: [
                (container: Container) => {
                    container.registerDecorator(
                        GetTargetReviewUseCase.createDecorator({
                            decorator: FailingGetTargetReview,
                            dependencies: []
                        })
                    );
                }
            ]
        });
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });

        await expect(
            context.container.resolve(PublishPageUseCase).execute({ id: page.id })
        ).rejects.toMatchObject({ code: "Workflows/Review/Persistence" });
    });

    it("publishes an approved page and republishes it after unpublishing (D121)", async () => {
        const context = await createAdminContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        await approvePageReview(context, await requestPageReview(context, page));
        const publishPage = context.container.resolve(PublishPageUseCase);

        const published = await publishPage.execute({ id: page.id });
        expectOk(await context.container.resolve(UnpublishPageUseCase).execute({ id: page.id }));
        const republished = await publishPage.execute({ id: page.id });

        expect(published.isOk()).toBe(true);
        expect(republished.isOk()).toBe(true);
    });

    it("moves a page of an unbound model without looking up reviews", async () => {
        const context = await createUserContext({
            legacyPlugins: [
                (container: Container) => {
                    container.registerDecorator(
                        ListTargetReviewsUseCase.createDecorator({
                            decorator: FailingListTargetReviews,
                            dependencies: []
                        })
                    );
                }
            ]
        });
        const page = await createPage(context, { title: "Page A", folderId: "folder-1" });

        const moved = await context.container
            .resolve(MovePageUseCase)
            .execute({ id: page.id, folderId: "folder-2" });

        expect(moved.isOk()).toBe(true);
    });

    it("blocks moving a page while its review is in progress (D84)", async () => {
        const context = await createAdminContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A", folderId: "folder-1" });
        const review = await requestPageReview(context, page);
        const movePage = context.container.resolve(MovePageUseCase);

        await expect(movePage.execute({ id: page.id, folderId: "folder-2" })).rejects.toMatchObject(
            { code: "Workflows/Review/TargetLocked", data: { action: "move" } }
        );
        await cancelPageReview(context, review);
        const moved = await movePage.execute({ id: page.id, folderId: "folder-2" });

        expect(moved.isOk()).toBe(true);
    });

    it("blocks moving a newer revision while an older one is in review (A24)", async () => {
        const context = await createAdminContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A", folderId: "folder-1" });
        const review = await requestPageReview(context, page);
        const revision = expectOk(
            await context.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
        );
        const movePage = context.container.resolve(MovePageUseCase);

        await expect(
            movePage.execute({ id: revision.id, folderId: "folder-2" })
        ).rejects.toMatchObject({
            code: "Workflows/Review/TargetLocked",
            data: { reviewId: review.id, targetRevisionId: page.id, action: "move" }
        });
    });
});
