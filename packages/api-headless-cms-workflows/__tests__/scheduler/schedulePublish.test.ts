import { beforeEach, describe, expect, it } from "vitest";
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import {
    ScheduleActionUseCase,
    type ScheduledActionType
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { createAuthorEntry } from "~tests/__helpers/entries.js";
import { createTestContext } from "~tests/__helpers/testContext.js";
import {
    recordScheduleAction,
    scheduledRequests
} from "~tests/__helpers/RecordingScheduleAction.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { failGetActiveTargetReview } from "~tests/__helpers/FailingGetActiveTargetReview.js";
import {
    approveEntryReview,
    cancelEntryReview,
    rejectEntryReview,
    requestEntryReview
} from "~tests/__helpers/engine.js";

const schedule = async (
    context: CmsContext,
    entry: CmsEntry,
    actionType: ScheduledActionType,
    namespace = "Cms/Entry/author"
) => {
    return context.container.resolve(ScheduleActionUseCase).execute({
        tenant: "root",
        namespace,
        targetId: entry.id,
        actionType,
        scheduleFor: new Date(Date.now() + 60 * 60 * 1000)
    });
};

beforeEach(() => {
    scheduledRequests.length = 0;
    engineCalls.length = 0;
});

describe("CMS schedule publish rule", () => {
    it("schedules the publish of a revision with an approved review", async () => {
        const context = await createTestContext({ legacyPlugins: [recordScheduleAction] });
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await approveEntryReview(context, await requestEntryReview(context, entry));

        const result = await schedule(context, entry, "publish");

        expect(result.isOk()).toBe(true);
        expect(scheduledRequests).toHaveLength(1);
    });

    it("refuses to schedule the publish of a revision without a review", async () => {
        const context = await createTestContext({ legacyPlugins: [recordScheduleAction] });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const result = await schedule(context, entry, "publish");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/PublishBlocked");
        expect(result.error.message).toBe(
            "This content can only be published after its review is approved. Request a review first."
        );
        expect(result.error.data).toEqual({
            model: "cms.author",
            targetRevisionId: entry.id,
            workflowId: "workflow-1",
            reviewState: null
        });
        expect(scheduledRequests).toHaveLength(0);
    });

    it("refuses to schedule the publish while the review is in progress or rejected", async () => {
        const context = await createTestContext({ legacyPlugins: [recordScheduleAction] });
        const inProgress = await createAuthorEntry(context, { name: "In progress" });
        const rejected = await createAuthorEntry(context, { name: "Rejected" });
        await requestEntryReview(context, inProgress);
        await rejectEntryReview(context, await requestEntryReview(context, rejected));

        const inProgressResult = await schedule(context, inProgress, "publish");
        const rejectedResult = await schedule(context, rejected, "publish");

        expect(inProgressResult.error.code).toBe("Workflows/Review/PublishBlocked");
        expect(inProgressResult.error.data).toMatchObject({ reviewState: "inProgress" });
        expect(rejectedResult.error.code).toBe("Workflows/Review/PublishBlocked");
        expect(rejectedResult.error.data).toMatchObject({ reviewState: "rejected" });
        expect(scheduledRequests).toHaveLength(0);
    });

    it("refuses to schedule the publish after the review was cancelled", async () => {
        const context = await createTestContext({ legacyPlugins: [recordScheduleAction] });
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await cancelEntryReview(context, await requestEntryReview(context, entry));

        const result = await schedule(context, entry, "publish");

        expect(result.error.code).toBe("Workflows/Review/PublishBlocked");
        expect(result.error.data).toMatchObject({ reviewState: null });
        expect(scheduledRequests).toHaveLength(0);
    });

    it("refuses to schedule the publish when the review lookup fails (fail closed)", async () => {
        const context = await createTestContext({
            legacyPlugins: [recordScheduleAction, failGetActiveTargetReview]
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const result = await schedule(context, entry, "publish");

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(scheduledRequests).toHaveLength(0);
    });

    it("schedules the publish on a model without a workflow", async () => {
        const context = await createTestContext({
            legacyPlugins: [recordScheduleAction],
            withWorkflow: false
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const result = await schedule(context, entry, "publish");

        expect(result.isOk()).toBe(true);
        expect(scheduledRequests).toHaveLength(1);
    });

    it("schedules the unpublish without a review", async () => {
        const context = await createTestContext({ legacyPlugins: [recordScheduleAction] });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const result = await schedule(context, entry, "unpublish");

        expect(result.isOk()).toBe(true);
        expect(scheduledRequests).toHaveLength(1);
    });

    it("leaves other namespaces and private models to their apps (R52)", async () => {
        const context = await createTestContext({
            legacyPlugins: [recordScheduleAction, countEngineCalls],
            privateModel: true,
            withWorkflow: false
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const privateModel = await schedule(context, entry, "publish");
        const otherNamespace = await schedule(context, entry, "publish", "Mailer/Message");

        expect(privateModel.isOk()).toBe(true);
        expect(otherNamespace.isOk()).toBe(true);
        expect(scheduledRequests).toHaveLength(2);
        expect(engineCalls).toEqual([]);
    });
});
