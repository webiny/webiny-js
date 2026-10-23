import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, createModelEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview, STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createWbReview } from "~tests/__helpers/wbReview.js";
import { SKIP_RECORD_REASON, seedAssignmentRecords } from "~tests/__helpers/seeds.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import {
    EDITOR,
    OTHER_REVIEWER,
    READER,
    REQUESTER,
    REVIEWER
} from "~tests/__helpers/identities.js";
import { CMS_READER, CMS_WRITER, WORKFLOWS_EDITOR } from "~tests/__helpers/permissions.js";
import { createGraphQLClient, type GraphQLClient } from "~tests/__helpers/graphql.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    RecordingEventPublisher,
    recordedEvents
} from "~tests/__helpers/RecordingEventPublisher.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";

const ERROR = "error { code message data }";
const META = "meta { cursor hasMoreItems }";
const WORKFLOW = "id name models savedOn";
const REVIEW = "id title model targetId targetRevisionId state currentStepState currentOwnerId";

const LIST_WORKFLOWS = /* GraphQL */ `
    query ListWorkflows {
        cms {
            listCmsEntryWorkflows {
                data { ${WORKFLOW} }
                ${META}
                ${ERROR}
            }
        }
    }
`;

const GET_WORKFLOW = /* GraphQL */ `
    query GetWorkflow($id: ID!) {
        cms {
            getCmsEntryWorkflow(id: $id) {
                data { ${WORKFLOW} }
                ${ERROR}
            }
        }
    }
`;

const STORE_WORKFLOW = /* GraphQL */ `
    mutation StoreWorkflow($data: WorkflowsWorkflowInput!, $savedOn: String) {
        cms {
            storeCmsEntryWorkflow(data: $data, savedOn: $savedOn) {
                data { ${WORKFLOW} }
                ${ERROR}
            }
        }
    }
`;

const DELETE_WORKFLOW = /* GraphQL */ `
    mutation DeleteWorkflow($id: ID!) {
        cms {
            deleteCmsEntryWorkflow(id: $id) {
                data { ${WORKFLOW} }
                ${ERROR}
            }
        }
    }
`;

const GET_REVIEW = /* GraphQL */ `
    query GetReview($id: ID!) {
        cms {
            getCmsEntryReview(id: $id) {
                data {
                    review {
                        ${REVIEW}
                        steps { id description assignments { kind source userId reason } }
                    }
                    flags { canStart canCancel }
                }
                ${ERROR}
            }
        }
    }
`;

const GET_TARGET_REVIEW = /* GraphQL */ `
    query GetTargetReview($modelId: ID!, $revisionId: ID!) {
        cms {
            getCmsEntryTargetReview(modelId: $modelId, revisionId: $revisionId) {
                data {
                    review {
                        ${REVIEW}
                        steps { id description assignments { kind source userId reason } }
                    }
                    flags { canStart canCancel }
                }
                ${ERROR}
            }
        }
    }
`;

const LIST_REVIEWS = /* GraphQL */ `
    query ListReviews(
        $list: WorkflowsReviewListKind!
        $where: CmsEntryReviewListWhere
        $sort: WorkflowsReviewListSort
        $limit: Int
        $after: String
    ) {
        cms {
            listCmsEntryReviews(
                list: $list
                where: $where
                sort: $sort
                limit: $limit
                after: $after
            ) {
                data {
                    review { ${REVIEW} }
                    flags { canStart canCancel }
                }
                ${META}
                ${ERROR}
            }
        }
    }
`;

const LIST_MODELS = /* GraphQL */ `
    query ListModels($search: String, $limit: Int, $after: String) {
        cms {
            listCmsEntryWorkflowModels(search: $search, limit: $limit, after: $after) {
                data { model modelId name workflow { id name } }
                ${META}
                ${ERROR}
            }
        }
    }
`;

const REQUEST_REVIEW = /* GraphQL */ `
    mutation RequestReview(
        $modelId: ID!
        $revisionId: ID!
        $title: String
        $picks: [WorkflowsReviewPickInput!]
    ) {
        cms {
            requestCmsEntryReview(
                modelId: $modelId
                revisionId: $revisionId
                title: $title
                picks: $picks
            ) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const START_STEP = /* GraphQL */ `
    mutation StartStep($reviewId: ID!, $stepId: ID!) {
        cms {
            startCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const TAKE_OVER_STEP = /* GraphQL */ `
    mutation TakeOverStep($reviewId: ID!, $stepId: ID!, $notifyPreviousOwner: Boolean) {
        cms {
            takeOverCmsEntryReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                notifyPreviousOwner: $notifyPreviousOwner
            ) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const APPROVE_STEP = /* GraphQL */ `
    mutation ApproveStep($reviewId: ID!, $stepId: ID!, $comment: String) {
        cms {
            approveCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId, comment: $comment) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const REJECT_STEP = /* GraphQL */ `
    mutation RejectStep($reviewId: ID!, $stepId: ID!, $comment: String) {
        cms {
            rejectCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId, comment: $comment) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const CANCEL_REVIEW = /* GraphQL */ `
    mutation CancelReview($reviewId: ID!) {
        cms {
            cancelCmsEntryReview(reviewId: $reviewId) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const CANCEL_REVIEWS_FOR_DELETE = /* GraphQL */ `
    mutation CancelReviewsForDelete(
        $modelId: ID!
        $entryId: ID!
        $revisionId: ID
        $action: WorkflowsReviewsForDeleteAction!
    ) {
        cms {
            cancelCmsEntryReviewsForDelete(
                modelId: $modelId
                entryId: $entryId
                revisionId: $revisionId
                action: $action
            ) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...CMS_READER];

/** Runs an operation and returns `data.cms`; a GraphQL-level error fails the test. */
const run = async (client: GraphQLClient, query: string, variables?: Record<string, unknown>) => {
    const body = await client(query, variables);
    expect(body.errors).toBeUndefined();
    return body.data.cms;
};

/**
 * Admin stores the workflow, creates "Ann" (reviewed by REQUESTER), "Bob" (no review) and
 * "Locked" (reviewed by REQUESTER, in "folder-locked").
 */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const unreviewedEntry = await createAuthorEntry(admin, { name: "Bob" });
    const lockedEntry = await createAuthorEntry(admin, {
        name: "Locked",
        folderId: "folder-locked"
    });
    const review = await requestEntryReview(admin, entry);
    const lockedReview = await requestEntryReview(admin, lockedEntry);
    return { admin, entry, unreviewedEntry, lockedEntry, review, lockedReview };
};

describe("CMS workflows GraphQL", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
    });

    it("stores, reads, lists and deletes a workflow as an editor", async () => {
        await createUserContext();
        const editor = createGraphQLClient({ identity: EDITOR, permissions: EDITOR_PERMISSIONS });

        const stored = await run(editor, STORE_WORKFLOW, { data: createWorkflowValues() });
        const updated = await run(editor, STORE_WORKFLOW, {
            data: { ...createWorkflowValues(), name: "Renamed" },
            savedOn: stored.storeCmsEntryWorkflow.data.savedOn
        });
        const read = await run(editor, GET_WORKFLOW, { id: "workflow-1" });
        const listed = await run(editor, LIST_WORKFLOWS);
        const deleted = await run(editor, DELETE_WORKFLOW, { id: "workflow-1" });
        const afterDelete = await run(editor, GET_WORKFLOW, { id: "workflow-1" });

        expect(stored.storeCmsEntryWorkflow.error).toBeNull();
        expect(stored.storeCmsEntryWorkflow.data).toMatchObject({
            id: "workflow-1",
            name: "Test Workflow",
            models: ["cms.author"]
        });
        expect(updated.storeCmsEntryWorkflow.data.name).toBe("Renamed");
        expect(read.getCmsEntryWorkflow.data.name).toBe("Renamed");
        expect(listed.listCmsEntryWorkflows.data.map((row: { id: string }) => row.id)).toEqual([
            "workflow-1"
        ]);
        expect(listed.listCmsEntryWorkflows.meta).toEqual({ cursor: null, hasMoreItems: false });
        expect(deleted.deleteCmsEntryWorkflow.data.id).toBe("workflow-1");
        expect(afterDelete.getCmsEntryWorkflow.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("returns the workflow errors with code and data", async () => {
        await createUserContext();
        const editor = createGraphQLClient({ identity: EDITOR, permissions: EDITOR_PERMISSIONS });
        const reader = createGraphQLClient({ identity: READER, permissions: CMS_READER });

        const refused = await run(reader, STORE_WORKFLOW, { data: createWorkflowValues() });
        const missing = await run(editor, GET_WORKFLOW, { id: "missing-workflow" });
        await run(editor, STORE_WORKFLOW, { data: createWorkflowValues() });
        const stale = await run(editor, STORE_WORKFLOW, {
            data: createWorkflowValues(),
            savedOn: "2000-01-01T00:00:00.000Z"
        });

        expect(refused.storeCmsEntryWorkflow).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to manage workflows.",
                data: { action: "manage workflows" }
            }
        });
        expect(missing.getCmsEntryWorkflow.data).toBeNull();
        expect(missing.getCmsEntryWorkflow.error).toMatchObject({
            code: "Workflows/Workflow/NotFound",
            data: { id: "missing-workflow" }
        });
        expect(stale.storeCmsEntryWorkflow.error.code).toBe("Workflows/Workflow/Conflict");
        expect(stale.storeCmsEntryWorkflow.error.data).toEqual(
            expect.objectContaining({ savedOn: expect.any(String) })
        );
    });

    it("requests a review from the model id and the revision id, with a title (R88, R89)", async () => {
        const { unreviewedEntry } = await createScenario();
        const requester = createGraphQLClient({ identity: REQUESTER, permissions: CMS_WRITER });

        const result = await run(requester, REQUEST_REVIEW, {
            modelId: "author",
            revisionId: unreviewedEntry.id,
            title: "Spring launch"
        });

        expect(result.requestCmsEntryReview.error).toBeNull();
        expect(result.requestCmsEntryReview.data).toMatchObject({
            title: "Spring launch",
            model: "cms.author",
            targetId: unreviewedEntry.entryId,
            targetRevisionId: unreviewedEntry.id,
            state: "inProgress"
        });
    });

    it("returns the request validation and authorization errors", async () => {
        const { unreviewedEntry } = await createScenario();
        const requester = createGraphQLClient({ identity: REQUESTER, permissions: CMS_WRITER });
        const reader = createGraphQLClient({ identity: READER, permissions: CMS_READER });

        const shortTitle = await run(requester, REQUEST_REVIEW, {
            modelId: "author",
            revisionId: unreviewedEntry.id,
            title: "abc"
        });
        const refused = await run(reader, REQUEST_REVIEW, {
            modelId: "author",
            revisionId: unreviewedEntry.id
        });

        expect(shortTitle.requestCmsEntryReview.error).toMatchObject({
            code: "Workflows/Review/Validation",
            message: "The review title must have at least 5 characters."
        });
        expect(refused.requestCmsEntryReview.error).toEqual({
            code: "Workflows/NotAuthorized",
            message: "You are not allowed to request a review.",
            data: { action: "request a review" }
        });
    });

    it("reads a review by id and by revision with the viewer's flags", async () => {
        const { entry, unreviewedEntry, review } = await createScenario();
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });

        const byId = await run(reviewer, GET_REVIEW, { id: review.id });
        const byRevision = await run(reviewer, GET_TARGET_REVIEW, {
            modelId: "author",
            revisionId: entry.id
        });
        const none = await run(reviewer, GET_TARGET_REVIEW, {
            modelId: "author",
            revisionId: unreviewedEntry.id
        });

        expect(byId.getCmsEntryReview.data.review.id).toBe(review.id);
        expect(byId.getCmsEntryReview.data.review.steps[0].description).toBe("This is step 1");
        expect(byId.getCmsEntryReview.data.flags).toEqual({ canStart: true, canCancel: false });
        expect(byRevision.getCmsEntryTargetReview.data.review.id).toBe(review.id);
        expect(none.getCmsEntryTargetReview).toEqual({ data: null, error: null });
    });

    it("reads the same review by id and by revision, assignments included", async () => {
        const { admin, entry, review } = await createScenario();
        await seedAssignmentRecords(admin, review);
        const editor = createGraphQLClient({ identity: EDITOR, permissions: EDITOR_PERMISSIONS });

        const byId = await run(editor, GET_REVIEW, { id: review.id });
        const byRevision = await run(editor, GET_TARGET_REVIEW, {
            modelId: "author",
            revisionId: entry.id
        });

        expect(byRevision.getCmsEntryTargetReview.error).toBeNull();
        expect(byRevision.getCmsEntryTargetReview.data.review.steps[0].assignments).toEqual([
            {
                kind: "skip",
                source: "roundRobin",
                userId: REQUESTER.id,
                reason: SKIP_RECORD_REASON
            },
            { kind: "outcome", source: "pool", userId: null, reason: null }
        ]);
        expect(byRevision.getCmsEntryTargetReview.data).toEqual(byId.getCmsEntryReview.data);
    });

    it("returns the target review refusal with code and data", async () => {
        const { lockedEntry } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });

        const result = await run(reviewer, GET_TARGET_REVIEW, {
            modelId: "author",
            revisionId: lockedEntry.id
        });

        expect(result.getCmsEntryTargetReview).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to view this review.",
                data: { action: "view this review" }
            }
        });
    });

    it("returns NotAuthorized for a revision that does not exist (R108)", async () => {
        await createScenario();
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });

        const result = await run(reviewer, GET_TARGET_REVIEW, {
            modelId: "author",
            revisionId: "missing#0001"
        });

        expect(result.getCmsEntryTargetReview).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to view this review.",
                data: { action: "view this review" }
            }
        });
    });

    it("returns the revision id validation error for a malformed revision id (R107)", async () => {
        await createScenario();
        const requester = createGraphQLClient({ identity: REQUESTER, permissions: CMS_WRITER });

        for (const revisionId of ["#0001", "abc", "abc#x"]) {
            const result = await run(requester, REQUEST_REVIEW, { modelId: "author", revisionId });

            expect(result.requestCmsEntryReview).toEqual({
                data: null,
                error: {
                    code: "Workflows/Review/Validation",
                    message: "The revision id is not valid.",
                    data: null
                }
            });
        }
    });

    it("returns the revision id validation error from the target review read and the cancel for delete (R107)", async () => {
        const { entry } = await createScenario();
        const admin = createGraphQLClient();
        const validation = {
            code: "Workflows/Review/Validation",
            message: "The revision id is not valid.",
            data: null
        };

        for (const revisionId of ["#0001", "abc", "abc#x"]) {
            const read = await run(admin, GET_TARGET_REVIEW, { modelId: "author", revisionId });
            const cancel = await run(admin, CANCEL_REVIEWS_FOR_DELETE, {
                modelId: "author",
                entryId: entry.entryId,
                revisionId,
                action: "trash"
            });

            expect(read.getCmsEntryTargetReview).toEqual({ data: null, error: validation });
            expect(cancel.cancelCmsEntryReviewsForDelete).toEqual({
                data: null,
                error: validation
            });
        }
    });

    it("reports a review of another app as not found (R46)", async () => {
        await createScenario();
        const wbReview = await createWbReview();
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });

        const result = await run(reviewer, GET_REVIEW, { id: wbReview.id });

        expect(result.getCmsEntryReview.data).toBeNull();
        expect(result.getCmsEntryReview.error).toMatchObject({
            code: "Workflows/Review/NotFound",
            data: { id: wbReview.id }
        });
    });

    it("reports a workflow of another app as not found through get and delete (R46)", async () => {
        await createWbReview();
        const editor = createGraphQLClient({ identity: EDITOR, permissions: EDITOR_PERMISSIONS });

        const read = await run(editor, GET_WORKFLOW, { id: "wb-workflow" });
        const deleted = await run(editor, DELETE_WORKFLOW, { id: "wb-workflow" });
        const stillThere = await run(
            createGraphQLClient({ identity: EDITOR, permissions: EDITOR_PERMISSIONS }),
            LIST_WORKFLOWS
        );

        for (const response of [read.getCmsEntryWorkflow, deleted.deleteCmsEntryWorkflow]) {
            expect(response.data).toBeNull();
            expect(response.error).toMatchObject({
                code: "Workflows/Workflow/NotFound",
                data: { id: "wb-workflow" }
            });
        }
        expect(stillThere.listCmsEntryWorkflows.data).toEqual([]);
    });

    it("reports a review of another app as not found for a step action, without changing it (R46)", async () => {
        const wbReview = await createWbReview();
        const reviewer = createGraphQLClient({
            identity: REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [countEngineCalls]
        });

        const result = await run(reviewer, START_STEP, {
            reviewId: wbReview.id,
            stepId: STEP_ID
        });

        expect(result.startCmsEntryReviewStep.data).toBeNull();
        expect(result.startCmsEntryReviewStep.error).toMatchObject({
            code: "Workflows/Review/NotFound",
            data: { id: wbReview.id }
        });
        expect(engineCalls).not.toContain("StartReviewStep");
    });

    it("drops skip entries from the review read for a plain reviewer through GraphQL (R96)", async () => {
        const { admin, review } = await createScenario();
        await seedAssignmentRecords(admin, review);
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });

        const result = await run(reviewer, GET_REVIEW, { id: review.id });

        expect(result.getCmsEntryReview.data.review.steps).toEqual([
            {
                id: STEP_ID,
                description: "This is step 1",
                assignments: [{ kind: "outcome", source: "pool", userId: null, reason: null }]
            }
        ]);
    });

    it("lists only CMS reviews", async () => {
        const { review, lockedReview } = await createScenario();
        await createWbReview();
        const requester = createGraphQLClient({ identity: REQUESTER, permissions: CMS_WRITER });

        const result = await run(requester, LIST_REVIEWS, { list: "myRequests" });

        const rows = result.listCmsEntryReviews.data;
        expect(rows.map((row: { review: { model: string } }) => row.review.model)).toEqual([
            "cms.author",
            "cms.author"
        ]);
        expect(rows.map((row: { review: { id: string } }) => row.review.id).sort()).toEqual(
            [review.id, lockedReview.id].sort()
        );
        expect(result.listCmsEntryReviews.meta).toEqual({ cursor: null, hasMoreItems: false });
        expect(result.listCmsEntryReviews.error).toBeNull();
    });

    it("filters the review list by a second model", async () => {
        const { review } = await createScenario();
        const admin = await createUserContext({ legacyPlugins: createExtraModelPlugins() });
        expectOk(
            await storeWorkflow(admin, {
                ...createWorkflowValues(["cms.book"]),
                id: "workflow-book",
                name: "Books review"
            })
        );
        const book = await createModelEntry(admin, "book", { name: "Dune" });
        const bookReview = await requestEntryReview(admin, book, REQUESTER, "cms.book");
        const requester = createGraphQLClient({
            identity: REQUESTER,
            permissions: CMS_WRITER,
            legacyPlugins: createExtraModelPlugins()
        });

        const books = await run(requester, LIST_REVIEWS, {
            list: "myRequests",
            where: { modelId: "book" }
        });
        const authors = await run(requester, LIST_REVIEWS, {
            list: "myRequests",
            where: { modelId: "author" }
        });

        expect(
            books.listCmsEntryReviews.data.map((row: { review: { id: string } }) => row.review.id)
        ).toEqual([bookReview.id]);
        expect(
            authors.listCmsEntryReviews.data.map(
                (row: { review: { model: string } }) => row.review.model
            )
        ).toEqual(["cms.author", "cms.author"]);
        expect(authors.listCmsEntryReviews.data).not.toContainEqual(
            expect.objectContaining({ review: expect.objectContaining({ id: bookReview.id }) })
        );
        expect(review.model).toBe("cms.author");
    });

    it("filters and pages the review list", async () => {
        const { review, lockedReview } = await createScenario();
        const requester = createGraphQLClient({ identity: REQUESTER, permissions: CMS_WRITER });

        const filtered = await run(requester, LIST_REVIEWS, {
            list: "myRequests",
            where: { modelId: "author", titleContains: "Lock" }
        });
        const first = await run(requester, LIST_REVIEWS, {
            list: "myRequests",
            sort: "lastChangedOn_ASC",
            limit: 1
        });
        const second = await run(requester, LIST_REVIEWS, {
            list: "myRequests",
            sort: "lastChangedOn_ASC",
            limit: 1,
            after: first.listCmsEntryReviews.meta.cursor
        });

        expect(
            filtered.listCmsEntryReviews.data.map(
                (row: { review: { id: string } }) => row.review.id
            )
        ).toEqual([lockedReview.id]);
        expect(first.listCmsEntryReviews.meta.hasMoreItems).toBe(true);
        expect(
            [...first.listCmsEntryReviews.data, ...second.listCmsEntryReviews.data]
                .map((row: { review: { id: string } }) => row.review.id)
                .sort()
        ).toEqual([review.id, lockedReview.id].sort());
    });

    it("returns the failed steps refusal with code, data and no meta (R95)", async () => {
        await createScenario();
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });

        const result = await run(reviewer, LIST_REVIEWS, { list: "failedSteps" });

        expect(result.listCmsEntryReviews).toEqual({
            data: null,
            meta: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to list failed steps.",
                data: { action: "list failed steps" }
            }
        });
    });

    it("starts, takes over and approves a step", async () => {
        const { review } = await createScenario();
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });
        const otherReviewer = createGraphQLClient({
            identity: OTHER_REVIEWER,
            permissions: CMS_READER
        });
        const step = { reviewId: review.id, stepId: STEP_ID };

        const started = await run(reviewer, START_STEP, step);
        const takenOver = await run(otherReviewer, TAKE_OVER_STEP, step);
        const approved = await run(otherReviewer, APPROVE_STEP, { ...step, comment: null });

        expect(started.startCmsEntryReviewStep.data).toMatchObject({
            currentStepState: "inReview",
            currentOwnerId: REVIEWER.id
        });
        expect(takenOver.takeOverCmsEntryReviewStep.data.currentOwnerId).toBe(OTHER_REVIEWER.id);
        expect(approved.approveCmsEntryReviewStep.data.state).toBe("approved");
    });

    describe("take over notifyPreviousOwner (D111)", () => {
        const recorder = (container: Container) => {
            container.registerDecorator(RecordingEventPublisher);
        };

        /** The reviewer starts the step, then OTHER_REVIEWER takes it over with the given variables. */
        const startThenTakeOver = async (variables: Record<string, unknown>) => {
            const { review } = await createScenario();
            const reviewer = createGraphQLClient({
                identity: REVIEWER,
                permissions: CMS_READER,
                legacyPlugins: [recorder]
            });
            const otherReviewer = createGraphQLClient({
                identity: OTHER_REVIEWER,
                permissions: CMS_READER,
                legacyPlugins: [recorder]
            });
            const step = { reviewId: review.id, stepId: STEP_ID };
            await run(reviewer, START_STEP, step);
            recordedEvents.length = 0;
            return run(otherReviewer, TAKE_OVER_STEP, { ...step, ...variables });
        };

        const takenOverFlags = () => {
            return recordedEvents
                .filter(event => event.eventType === "Workflows/Review/StepTakenOver")
                .map(event => event.payload.fact.notifyPreviousOwner);
        };

        it("is true when the argument is omitted", async () => {
            const result = await startThenTakeOver({});

            expect(result.takeOverCmsEntryReviewStep.error).toBeNull();
            expect(takenOverFlags()).toEqual([true]);
        });

        it("is true when the argument is explicitly true", async () => {
            const result = await startThenTakeOver({ notifyPreviousOwner: true });

            expect(result.takeOverCmsEntryReviewStep.error).toBeNull();
            expect(takenOverFlags()).toEqual([true]);
        });

        it("is false when the argument is false", async () => {
            const result = await startThenTakeOver({ notifyPreviousOwner: false });

            expect(result.takeOverCmsEntryReviewStep.error).toBeNull();
            expect(takenOverFlags()).toEqual([false]);
        });

        it("is true when the argument is explicitly null", async () => {
            const result = await startThenTakeOver({ notifyPreviousOwner: null });

            expect(result.takeOverCmsEntryReviewStep.error).toBeNull();
            expect(takenOverFlags()).toEqual([true]);
        });
    });

    it("rejects a step only with a comment of at least 10 characters (R90)", async () => {
        const { review } = await createScenario();
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });
        const step = { reviewId: review.id, stepId: STEP_ID };
        await run(reviewer, START_STEP, step);

        const tooShort = await run(reviewer, REJECT_STEP, { ...step, comment: "  No.  " });
        const rejected = await run(reviewer, REJECT_STEP, {
            ...step,
            comment: "Needs another pass."
        });

        expect(tooShort.rejectCmsEntryReviewStep.error).toMatchObject({
            code: "Workflows/Review/Validation",
            message: "A rejection needs a comment of at least 10 characters."
        });
        expect(rejected.rejectCmsEntryReviewStep.data.state).toBe("rejected");
    });

    it("returns Workflows/NotAuthorized with data through GraphQL", async () => {
        const { review } = await createScenario();
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });
        const requester = createGraphQLClient({ identity: REQUESTER, permissions: CMS_WRITER });

        const refused = await run(reviewer, CANCEL_REVIEW, { reviewId: review.id });
        const cancelled = await run(requester, CANCEL_REVIEW, { reviewId: review.id });

        expect(refused.cancelCmsEntryReview).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to cancel a review requested by someone else.",
                data: { action: "cancel a review requested by someone else" }
            }
        });
        expect(cancelled.cancelCmsEntryReview.data.state).toBe("cancelled");
    });

    it("cancels the reviews of an entry before it is trashed (D134)", async () => {
        const { entry, review } = await createScenario();
        const admin = createGraphQLClient();

        const result = await run(admin, CANCEL_REVIEWS_FOR_DELETE, {
            modelId: "author",
            entryId: entry.entryId,
            action: "trash"
        });

        expect(result.cancelCmsEntryReviewsForDelete.error).toBeNull();
        expect(result.cancelCmsEntryReviewsForDelete.data).toEqual([
            expect.objectContaining({ id: review.id, state: "cancelled" })
        ]);
    });

    it("lists the bindable models for an editor and refuses everyone else (D116)", async () => {
        await createScenario();
        const editor = createGraphQLClient({ identity: EDITOR, permissions: EDITOR_PERMISSIONS });
        const reader = createGraphQLClient({ identity: READER, permissions: CMS_READER });

        const listed = await run(editor, LIST_MODELS, { search: "auth" });
        const refused = await run(reader, LIST_MODELS);

        expect(listed.listCmsEntryWorkflowModels.data).toEqual([
            {
                model: "cms.author",
                modelId: "author",
                name: "Author",
                workflow: { id: "workflow-1", name: "Test Workflow" }
            }
        ]);
        expect(listed.listCmsEntryWorkflowModels.meta).toEqual({
            cursor: null,
            hasMoreItems: false
        });
        expect(refused.listCmsEntryWorkflowModels).toEqual({
            data: null,
            meta: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to manage workflows.",
                data: { action: "manage workflows" }
            }
        });
    });

    it("returns the anonymous refusal with its code", async () => {
        await createScenario();
        const anonymous = createGraphQLClient({ identity: null, permissions: [] });

        const result = await run(anonymous, LIST_REVIEWS, { list: "pool" });

        expect(result.listCmsEntryReviews.error.code).toBe("Workflows/NotAuthenticated");
        expect(result.listCmsEntryReviews.data).toBeNull();
    });
});
