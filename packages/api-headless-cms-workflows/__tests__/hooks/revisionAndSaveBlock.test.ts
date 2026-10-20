import { beforeEach, describe, expect, it } from "vitest";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { DeleteWorkflowUseCase } from "@webiny/api-workflows/features/workflow/DeleteWorkflow/index.js";
import { WorkflowBypassService } from "@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js";
import { ADMIN_ACTOR, createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk, getAuthorModel } from "~tests/__helpers/entries.js";
import { createTestContext } from "~tests/__helpers/testContext.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { failGetTargetReview } from "~tests/__helpers/FailingGetTargetReview.js";
import { failListWorkflows } from "~tests/__helpers/FailingListWorkflows.js";
import {
    approveEntryReview,
    cancelEntryReview,
    readEntry,
    rejectEntryReview,
    requestEntryReview
} from "~tests/__helpers/engine.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";

const createWorkflowContext = async (legacyPlugins: unknown[] = []) => {
    const context = await createTestContext({ withWorkflow: false, legacyPlugins });
    const workflow = expectOk(await storeWorkflow(context));
    return { context, workflow };
};

/** No workflow is bound to the test model. */
const createUnboundContext = async (legacyPlugins: unknown[] = []) => {
    return createTestContext({ withWorkflow: false, legacyPlugins });
};

const updateName = async (context: CmsContext, revisionId: string, name: string) => {
    const model = await getAuthorModel(context);
    return context.container.resolve(UpdateEntryUseCase).execute(model, revisionId, {
        values: { name }
    });
};

beforeEach(() => {
    engineCalls.length = 0;
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

    it("lets the save through while the bypass is active, and only then (D36, D62, R150)", async () => {
        const { context } = await createWorkflowContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await requestEntryReview(context, entry);
        const bypass = context.container.resolve(WorkflowBypassService);

        const bypassed = await bypass.run(() => updateName(context, entry.id, "By automation"));
        const blockedAfter = await updateName(context, entry.id, "By someone else");

        expect(bypassed.isOk()).toBe(true);
        expect((await readEntry(context, entry.id)).values.name).toBe("By automation");
        expect(blockedAfter.isFail()).toBe(true);
        expect(blockedAfter.error.code).toBe("Workflows/Review/TargetLocked");
        expect(blockedAfter.error.data).toMatchObject({ reviewId: review.id, action: "update" });
    });

    it("blocks the save again after a bypassed callback throws (finally)", async () => {
        const { context } = await createWorkflowContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await requestEntryReview(context, entry);
        const bypass = context.container.resolve(WorkflowBypassService);

        await expect(
            bypass.run(async () => {
                throw new Error("automation failed");
            })
        ).rejects.toThrow("automation failed");
        const blocked = await updateName(context, entry.id, "Changed");

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Review/TargetLocked");
    });

    it("does not look up the binding or the review while the bypass is active", async () => {
        const { context } = await createWorkflowContext([countEngineCalls]);
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await requestEntryReview(context, entry);
        engineCalls.length = 0;
        const bypass = context.container.resolve(WorkflowBypassService);

        await bypass.run(() => updateName(context, entry.id, "By automation"));

        expect(engineCalls).toEqual([]);
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
        const context = await createUnboundContext([failGetTargetReview]);
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
        const { context } = await createWorkflowContext([failGetTargetReview]);
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const blocked = await updateName(context, entry.id, "Changed");

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Review/Persistence");
    });

    it("blocks updates when the workflow lookup fails (fail closed, A38)", async () => {
        const context = await createUnboundContext([failListWorkflows]);
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const blocked = await updateName(context, entry.id, "Changed");

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Workflow/Persistence");
    });

    it("updates a private model's entry without looking up its binding (R52)", async () => {
        const context = await createTestContext({
            privateModel: true,
            withWorkflow: false,
            legacyPlugins: [countEngineCalls]
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const updated = await updateName(context, entry.id, "Changed");

        expect(updated.isOk()).toBe(true);
        expect(engineCalls).toEqual([]);
    });

    it("creates a revision of a private model's entry without a review state (D59)", async () => {
        const context = await createTestContext({ privateModel: true, withWorkflow: false });
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const model = await getAuthorModel(context);

        const revision = expectOk(
            await context.container
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(model, entry.id, { values: {} })
        );

        expect(revision.system?.workflow).toBeNull();
    });
});
