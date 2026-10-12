import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { DeleteWorkflowUseCase } from "@webiny/api-workflows/features/workflow/DeleteWorkflow/index.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { ADMIN_ACTOR, createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk, getAuthorModel } from "~tests/__helpers/entries.js";
import {
    approveEntryReview,
    cancelEntryReview,
    readEntry,
    rejectEntryReview,
    requestEntryReview
} from "~tests/__helpers/engine.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";

const createWorkflowContext = async (legacyPlugins: unknown[] = []) => {
    const { context } = createContextHandler({ legacyPlugins });
    const ctx = await context();
    const workflow = expectOk(await storeWorkflow(ctx));
    return { context: ctx, workflow };
};

/** No workflow is bound to the test model. */
const createUnboundContext = async (legacyPlugins: unknown[] = []) => {
    const { context } = createContextHandler({ legacyPlugins });
    return context();
};

const updateName = async (context: CmsContext, revisionId: string, name: string) => {
    const model = await getAuthorModel(context);
    return context.container.resolve(UpdateEntryUseCase).execute(model, revisionId, {
        values: { name }
    });
};

class FailingGetTargetReview implements GetTargetReviewUseCase.Interface {
    public constructor(private decoratee: GetTargetReviewUseCase.Interface) {}

    public async execute(): GetTargetReviewUseCase.Return {
        return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
    }
}

const FailingGetTargetReviewDecorator = GetTargetReviewUseCase.createDecorator({
    decorator: FailingGetTargetReview,
    dependencies: []
});

class FailingListWorkflows implements ListWorkflowsUseCase.Interface {
    public constructor(private decoratee: ListWorkflowsUseCase.Interface) {}

    public async execute(): ListWorkflowsUseCase.Return {
        return Result.fail(new WorkflowPersistenceError(new Error("Storage is down.")));
    }
}

const FailingListWorkflowsDecorator = ListWorkflowsUseCase.createDecorator({
    decorator: FailingListWorkflows,
    dependencies: []
});

describe("Revision create and save block", () => {
    it("starts a new revision without system.workflow (D59)", async () => {
        const { context } = await createWorkflowContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await requestEntryReview(context, entry);
        await approveEntryReview(context, review);
        const model = await getAuthorModel(context);

        const revision = expectOk(
            await context.container
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(model, entry.id, { values: {} })
        );

        expect(revision.system?.workflow).toBeNull();
        expect((await readEntry(context, revision.id)).system?.workflow).toBeNull();
        expect((await readEntry(context, entry.id)).system?.workflow?.reviewState).toBe("approved");
    });

    it("blocks updating a revision under review and allows it after cancel (D62)", async () => {
        const { context } = await createWorkflowContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await requestEntryReview(context, entry);

        const blocked = await updateName(context, entry.id, "Changed");
        await cancelEntryReview(context, review);
        const allowed = await updateName(context, entry.id, "Changed");

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Review/TargetLocked");
        expect(blocked.error.data).toEqual({
            reviewId: review.id,
            model: "cms.author",
            targetRevisionId: entry.id,
            reviewState: "inProgress",
            action: "update"
        });
        expect(allowed.isOk()).toBe(true);
    });

    it("keeps approved and rejected revisions locked (D80, D23)", async () => {
        const { context } = await createWorkflowContext();
        const approvedEntry = await createAuthorEntry(context, { name: "Approved" });
        const rejectedEntry = await createAuthorEntry(context, { name: "Rejected" });
        await approveEntryReview(context, await requestEntryReview(context, approvedEntry));
        await rejectEntryReview(context, await requestEntryReview(context, rejectedEntry));

        const approved = await updateName(context, approvedEntry.id, "Changed");
        const rejected = await updateName(context, rejectedEntry.id, "Changed");

        expect(approved.error.code).toBe("Workflows/Review/TargetLocked");
        expect(approved.error.data).toMatchObject({ reviewState: "approved" });
        expect(rejected.error.code).toBe("Workflows/Review/TargetLocked");
        expect(rejected.error.data).toMatchObject({ reviewState: "rejected" });
    });

    it("does not block saving workflows and reviews (R51)", async () => {
        const { context, workflow } = await createWorkflowContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await requestEntryReview(context, entry);

        // The workflow and the review are private CMS entries saved through UpdateEntryUseCase.
        const storedAgain = await storeWorkflow(
            context,
            { ...createWorkflowValues(), name: "Renamed workflow" },
            workflow.savedOn
        );
        const approved = await approveEntryReview(context, review);

        expect(storedAgain.isOk()).toBe(true);
        expect(approved.state).toBe("approved");
    });

    it("updates entries of a model without reviews", async () => {
        const { context } = await createWorkflowContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const updated = await updateName(context, entry.id, "Changed");

        expect(updated.isOk()).toBe(true);
    });

    it("updates entries of an unbound model even when the review lookup fails (D134)", async () => {
        const context = await createUnboundContext([
            (container: Container) => {
                container.registerDecorator(FailingGetTargetReviewDecorator);
            }
        ]);
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const updated = await updateName(context, entry.id, "Changed");

        expect(updated.isOk()).toBe(true);
    });

    it("stops locking an approved revision once its workflow is deleted (D134)", async () => {
        const { context, workflow } = await createWorkflowContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await approveEntryReview(context, await requestEntryReview(context, entry));
        expectOk(
            await context.container
                .resolve(DeleteWorkflowUseCase)
                .execute({ id: workflow.id, actor: ADMIN_ACTOR })
        );

        const updated = await updateName(context, entry.id, "Changed");

        expect(updated.isOk()).toBe(true);
    });

    it("blocks updates when the review lookup fails (fail closed, R54)", async () => {
        const { context } = await createWorkflowContext([
            (container: Container) => {
                container.registerDecorator(FailingGetTargetReviewDecorator);
            }
        ]);
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const blocked = await updateName(context, entry.id, "Changed");

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Review/Persistence");
    });

    it("blocks updates when the workflow lookup fails (fail closed, A38)", async () => {
        const context = await createUnboundContext([
            (container: Container) => {
                container.registerDecorator(FailingListWorkflowsDecorator);
            }
        ]);
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const blocked = await updateName(context, entry.id, "Changed");

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Workflow/Persistence");
    });
});
