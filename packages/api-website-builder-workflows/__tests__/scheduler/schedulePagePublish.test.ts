import { afterEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import {
    ScheduleActionUseCase,
    type ScheduledActionType
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import {
    approvePageReview,
    cancelPageReview,
    rejectPageReview,
    requestPageReview,
    storeWbWorkflow
} from "~tests/__helpers/engine.js";
import { READER, WB_READER } from "~tests/__helpers/identities.js";
import {
    recordScheduleAction,
    scheduledRequests
} from "~tests/__helpers/RecordingScheduleAction.js";

const PAGE_NAMESPACE = "WebsiteBuilder/Type/page";

const createContext = () => {
    return createUserContext({
        permissionsByIdentity: { [READER.id]: WB_READER },
        legacyPlugins: [recordScheduleAction]
    });
};

const schedule = async (
    context: CmsContext,
    targetId: string,
    actionType: ScheduledActionType,
    namespace = PAGE_NAMESPACE
) => {
    return context.container.resolve(ScheduleActionUseCase).execute({
        tenant: "root",
        namespace,
        targetId,
        actionType,
        scheduleFor: new Date(Date.now() + 60 * 60 * 1000)
    });
};

describe("WB schedule page publish rule", () => {
    afterEach(() => {
        scheduledRequests.length = 0;
    });

    it("schedules the publish of a page revision with an approved review", async () => {
        const context = await createContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Approved" });
        await approvePageReview(context, await requestPageReview(context, page));

        const result = await schedule(context, page.id, "publish");

        expect(result.isOk()).toBe(true);
        expect(scheduledRequests).toHaveLength(1);
    });

    it("refuses to schedule the publish of a page revision without a review", async () => {
        const context = await createContext();
        const workflow = await storeWbWorkflow(context);
        const page = await createPage(context, { title: "No review" });

        const result = await schedule(context, page.id, "publish");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/PublishBlocked");
        expect(result.error.message).toBe(
            "This content can only be published after its review is approved. Request a review first."
        );
        expect(result.error.data).toEqual({
            model: "wb.page",
            targetRevisionId: page.id,
            workflowId: workflow.id,
            reviewState: null
        });
        expect(scheduledRequests).toHaveLength(0);
    });

    it("refuses to schedule the publish while the review is in progress, rejected or cancelled", async () => {
        const context = await createContext();
        await storeWbWorkflow(context);
        const inProgress = await createPage(context, { title: "In progress" });
        await requestPageReview(context, inProgress);
        const rejected = await createPage(context, { title: "Rejected" });
        await rejectPageReview(context, await requestPageReview(context, rejected));
        const cancelled = await createPage(context, { title: "Cancelled" });
        await cancelPageReview(context, await requestPageReview(context, cancelled));

        const inProgressResult = await schedule(context, inProgress.id, "publish");
        const rejectedResult = await schedule(context, rejected.id, "publish");
        const cancelledResult = await schedule(context, cancelled.id, "publish");

        expect(inProgressResult.error.code).toBe("Workflows/Review/PublishBlocked");
        expect(inProgressResult.error.data).toMatchObject({ reviewState: "inProgress" });
        expect(rejectedResult.error.code).toBe("Workflows/Review/PublishBlocked");
        expect(rejectedResult.error.data).toMatchObject({ reviewState: "rejected" });
        expect(cancelledResult.error.code).toBe("Workflows/Review/PublishBlocked");
        expect(cancelledResult.error.data).toMatchObject({ reviewState: null });
        expect(scheduledRequests).toHaveLength(0);
    });

    it("schedules the publish without a pages workflow", async () => {
        const context = await createContext();
        const page = await createPage(context, { title: "Unbound" });

        const result = await schedule(context, page.id, "publish");

        expect(result.isOk()).toBe(true);
        expect(scheduledRequests).toHaveLength(1);
    });

    it("schedules the unpublish and redirect actions without a review", async () => {
        const context = await createContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "No review" });

        const unpublish = await schedule(context, page.id, "unpublish");
        const redirect = await schedule(
            context,
            "redirect-1",
            "publish",
            "WebsiteBuilder/Type/redirect"
        );

        expect(unpublish.isOk()).toBe(true);
        expect(redirect.isOk()).toBe(true);
        expect(scheduledRequests).toHaveLength(2);
    });
});
