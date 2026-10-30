import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { CreatePageRevisionFromUseCase } from "@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import {
    requestPageReview,
    startPageReview,
    STEP_ID,
    storeWbWorkflow
} from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import { seedAssignments } from "~tests/__helpers/assignments.js";
import {
    NOBODY,
    OTHER_REVIEWER,
    READER,
    REQUESTER,
    REVIEWER,
    WB_DELETER,
    WB_READER,
    WB_WRITER
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    RecordingEventPublisher,
    recordedEvents
} from "~tests/__helpers/RecordingEventPublisher.js";
import {
    APPROVE_STEP,
    asGraphQLUser,
    CANCEL_REVIEW,
    CANCEL_REVIEWS_FOR_DELETE,
    GET_REVIEW,
    GET_TARGET_REVIEW,
    REJECT_STEP,
    REQUEST_REVIEW,
    START_STEP,
    TAKE_OVER_STEP
} from "~tests/__helpers/graphql.js";

/** Admin stores the pages workflow; REQUESTER's review of a root page, plus a page without one. */
const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const lockedPage = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
    const quietPage = await createPage(admin, { title: "Quiet page" });
    const review = await requestPageReview(admin, page);
    return { admin, page, lockedPage, quietPage, review };
};

const REVISION_ID_ERROR = {
    code: "Workflows/Review/Validation",
    message: "The revision id is not valid.",
    data: null
};

/** Malformed revision ids; an empty string is given, so it is validated and refused (R107). */
const MALFORMED_REVISION_IDS = ["", "#0001", "abc", "abc#x", "abc#0"];

describe("WB review operations through GraphQL", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
    });

    it("requests a review with a title; the resolver derives the page id from the revision id", async () => {
        const { quietPage } = await createScenario();
        const requester = asGraphQLUser({ identity: REQUESTER, permissions: WB_WRITER });

        const body = await requester.run(REQUEST_REVIEW, {
            revisionId: quietPage.id,
            title: "Homepage launch"
        });
        const result = body.data.websiteBuilder.requestWebsiteBuilderPageReview;

        expect(result.error).toBeNull();
        expect(result.data).toMatchObject({
            model: "wb.page",
            targetId: quietPage.entryId,
            targetRevisionId: quietPage.id,
            title: "Homepage launch",
            state: "inProgress",
            currentStepType: "review",
            createdBy: { id: REQUESTER.id, displayName: REQUESTER.displayName }
        });
    });

    it("returns the title validation error and Workflows/NotAuthorized with their codes", async () => {
        const { quietPage } = await createScenario();
        const requester = asGraphQLUser({ identity: REQUESTER, permissions: WB_WRITER });
        const reader = asGraphQLUser({ identity: READER, permissions: WB_READER });

        const short = await requester.run(REQUEST_REVIEW, {
            revisionId: quietPage.id,
            title: "Home"
        });
        const refused = await reader.run(REQUEST_REVIEW, { revisionId: quietPage.id });

        const shortResult = short.data.websiteBuilder.requestWebsiteBuilderPageReview;
        expect(shortResult.data).toBeNull();
        expect(shortResult.error.code).toBe("Workflows/Review/Validation");
        expect(shortResult.error.message).toBe("The review title must have at least 5 characters.");
        const refusedResult = refused.data.websiteBuilder.requestWebsiteBuilderPageReview;
        expect(refusedResult.error.code).toBe("Workflows/NotAuthorized");
        expect(refusedResult.error.data).toEqual({ action: "request a review" });
    });

    it("returns the revision id validation error for a malformed revision id (R107)", async () => {
        await createScenario();
        const requester = asGraphQLUser({ identity: REQUESTER, permissions: WB_WRITER });

        for (const revisionId of MALFORMED_REVISION_IDS) {
            const body = await requester.run(REQUEST_REVIEW, { revisionId });

            expect(body.errors).toBeUndefined();
            expect(body.data.websiteBuilder.requestWebsiteBuilderPageReview).toEqual({
                data: null,
                error: REVISION_ID_ERROR
            });
        }
    });

    it("returns the revision id validation error from the target review read (R107)", async () => {
        await createScenario();
        const reviewer = asGraphQLUser({
            identity: REVIEWER,
            permissions: WB_READER,
            legacyPlugins: [countEngineCalls]
        });

        for (const revisionId of MALFORMED_REVISION_IDS) {
            const body = await reviewer.run(GET_TARGET_REVIEW, { revisionId });

            expect(body.errors).toBeUndefined();
            expect(body.data.websiteBuilder.getWebsiteBuilderPageTargetReview).toEqual({
                data: null,
                error: REVISION_ID_ERROR
            });
        }
        expect(engineCalls).toEqual([]);
    });

    it("reads the same review by id and by revision, assignments included", async () => {
        const { admin, page, review } = await createScenario();
        const { outcome, skip } = await seedAssignments(admin, review);
        const editor = asGraphQLUser();

        const byId = await editor.run(GET_REVIEW, { id: review.id });
        const byRevision = await editor.run(GET_TARGET_REVIEW, { revisionId: page.id });

        const byIdResult = byId.data.websiteBuilder.getWebsiteBuilderPageReview;
        const byRevisionResult = byRevision.data.websiteBuilder.getWebsiteBuilderPageTargetReview;
        expect(byRevisionResult.error).toBeNull();
        expect(byRevisionResult.data.review.steps[0].assignments).toEqual([
            { id: outcome.id, kind: "outcome", source: "pool", userId: null, reason: null },
            {
                id: skip.id,
                kind: "skip",
                source: "picked",
                userId: REVIEWER.id,
                reason: "pick excluded"
            }
        ]);
        expect(byRevisionResult.data).toEqual(byIdResult.data);
    });

    it("reports a Headless CMS review as not found for a step action, without changing it (R46)", async () => {
        const { admin } = await createScenario();
        const cmsReview = await createCmsReview(admin);
        const reviewer = asGraphQLUser({
            identity: REVIEWER,
            permissions: WB_READER,
            legacyPlugins: [countEngineCalls]
        });

        const body = await reviewer.run(START_STEP, { reviewId: cmsReview.id, stepId: STEP_ID });
        const result = body.data.websiteBuilder.startWebsiteBuilderPageReviewStep;

        expect(result.data).toBeNull();
        expect(result.error).toMatchObject({
            code: "Workflows/Review/NotFound",
            data: { id: cmsReview.id }
        });
        expect(engineCalls).not.toContain("StartReviewStep");
    });

    it("gets a review with flags and redacted assignment entries, and not a Headless CMS review (R46)", async () => {
        const { admin, review } = await createScenario();
        const { outcome } = await seedAssignments(admin, review);
        const cmsReview = await createCmsReview(admin);
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });

        const read = await reviewer.run(GET_REVIEW, { id: review.id });
        const cms = await reviewer.run(GET_REVIEW, { id: cmsReview.id });

        const readResult = read.data.websiteBuilder.getWebsiteBuilderPageReview;
        expect(readResult.error).toBeNull();
        expect(readResult.data.review.id).toBe(review.id);
        expect(readResult.data.flags).toEqual({
            canStart: true,
            canTakeOver: false,
            canApprove: false,
            canReject: false,
            canCancel: false,
            canReassign: false,
            canRestart: false
        });
        expect(readResult.data.review.steps[0].description).toBe("This is step 1");
        expect(readResult.data.review.steps[0].assignments).toEqual([
            { id: outcome.id, kind: "outcome", source: "pool", userId: null, reason: null }
        ]);
        const cmsResult = cms.data.websiteBuilder.getWebsiteBuilderPageReview;
        expect(cmsResult.data).toBeNull();
        expect(cmsResult.error.code).toBe("Workflows/Review/NotFound");
        expect(cmsResult.error.data).toEqual({ id: cmsReview.id });
    });

    it("gets the target review of a revision, null without one, and refuses an unreadable page", async () => {
        const { admin, page, lockedPage, quietPage, review } = await createScenario();
        await requestPageReview(admin, lockedPage);
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });

        const withReview = await reviewer.run(GET_TARGET_REVIEW, { revisionId: page.id });
        const without = await reviewer.run(GET_TARGET_REVIEW, { revisionId: quietPage.id });
        const locked = await reviewer.run(GET_TARGET_REVIEW, { revisionId: lockedPage.id });

        expect(
            withReview.data.websiteBuilder.getWebsiteBuilderPageTargetReview.data.review.id
        ).toBe(review.id);
        expect(without.data.websiteBuilder.getWebsiteBuilderPageTargetReview).toEqual({
            data: null,
            error: null
        });
        const lockedResult = locked.data.websiteBuilder.getWebsiteBuilderPageTargetReview;
        expect(lockedResult.error.code).toBe("Workflows/NotAuthorized");
        expect(lockedResult.error.data).toEqual({ action: "view this review" });
    });

    it("starts, takes over and approves a step", async () => {
        const { review } = await createScenario();
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });
        const otherReviewer = asGraphQLUser({ identity: OTHER_REVIEWER, permissions: WB_READER });

        const started = await reviewer.run(START_STEP, { reviewId: review.id, stepId: STEP_ID });
        const takenOver = await otherReviewer.run(TAKE_OVER_STEP, {
            reviewId: review.id,
            stepId: STEP_ID
        });
        const approved = await otherReviewer.run(APPROVE_STEP, {
            reviewId: review.id,
            stepId: STEP_ID,
            comment: "Looks good."
        });

        const startResult = started.data.websiteBuilder.startWebsiteBuilderPageReviewStep;
        expect(startResult.error).toBeNull();
        expect(startResult.data.steps[0]).toMatchObject({
            state: "inReview",
            owner: { id: REVIEWER.id }
        });
        expect(
            takenOver.data.websiteBuilder.takeOverWebsiteBuilderPageReviewStep.data.steps[0].owner
        ).toEqual({ id: OTHER_REVIEWER.id });
        const approveResult = approved.data.websiteBuilder.approveWebsiteBuilderPageReviewStep;
        expect(approveResult.error).toBeNull();
        expect(approveResult.data.state).toBe("approved");
        expect(approveResult.data.steps[0].comment).toBe("Looks good.");
    });

    describe("take over notifyPreviousOwner (D111)", () => {
        const recorder = (container: Container) => {
            container.registerDecorator(RecordingEventPublisher);
        };

        /** The reviewer starts the step, then OTHER_REVIEWER takes it over with the given variables. */
        const startThenTakeOver = async (variables: Record<string, unknown>) => {
            const { review } = await createScenario();
            const reviewer = asGraphQLUser({
                identity: REVIEWER,
                permissions: WB_READER,
                legacyPlugins: [recorder]
            });
            const otherReviewer = asGraphQLUser({
                identity: OTHER_REVIEWER,
                permissions: WB_READER,
                legacyPlugins: [recorder]
            });
            const step = { reviewId: review.id, stepId: STEP_ID };
            await reviewer.run(START_STEP, step);
            recordedEvents.length = 0;
            const body = await otherReviewer.run(TAKE_OVER_STEP, { ...step, ...variables });
            return body.data.websiteBuilder.takeOverWebsiteBuilderPageReviewStep;
        };

        const takenOverFlags = () => {
            return recordedEvents
                .filter(event => event.eventType === "Workflows/Review/StepTakenOver")
                .map(event => event.payload.fact.notifyPreviousOwner);
        };

        it("is true when the argument is omitted", async () => {
            const result = await startThenTakeOver({});

            expect(result.error).toBeNull();
            expect(takenOverFlags()).toEqual([true]);
        });

        it("is true when the argument is explicitly true", async () => {
            const result = await startThenTakeOver({ notifyPreviousOwner: true });

            expect(result.error).toBeNull();
            expect(takenOverFlags()).toEqual([true]);
        });

        it("is false when the argument is false", async () => {
            const result = await startThenTakeOver({ notifyPreviousOwner: false });

            expect(result.error).toBeNull();
            expect(takenOverFlags()).toEqual([false]);
        });

        it("is true when the argument is explicitly null", async () => {
            const result = await startThenTakeOver({ notifyPreviousOwner: null });

            expect(result.error).toBeNull();
            expect(takenOverFlags()).toEqual([true]);
        });
    });

    it("returns Workflows/Review/NotCandidate with data to a reader outside the step's teams", async () => {
        const { review } = await createScenario();
        const outsider = asGraphQLUser({ identity: NOBODY, permissions: WB_READER });

        const body = await outsider.run(START_STEP, { reviewId: review.id, stepId: STEP_ID });
        const result = body.data.websiteBuilder.startWebsiteBuilderPageReviewStep;

        expect(result.data).toBeNull();
        expect(result.error.code).toBe("Workflows/Review/NotCandidate");
        expect(result.error.data).toEqual({ reviewId: review.id, stepId: STEP_ID });
    });

    it("rejects a step only with a comment of at least 10 characters (D100)", async () => {
        const { admin, review } = await createScenario();
        await startPageReview(admin, review);
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });

        const short = await reviewer.run(REJECT_STEP, {
            reviewId: review.id,
            stepId: STEP_ID,
            comment: "Too short"
        });
        const rejected = await reviewer.run(REJECT_STEP, {
            reviewId: review.id,
            stepId: STEP_ID,
            comment: "Needs another pass."
        });

        const shortResult = short.data.websiteBuilder.rejectWebsiteBuilderPageReviewStep;
        expect(shortResult.error.code).toBe("Workflows/Review/Validation");
        expect(shortResult.error.message).toBe(
            "A rejection needs a comment of at least 10 characters."
        );
        const rejectResult = rejected.data.websiteBuilder.rejectWebsiteBuilderPageReviewStep;
        expect(rejectResult.error).toBeNull();
        expect(rejectResult.data.state).toBe("rejected");
    });

    it("cancels a review as its requester and refuses another user with data", async () => {
        const { review } = await createScenario();
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });
        const requester = asGraphQLUser({ identity: REQUESTER, permissions: WB_WRITER });

        const refused = await reviewer.run(CANCEL_REVIEW, { reviewId: review.id });
        const cancelled = await requester.run(CANCEL_REVIEW, { reviewId: review.id });

        const refusedResult = refused.data.websiteBuilder.cancelWebsiteBuilderPageReview;
        expect(refusedResult.error.code).toBe("Workflows/NotAuthorized");
        expect(refusedResult.error.data).toEqual({
            action: "cancel a review requested by someone else"
        });
        const cancelResult = cancelled.data.websiteBuilder.cancelWebsiteBuilderPageReview;
        expect(cancelResult.error).toBeNull();
        expect(cancelResult.data).toMatchObject({ state: "cancelled", isActive: false });
    });

    it("cancels a page's reviews before a trash, by page id, only with delete access (D134)", async () => {
        const { page, review } = await createScenario();
        const reader = asGraphQLUser({ identity: READER, permissions: WB_READER });
        const deleter = asGraphQLUser({ identity: REQUESTER, permissions: WB_DELETER });

        const refused = await reader.run(CANCEL_REVIEWS_FOR_DELETE, {
            pageId: page.entryId,
            action: "trash"
        });
        const cancelled = await deleter.run(CANCEL_REVIEWS_FOR_DELETE, {
            pageId: page.entryId,
            action: "trash"
        });

        const refusedResult = refused.data.websiteBuilder.cancelWebsiteBuilderPageReviewsForDelete;
        expect(refusedResult.error.code).toBe("Workflows/NotAuthorized");
        expect(refusedResult.error.data).toEqual({
            action: "cancel the review to delete this content"
        });
        const cancelResult = cancelled.data.websiteBuilder.cancelWebsiteBuilderPageReviewsForDelete;
        expect(cancelResult.error).toBeNull();
        expect(cancelResult.data).toHaveLength(1);
        expect(cancelResult.data[0]).toMatchObject({ id: review.id, state: "cancelled" });
    });

    it("cancels only the given revision's review when revisionId is given (R235)", async () => {
        const { admin, page, review } = await createScenario();
        const second = expectOk(
            await admin.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
        );
        const secondReview = await requestPageReview(admin, second);
        const deleter = asGraphQLUser({ identity: REQUESTER, permissions: WB_DELETER });

        const body = await deleter.run(CANCEL_REVIEWS_FOR_DELETE, {
            pageId: page.entryId,
            revisionId: second.id,
            action: "delete"
        });

        const result = body.data.websiteBuilder.cancelWebsiteBuilderPageReviewsForDelete;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toMatchObject({ id: secondReview.id, state: "cancelled" });
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("cancels every revision's review when revisionId is omitted (unchanged)", async () => {
        const { admin, page, review } = await createScenario();
        const second = expectOk(
            await admin.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
        );
        const secondReview = await requestPageReview(admin, second);
        const deleter = asGraphQLUser({ identity: REQUESTER, permissions: WB_DELETER });

        const body = await deleter.run(CANCEL_REVIEWS_FOR_DELETE, {
            pageId: page.entryId,
            action: "trash"
        });

        const result = body.data.websiteBuilder.cancelWebsiteBuilderPageReviewsForDelete;
        expect(result.error).toBeNull();
        expect(result.data.map((item: { id: string }) => item.id).sort()).toEqual(
            [review.id, secondReview.id].sort()
        );
    });

    it("returns the revision id validation error for a malformed revisionId (R107)", async () => {
        const { page } = await createScenario();
        const deleter = asGraphQLUser({ identity: REQUESTER, permissions: WB_DELETER });

        for (const revisionId of MALFORMED_REVISION_IDS) {
            const body = await deleter.run(CANCEL_REVIEWS_FOR_DELETE, {
                pageId: page.entryId,
                revisionId,
                action: "delete"
            });

            expect(body.data.websiteBuilder.cancelWebsiteBuilderPageReviewsForDelete).toEqual({
                data: null,
                error: REVISION_ID_ERROR
            });
        }
    });
});
