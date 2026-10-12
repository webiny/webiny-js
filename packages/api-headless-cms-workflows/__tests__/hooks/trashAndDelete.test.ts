import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { DeleteEntryRevisionUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { DeleteMultipleEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/index.js";
import { PublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/index.js";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { EntryPersistenceError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk, getAuthorModel } from "~tests/__helpers/entries.js";
import {
    approveEntryReview,
    cancelEntryReview,
    readEntry,
    requestEntryReview
} from "~tests/__helpers/engine.js";

interface ContextParams {
    withWorkflow?: boolean;
    legacyPlugins?: unknown[];
    privateModel?: boolean;
}

const createTestContext = async (params: ContextParams = {}) => {
    const { context } = createContextHandler({
        legacyPlugins: params.legacyPlugins ?? [],
        modifyModel: params.privateModel
            ? model => {
                  return { ...model, isPrivate: true };
              }
            : undefined
    });
    const ctx = await context();
    if (params.withWorkflow !== false) {
        expectOk(await storeWorkflow(ctx));
    }
    return ctx;
};

const trash = async (context: CmsContext, entry: CmsEntry) => {
    const model = await getAuthorModel(context);
    return context.container
        .resolve(DeleteEntryUseCase)
        .execute(model, entry.id, { permanently: false });
};

const deletePermanently = async (context: CmsContext, entry: CmsEntry) => {
    const model = await getAuthorModel(context);
    return context.container
        .resolve(DeleteEntryUseCase)
        .execute(model, entry.id, { permanently: true });
};

const createSecondRevision = async (context: CmsContext, entry: CmsEntry) => {
    const model = await getAuthorModel(context);
    return expectOk(
        await context.container
            .resolve(CreateEntryRevisionFromUseCase)
            .execute(model, entry.id, { values: {} })
    );
};

const getReview = (context: CmsContext, id: string) => {
    return context.container.resolve(GetReviewUseCase).execute({ id });
};

class FailingListTargetReviews implements ListTargetReviewsUseCase.Interface {
    public constructor(private decoratee: ListTargetReviewsUseCase.Interface) {}

    public async execute(): ListTargetReviewsUseCase.Return {
        return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
    }
}

class FailingDeleteTargetReviews implements DeleteTargetReviewsUseCase.Interface {
    public constructor(private decoratee: DeleteTargetReviewsUseCase.Interface) {}

    public async execute(): DeleteTargetReviewsUseCase.Return {
        return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
    }
}

class FailingGetBoundWorkflow implements GetBoundWorkflowUseCase.Interface {
    public constructor(private decoratee: GetBoundWorkflowUseCase.Interface) {}

    public async execute(): GetBoundWorkflowUseCase.Return {
        return Result.fail(new WorkflowPersistenceError(new Error("Storage is down.")));
    }
}

class FailingGetLatestRevision {
    public constructor(private decoratee: unknown) {}

    public async execute() {
        return Result.fail(new EntryPersistenceError(new Error("Storage is down.")));
    }
}

/** Error log messages captured by `CapturingLogger`. */
const loggedErrors: string[] = [];

class CapturingLogger implements Logger.Interface {
    public constructor(private decoratee: Logger.Interface) {}

    public trace(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.trace(objOrMsg, ...args);
    }
    public debug(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.debug(objOrMsg, ...args);
    }
    public info(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.info(objOrMsg, ...args);
    }
    public warn(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.warn(objOrMsg, ...args);
    }
    public error(objOrMsg: object | string, ...args: any[]): void {
        loggedErrors.push(String(args[0] ?? objOrMsg));
    }
    public fatal(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.fatal(objOrMsg, ...args);
    }
    public log(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.log(objOrMsg, ...args);
    }
}

const capturingLoggerPlugin = (container: Container) => {
    container.registerDecorator(
        Logger.createDecorator({ decorator: CapturingLogger, dependencies: [] })
    );
};

/** Engine calls the handlers made, by use case name. */
const engineCalls: string[] = [];

class CountingGetBoundWorkflow implements GetBoundWorkflowUseCase.Interface {
    public constructor(private decoratee: GetBoundWorkflowUseCase.Interface) {}

    public async execute(input: GetBoundWorkflowUseCase.Input): GetBoundWorkflowUseCase.Return {
        engineCalls.push("GetBoundWorkflow");
        return this.decoratee.execute(input);
    }
}

class CountingListTargetReviews implements ListTargetReviewsUseCase.Interface {
    public constructor(private decoratee: ListTargetReviewsUseCase.Interface) {}

    public async execute(
        input: Parameters<ListTargetReviewsUseCase.Interface["execute"]>[0]
    ): ListTargetReviewsUseCase.Return {
        engineCalls.push("ListTargetReviews");
        return this.decoratee.execute(input);
    }
}

class CountingDeleteTargetReviews implements DeleteTargetReviewsUseCase.Interface {
    public constructor(private decoratee: DeleteTargetReviewsUseCase.Interface) {}

    public async execute(
        input: DeleteTargetReviewsUseCase.Input
    ): DeleteTargetReviewsUseCase.Return {
        engineCalls.push("DeleteTargetReviews");
        return this.decoratee.execute(input);
    }
}

describe("CMS trash with a review in progress (D134)", () => {
    it("refuses to trash an entry with a review in progress", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await requestEntryReview(context, entry);

        const refused = await trash(context, entry);

        expect(refused.isFail()).toBe(true);
        expect(refused.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(refused.error.data).toEqual({
            model: "cms.author",
            action: "trash",
            reviews: [
                {
                    reviewId: review.id,
                    model: "cms.author",
                    targetId: entry.entryId,
                    targetRevisionId: entry.id,
                    title: "Ann",
                    stepPosition: 1,
                    stepCount: 1,
                    stepName: "Step 1"
                }
            ]
        });
        expect((await readEntry(context, entry.id)).id).toBe(entry.id);
    });

    it("trashes the entry once the review is cancelled, and keeps the cancelled review", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await requestEntryReview(context, entry);
        await cancelEntryReview(context, review);

        const trashed = await trash(context, entry);

        expect(trashed.isOk()).toBe(true);
        expect(expectOk(await getReview(context, review.id)).state).toBe("cancelled");
    });

    it("trashes an entry whose review is approved and keeps the review", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await approveEntryReview(context, await requestEntryReview(context, entry));

        const trashed = await trash(context, entry);

        expect(trashed.isOk()).toBe(true);
        expect(expectOk(await getReview(context, review.id)).state).toBe("approved");
    });

    it("trashes entries of an unbound model without looking up reviews", async () => {
        const context = await createTestContext({
            withWorkflow: false,
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
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const trashed = await trash(context, entry);

        expect(trashed.isOk()).toBe(true);
    });

    it("refuses the trash when the review lookup fails on a bound model (fail closed)", async () => {
        const context = await createTestContext({
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
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const refused = await trash(context, entry);

        expect(refused.error.code).toBe("Workflows/Review/Persistence");
    });
});

describe("CMS trash and delete when the workflow binding lookup fails (A38)", () => {
    const failingBinding = [
        (container: Container) => {
            container.registerDecorator(
                GetBoundWorkflowUseCase.createDecorator({
                    decorator: FailingGetBoundWorkflow,
                    dependencies: []
                })
            );
        }
    ];

    it("refuses trash and permanent delete (fail closed)", async () => {
        const context = await createTestContext({
            withWorkflow: false,
            legacyPlugins: failingBinding
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const trashed = await trash(context, entry);
        const deleted = await deletePermanently(context, entry);

        expect(trashed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(deleted.error.code).toBe("Workflows/Workflow/Persistence");
    });

    it("refuses deleteMultiple (fail closed)", async () => {
        const context = await createTestContext({
            withWorkflow: false,
            legacyPlugins: failingBinding
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const model = await getAuthorModel(context);

        const refused = await context.container
            .resolve(DeleteMultipleEntriesUseCase)
            .execute(model, { entries: [entry.id] });

        expect(refused.error.code).toBe("Workflows/Workflow/Persistence");
    });
});

describe("CMS delete with a review in progress (D134)", () => {
    it("refuses to delete an entry permanently with a review in progress", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await requestEntryReview(context, entry);

        const refused = await deletePermanently(context, entry);

        expect(refused.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(refused.error.data).toMatchObject({ action: "delete" });
    });

    it("refuses to delete a revision under review and deletes its reviews after cancel", async () => {
        const context = await createTestContext();
        const first = await createAuthorEntry(context, { name: "Ann" });
        const firstReview = await approveEntryReview(
            context,
            await requestEntryReview(context, first)
        );
        const second = await createSecondRevision(context, first);
        const secondReview = await requestEntryReview(context, second);
        const model = await getAuthorModel(context);
        const deleteRevision = context.container.resolve(DeleteEntryRevisionUseCase);

        const refused = await deleteRevision.execute(model, second.id);
        await cancelEntryReview(context, secondReview);
        const deleted = await deleteRevision.execute(model, second.id);

        expect(refused.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(refused.error.data).toMatchObject({
            action: "delete",
            reviews: [{ reviewId: secondReview.id }]
        });
        expect(deleted.isOk()).toBe(true);
        expect((await getReview(context, secondReview.id)).error.code).toBe(
            "Workflows/Review/NotFound"
        );
        expect(expectOk(await getReview(context, firstReview.id)).id).toBe(firstReview.id);
    });

    it("refuses deleteMultiple when an entry has a review in progress", async () => {
        const context = await createTestContext();
        const free = await createAuthorEntry(context, { name: "Free" });
        const busy = await createAuthorEntry(context, { name: "Busy" });
        const review = await requestEntryReview(context, busy);
        const model = await getAuthorModel(context);

        const refused = await context.container
            .resolve(DeleteMultipleEntriesUseCase)
            .execute(model, { entries: [free.id, busy.id] });

        expect(refused.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(refused.error.data).toMatchObject({
            action: "delete",
            reviews: [{ reviewId: review.id, targetId: busy.entryId }]
        });
        expect((await readEntry(context, free.id)).id).toBe(free.id);
    });
});

describe("CMS trash and delete on a private model (R52)", () => {
    it("neither blocks nor cleans up: the engine deletes its own review and assignment entries", async () => {
        engineCalls.length = 0;
        // The workflow, review and assignment models are private. Their entries fire the same CMS
        // events, and the engine deletes them through `DeleteEntryUseCase`, so the handlers must
        // skip private models or the engine would call itself.
        const context = await createTestContext({
            privateModel: true,
            withWorkflow: false,
            legacyPlugins: [
                (container: Container) => {
                    container.registerDecorator(
                        GetBoundWorkflowUseCase.createDecorator({
                            decorator: CountingGetBoundWorkflow,
                            dependencies: []
                        })
                    );
                    container.registerDecorator(
                        ListTargetReviewsUseCase.createDecorator({
                            decorator: CountingListTargetReviews,
                            dependencies: []
                        })
                    );
                    container.registerDecorator(
                        DeleteTargetReviewsUseCase.createDecorator({
                            decorator: CountingDeleteTargetReviews,
                            dependencies: []
                        })
                    );
                }
            ]
        });
        const model = await getAuthorModel(context);
        const trashed = await createAuthorEntry(context, { name: "Trashed" });
        const deleted = await createAuthorEntry(context, { name: "Deleted" });
        const revised = await createAuthorEntry(context, { name: "Revised" });
        const revision = await createSecondRevision(context, revised);
        const bulk = await createAuthorEntry(context, { name: "Bulk" });
        // OpenSearch deleteMultiple needs the published record.
        expectOk(await context.container.resolve(PublishEntryUseCase).execute(model, bulk.id));
        engineCalls.length = 0;

        expect((await trash(context, trashed)).isOk()).toBe(true);
        expect((await deletePermanently(context, deleted)).isOk()).toBe(true);
        expect(
            (
                await context.container
                    .resolve(DeleteEntryRevisionUseCase)
                    .execute(model, revision.id)
            ).isOk()
        ).toBe(true);
        expect(
            (
                await context.container
                    .resolve(DeleteMultipleEntriesUseCase)
                    .execute(model, { entries: [bulk.id] })
            ).isOk()
        ).toBe(true);

        expect(engineCalls).toEqual([]);
    });
});

describe("CMS review cleanup after a permanent delete (R56, R81)", () => {
    it("deletes the reviews of a permanently deleted entry", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await approveEntryReview(context, await requestEntryReview(context, entry));

        expectOk(await deletePermanently(context, entry));

        expect((await getReview(context, review.id)).error.code).toBe("Workflows/Review/NotFound");
    });

    it("deletes the reviews of entries deleted in bulk", async () => {
        const context = await createTestContext();
        const first = await createAuthorEntry(context, { name: "First" });
        const second = await createAuthorEntry(context, { name: "Second" });
        const firstReview = await approveEntryReview(
            context,
            await requestEntryReview(context, first)
        );
        const secondReview = await approveEntryReview(
            context,
            await requestEntryReview(context, second)
        );
        // OpenSearch deleteMultiple needs the published records.
        const model = await getAuthorModel(context);
        const publish = context.container.resolve(PublishEntryUseCase);
        expectOk(await publish.execute(model, first.id));
        expectOk(await publish.execute(model, second.id));

        expectOk(
            await context.container
                .resolve(DeleteMultipleEntriesUseCase)
                .execute(model, { entries: [first.id, second.id] })
        );

        expect((await getReview(context, firstReview.id)).error.code).toBe(
            "Workflows/Review/NotFound"
        );
        expect((await getReview(context, secondReview.id)).error.code).toBe(
            "Workflows/Review/NotFound"
        );
    });

    it("keeps the delete when the review cleanup fails and logs it (R81)", async () => {
        loggedErrors.length = 0;
        const context = await createTestContext({
            legacyPlugins: [
                capturingLoggerPlugin,
                (container: Container) => {
                    container.registerDecorator(
                        DeleteTargetReviewsUseCase.createDecorator({
                            decorator: FailingDeleteTargetReviews,
                            dependencies: []
                        })
                    );
                }
            ]
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await approveEntryReview(context, await requestEntryReview(context, entry));

        const deleted = await deletePermanently(context, entry);

        expect(deleted.isOk()).toBe(true);
        expect(loggedErrors).toEqual([
            "Could not delete the reviews of a deleted entry; they are left orphaned."
        ]);
        // The review is orphaned (A34).
        expect(expectOk(await getReview(context, review.id)).id).toBe(review.id);
    });

    it("keeps the bulk delete and logs when the deleted-entry lookup fails (R81)", async () => {
        loggedErrors.length = 0;
        const context = await createTestContext({
            legacyPlugins: [
                capturingLoggerPlugin,
                (container: Container) => {
                    container.registerDecorator(
                        GetLatestRevisionByEntryIdIncludingDeletedUseCase.createDecorator({
                            decorator: FailingGetLatestRevision,
                            dependencies: []
                        })
                    );
                }
            ]
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await approveEntryReview(context, await requestEntryReview(context, entry));
        const model = await getAuthorModel(context);
        expectOk(await context.container.resolve(PublishEntryUseCase).execute(model, entry.id));

        const deleted = await context.container
            .resolve(DeleteMultipleEntriesUseCase)
            .execute(model, { entries: [entry.id] });

        expect(deleted.isOk()).toBe(true);
        expect(loggedErrors).toEqual([
            "Could not confirm that an entry is deleted; its reviews are left orphaned."
        ]);
        expect(expectOk(await getReview(context, review.id)).id).toBe(review.id);
    });
});
