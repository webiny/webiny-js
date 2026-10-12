import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { PublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/index.js";
import { UnpublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/index.js";
import { RepublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/RepublishEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { MoveEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk, getAuthorModel } from "~tests/__helpers/entries.js";
import {
    approveEntryReview,
    cancelEntryReview,
    readEntry,
    rejectEntryReview,
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

const publish = async (context: CmsContext, entry: CmsEntry) => {
    const model = await getAuthorModel(context);
    return context.container.resolve(PublishEntryUseCase).execute(model, entry.id);
};

const republish = async (context: CmsContext, entry: CmsEntry) => {
    const model = await getAuthorModel(context);
    return context.container.resolve(RepublishEntryUseCase).execute(model, entry.id);
};

const move = async (context: CmsContext, entry: CmsEntry, folderId: string) => {
    const model = await getAuthorModel(context);
    return context.container.resolve(MoveEntryUseCase).execute(model, entry.id, folderId);
};

let listWorkflowsCalls = 0;

class CountingListWorkflows implements ListWorkflowsUseCase.Interface {
    public constructor(private decoratee: ListWorkflowsUseCase.Interface) {}

    public async execute(input?: ListWorkflowsUseCase.Input): ListWorkflowsUseCase.Return {
        listWorkflowsCalls++;
        return this.decoratee.execute(input);
    }
}

class FailingListWorkflows implements ListWorkflowsUseCase.Interface {
    public constructor(private decoratee: ListWorkflowsUseCase.Interface) {}

    public async execute(): ListWorkflowsUseCase.Return {
        return Result.fail(new WorkflowPersistenceError(new Error("Storage is down.")));
    }
}

describe("CMS publish rule (D79, D121)", () => {
    it("publishes normally on a model without a workflow", async () => {
        const context = await createTestContext({ withWorkflow: false });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const published = await publish(context, entry);

        expect(published.isOk()).toBe(true);
    });

    it("blocks publishing without a review", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const blocked = await publish(context, entry);

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Review/PublishBlocked");
        expect(blocked.error.data).toEqual({
            model: "cms.author",
            targetRevisionId: entry.id,
            workflowId: "workflow-1",
            reviewState: null
        });
    });

    it("blocks publishing while the review is in progress or rejected", async () => {
        const context = await createTestContext();
        const inProgress = await createAuthorEntry(context, { name: "In progress" });
        const rejected = await createAuthorEntry(context, { name: "Rejected" });
        await requestEntryReview(context, inProgress);
        await rejectEntryReview(context, await requestEntryReview(context, rejected));

        const inProgressResult = await publish(context, inProgress);
        const rejectedResult = await publish(context, rejected);

        expect(inProgressResult.error.code).toBe("Workflows/Review/PublishBlocked");
        expect(inProgressResult.error.data).toMatchObject({ reviewState: "inProgress" });
        expect(rejectedResult.error.code).toBe("Workflows/Review/PublishBlocked");
        expect(rejectedResult.error.data).toMatchObject({ reviewState: "rejected" });
    });

    it("publishes an approved revision and republishes it after unpublishing (D121)", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await approveEntryReview(context, await requestEntryReview(context, entry));
        const model = await getAuthorModel(context);

        const published = await publish(context, entry);
        expectOk(await context.container.resolve(UnpublishEntryUseCase).execute(model, entry.id));
        const republished = await publish(context, entry);

        expect(published.isOk()).toBe(true);
        expect(republished.isOk()).toBe(true);
    });

    it("blocks publishing when the workflow lookup fails (fail closed)", async () => {
        const context = await createTestContext({
            legacyPlugins: [
                (container: Container) => {
                    container.registerDecorator(
                        ListWorkflowsUseCase.createDecorator({
                            decorator: FailingListWorkflows,
                            dependencies: []
                        })
                    );
                }
            ],
            withWorkflow: false
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const blocked = await publish(context, entry);

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Workflow/Persistence");
    });

    it("creates entries and revisions as published on a bound model without a review (D134, R83)", async () => {
        const context = await createTestContext();
        const model = await getAuthorModel(context);

        const created = expectOk(
            await context.container.resolve(CreateEntryUseCase).execute(model, {
                values: { name: "Imported" },
                status: "published",
                location: { folderId: "root" }
            })
        );
        const revision = expectOk(
            await context.container
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(model, created.id, { values: {}, status: "published" })
        );

        expect(created.status).toBe("published");
        expect(revision.status).toBe("published");
    });

    it("ignores private models such as Website Builder pages (R52)", async () => {
        listWorkflowsCalls = 0;
        const context = await createTestContext({
            privateModel: true,
            withWorkflow: false,
            legacyPlugins: [
                (container: Container) => {
                    container.registerDecorator(
                        ListWorkflowsUseCase.createDecorator({
                            decorator: CountingListWorkflows,
                            dependencies: []
                        })
                    );
                }
            ]
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const published = await publish(context, entry);

        expect(published.isOk()).toBe(true);
        expect(listWorkflowsCalls).toBe(0);
    });
});

interface UpdateParams {
    name: string;
    folderId?: string;
}

const update = async (context: CmsContext, revisionId: string, params: UpdateParams) => {
    const model = await getAuthorModel(context);
    return context.container.resolve(UpdateEntryUseCase).execute(model, revisionId, {
        values: { name: params.name },
        wbyAco_location: params.folderId ? { folderId: params.folderId } : undefined
    });
};

describe("CMS republish rule (D79, R53)", () => {
    it("refuses to republish an unreviewed draft on a bound model", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const blocked = await republish(context, entry);

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Review/PublishBlocked");
        expect(blocked.error.data).toEqual({
            model: "cms.author",
            targetRevisionId: entry.id,
            workflowId: "workflow-1",
            reviewState: null
        });
        expect((await readEntry(context, entry.id)).status).toBe("draft");
    });

    it("refuses to republish a draft whose review is in progress", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await requestEntryReview(context, entry);

        const blocked = await republish(context, entry);

        expect(blocked.error.code).toBe("Workflows/Review/PublishBlocked");
        expect(blocked.error.data).toMatchObject({ reviewState: "inProgress" });
    });

    it("republishes an approved revision that is not published", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await approveEntryReview(context, await requestEntryReview(context, entry));

        const republished = await republish(context, entry);

        expect(republished.isOk()).toBe(true);
    });

    it("republishes an already published revision (refresh)", async () => {
        const context = await createTestContext();
        const model = await getAuthorModel(context);
        // Created as published without a review (D134 point 2, R83).
        const created = expectOk(
            await context.container.resolve(CreateEntryUseCase).execute(model, {
                values: { name: "Imported" },
                status: "published",
                location: { folderId: "root" }
            })
        );

        const republished = await republish(context, created);

        expect(republished.isOk()).toBe(true);
    });

    it("republishes on a model without a workflow", async () => {
        const context = await createTestContext({ withWorkflow: false });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const republished = await republish(context, entry);

        expect(republished.isOk()).toBe(true);
    });
});

describe("CMS move rule (D84)", () => {
    it("blocks moving while a review is in progress and allows it after cancel", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });
        const review = await requestEntryReview(context, entry);

        const blocked = await move(context, entry, "folder-2");
        await cancelEntryReview(context, review);
        const moved = await move(context, entry, "folder-2");

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Review/TargetLocked");
        expect(blocked.error.data).toMatchObject({ action: "move", reviewState: "inProgress" });
        expect(moved.isOk()).toBe(true);
    });

    it("moves an entry of an unbound model without looking up reviews", async () => {
        const context = await createTestContext({ withWorkflow: false });
        const entry = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });

        const moved = await move(context, entry, "folder-2");

        expect(moved.isOk()).toBe(true);
    });

    it("moves a target whose review is approved", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });
        await approveEntryReview(context, await requestEntryReview(context, entry));

        const moved = await move(context, entry, "folder-2");

        expect(moved.isOk()).toBe(true);
    });

    it("blocks a move while another revision of the entry is in review (R55)", async () => {
        const context = await createTestContext();
        const first = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });
        const model = await getAuthorModel(context);
        const second = expectOk(
            await context.container
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(model, first.id, { values: {} })
        );
        await requestEntryReview(context, second);

        const blocked = await move(context, first, "folder-2");

        expect(blocked.error.code).toBe("Workflows/Review/TargetLocked");
    });

    it("blocks a folder change through update while another revision is in review (R55, A24)", async () => {
        const context = await createTestContext();
        const first = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });
        const model = await getAuthorModel(context);
        const second = expectOk(
            await context.container
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(model, first.id, { values: {} })
        );
        const review = await requestEntryReview(context, first);

        const blocked = await update(context, second.id, { name: "Moved", folderId: "folder-2" });
        const sameFolder = await update(context, second.id, {
            name: "Same folder",
            folderId: "folder-1"
        });
        const noFolder = await update(context, second.id, { name: "No folder" });

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Review/TargetLocked");
        expect(blocked.error.data).toEqual({
            reviewId: review.id,
            model: "cms.author",
            targetRevisionId: first.id,
            reviewState: "inProgress",
            action: "move"
        });
        expect(sameFolder.isOk()).toBe(true);
        expect(noFolder.isOk()).toBe(true);
        expect((await readEntry(context, second.id)).location?.folderId).toBe("folder-1");
    });

    it("changes the folder through update on a model without a workflow", async () => {
        const context = await createTestContext({ withWorkflow: false });
        const entry = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });

        const updated = await update(context, entry.id, { name: "Moved", folderId: "folder-2" });

        expect(updated.isOk()).toBe(true);
    });
});
