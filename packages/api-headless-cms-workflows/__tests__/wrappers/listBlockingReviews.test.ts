import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowBlockingReview } from "@webiny/api-workflows/domain/workflow/types.js";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import {
    AUTHOR_NAMESPACE,
    createAuthorEntry,
    expectOk,
    getAuthorModel
} from "~tests/__helpers/entries.js";
import {
    approveEntryReview,
    cancelEntryReview,
    rejectEntryReview,
    requestEntryReview
} from "~tests/__helpers/engine.js";
import { createUserContext, type UserContextParams } from "~tests/__helpers/userContext.js";
import { READER, WRITER } from "~tests/__helpers/identities.js";
import {
    CMS_ENTRY_READER_WITHOUT_MODEL,
    CMS_OWN_WRITER,
    CMS_READER,
    CMS_READER_WITHOUT_GROUP_READ
} from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingCmsEntryAccess.js";
import { failListTargetReviews } from "~tests/__helpers/FailingListTargetReviews.js";
import { failGetBoundWorkflow } from "~tests/__helpers/FailingGetBoundWorkflow.js";
import { failGetLatestEntries } from "~tests/__helpers/FailingGetLatestEntries.js";
import {
    latestEntryReads,
    recordLatestEntryReads
} from "~tests/__helpers/RecordingGetLatestEntries.js";
import {
    listTargetReviewsConcurrency,
    probeListTargetReviewsConcurrency,
    resetListTargetReviewsConcurrency
} from "~tests/__helpers/ConcurrencyProbeListTargetReviews.js";
import { modelReads, recordModelReads } from "~tests/__helpers/RecordingGetModel.js";
import { groupReads, recordGroupReads } from "~tests/__helpers/RecordingGetGroup.js";
import { seedReviewOnTarget } from "~tests/__helpers/seeds.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";
import {
    BLOCKING_REVIEWS_CONCURRENCY,
    BLOCKING_REVIEWS_MAX_IDS,
    ListCmsEntryBlockingReviewsUseCase
} from "~/features/wrappers/ListCmsEntryBlockingReviews/index.js";

/** Model and group read, but no entry permission at all. */
const CMS_MODEL_READER_WITHOUT_ENTRIES: SecurityPermission[] = [
    { name: "cms.contentModelGroup", rwd: "r" },
    { name: "cms.contentModel", rwd: "r" }
];

/**
 * Admin stores the workflow; REQUESTER asks for a review of "Ann" and of "Bob" (both in the root
 * folder). The test workflow has one step, "Step 1".
 */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const ann = await createAuthorEntry(admin, { name: "Ann" });
    const bob = await createAuthorEntry(admin, { name: "Bob" });
    const annReview = await requestEntryReview(admin, ann);
    const bobReview = await requestEntryReview(admin, bob);
    return { admin, ann, bob, annReview, bobReview };
};

/**
 * READER (reads every entry, no workflows permission) by default. The context counts the engine's
 * calls, records the latest-entry reads and can throw on access checks; setup contexts do not.
 */
const createViewer = (params: UserContextParams = {}) => {
    return createUserContext({
        identity: READER,
        permissions: CMS_READER,
        ...params,
        legacyPlugins: [
            countEngineCalls,
            recordLatestEntryReads,
            recordModelReads,
            recordGroupReads,
            throwOnAccessChecks,
            ...(params.legacyPlugins ?? [])
        ]
    });
};

const listBlocking = (context: CmsContext, input: ListCmsEntryBlockingReviewsUseCase.Input) => {
    return context.container.resolve(ListCmsEntryBlockingReviewsUseCase).execute(input);
};

/** The row the query returns for a review of the author model's first revision. */
const toExpectedRow = (
    review: ReviewData,
    entry: CmsEntry,
    title: string
): WorkflowBlockingReview => {
    return {
        reviewId: review.id,
        model: AUTHOR_NAMESPACE,
        targetId: entry.entryId,
        targetRevisionId: entry.id,
        title,
        stepPosition: 1,
        stepCount: 1,
        stepName: "Step 1"
    };
};

/** Ids of entries that do not exist, so they have no review. */
const createFillerIds = (count: number): string[] => {
    return Array.from({ length: count }, (_, index) => `filler-${index}`);
};

describe("CMS blocking reviews wrapper (R265)", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        latestEntryReads.length = 0;
        modelReads.length = 0;
        groupReads.length = 0;
        resetListTargetReviewsConcurrency();
    });

    afterEach(() => {
        folderLevels.clear();
        throwingAccessChecks.clear();
    });

    it("lists the reviews in progress of the entries, in the order of the ids, for a viewer without a workflows permission", async () => {
        const { ann, bob, annReview, bobReview } = await createScenario();
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [bob.entryId, ann.entryId]
            })
        );

        expect(reviews).toEqual([
            toExpectedRow(bobReview, bob, "Bob"),
            toExpectedRow(annReview, ann, "Ann")
        ]);
    });

    it("lists the reviews of every revision of an entry", async () => {
        const { admin, ann, annReview } = await createScenario();
        const model = await getAuthorModel(admin);
        const second = expectOk(
            await admin.container
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(model, ann.id, { values: {} })
        );
        const secondReview = await requestEntryReview(admin, second);
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, { modelId: "author", entryIds: [ann.entryId] })
        );

        expect(reviews.map(review => review.reviewId).sort()).toEqual(
            [annReview.id, secondReview.id].sort()
        );
        expect(reviews.map(review => review.targetRevisionId).sort()).toEqual(
            [ann.id, second.id].sort()
        );
    });

    it("leaves out reviews that are approved or cancelled", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const ann = await createAuthorEntry(admin, { name: "Ann" });
        const bob = await createAuthorEntry(admin, { name: "Bob" });
        const cara = await createAuthorEntry(admin, { name: "Cara" });
        await approveEntryReview(admin, await requestEntryReview(admin, ann));
        await cancelEntryReview(admin, await requestEntryReview(admin, bob));
        const caraReview = await requestEntryReview(admin, cara);
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [ann.entryId, bob.entryId, cara.entryId]
            })
        );

        expect(reviews).toEqual([toExpectedRow(caraReview, cara, "Cara")]);
    });

    it("leaves out a rejected review", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const ann = await createAuthorEntry(admin, { name: "Ann" });
        const bob = await createAuthorEntry(admin, { name: "Bob" });
        await rejectEntryReview(admin, await requestEntryReview(admin, ann));
        const bobReview = await requestEntryReview(admin, bob);
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [ann.entryId, bob.entryId]
            })
        );

        expect(reviews).toEqual([toExpectedRow(bobReview, bob, "Bob")]);
    });

    it("reads the model and its group once, however many batches run", async () => {
        const { ann, annReview } = await createScenario();
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [...createFillerIds(25), ann.entryId]
            })
        );

        expect(reviews).toEqual([toExpectedRow(annReview, ann, "Ann")]);
        expect(modelReads.filter(modelId => modelId === "author")).toHaveLength(1);
        expect(groupReads).toHaveLength(1);
    });

    it("looks a repeated id up once", async () => {
        const { ann, annReview } = await createScenario();
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [ann.entryId, ann.entryId, ann.entryId]
            })
        );

        expect(reviews).toEqual([toExpectedRow(annReview, ann, "Ann")]);
        expect(engineCalls.filter(call => call === "ListTargetReviews")).toHaveLength(1);
    });

    it("reads the latest entries once per batch, only for the ids that have a review", async () => {
        const { admin, ann, bob } = await createScenario();
        const idle = await createAuthorEntry(admin, { name: "Idle" });
        const viewer = await createViewer();

        expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [ann.entryId, idle.entryId, bob.entryId]
            })
        );

        expect(latestEntryReads).toEqual([[ann.entryId, bob.entryId]]);
    });

    it("reads nothing about entries when no id has a review", async () => {
        await createScenario();
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, { modelId: "author", entryIds: createFillerIds(3) })
        );

        expect(reviews).toEqual([]);
        expect(latestEntryReads).toEqual([]);
    });

    it("looks the reviews up in batches of ten", async () => {
        const { ann, annReview } = await createScenario();
        const viewer = await createViewer({ legacyPlugins: [probeListTargetReviewsConcurrency] });

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [...createFillerIds(35), ann.entryId]
            })
        );

        expect(reviews).toEqual([toExpectedRow(annReview, ann, "Ann")]);
        expect(listTargetReviewsConcurrency.max).toBe(BLOCKING_REVIEWS_CONCURRENCY);
        expect(engineCalls.filter(call => call === "ListTargetReviews")).toHaveLength(36);
    });

    it("accepts 200 ids", { timeout: 60000 }, async () => {
        const { ann, annReview } = await createScenario();
        const viewer = await createViewer();
        const entryIds = [ann.entryId, ...createFillerIds(BLOCKING_REVIEWS_MAX_IDS - 1)];

        const reviews = expectOk(await listBlocking(viewer, { modelId: "author", entryIds }));

        expect(entryIds).toHaveLength(200);
        expect(reviews).toEqual([toExpectedRow(annReview, ann, "Ann")]);
    });

    it("refuses 201 ids with a validation error before it reads anything", async () => {
        const { ann } = await createScenario();
        const viewer = await createViewer();
        const entryIds = [ann.entryId, ...createFillerIds(BLOCKING_REVIEWS_MAX_IDS)];

        const result = await listBlocking(viewer, { modelId: "author", entryIds });

        expect(entryIds).toHaveLength(201);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe("At most 200 entries can be checked at once.");
        expect(engineCalls).toEqual([]);
        expect(latestEntryReads).toEqual([]);
    });

    it("returns an empty list for no ids without reading anything", async () => {
        await createScenario();
        const viewer = await createViewer();

        const reviews = expectOk(await listBlocking(viewer, { modelId: "author", entryIds: [] }));

        expect(reviews).toEqual([]);
        expect(engineCalls).toEqual([]);
        expect(latestEntryReads).toEqual([]);
    });

    it("returns an empty list for a model with no bound workflow, without looking up reviews", async () => {
        await createScenario();
        const viewer = await createViewer({ legacyPlugins: createExtraModelPlugins() });

        const reviews = expectOk(
            await listBlocking(viewer, { modelId: "book", entryIds: ["book-entry-1"] })
        );

        expect(reviews).toEqual([]);
        // The binding lookup lists the workflows itself; no review is looked up.
        expect(engineCalls).toEqual(["GetBoundWorkflow", "ListWorkflows"]);
        expect(engineCalls).not.toContain("ListTargetReviews");
        expect(latestEntryReads).toEqual([]);
    });

    it("returns an empty list for a private model and for a model that does not exist", async () => {
        await createScenario();
        const viewer = await createViewer({ legacyPlugins: createExtraModelPlugins() });

        const privateModel = expectOk(
            await listBlocking(viewer, { modelId: "secretNote", entryIds: ["note-1"] })
        );
        const missingModel = expectOk(
            await listBlocking(viewer, { modelId: "no-such-model", entryIds: ["entry-1"] })
        );

        expect(privateModel).toEqual([]);
        expect(missingModel).toEqual([]);
        expect(engineCalls).toEqual([]);
    });

    it("returns an empty list for a viewer who cannot read the model", async () => {
        const { ann } = await createScenario();
        const viewer = await createViewer({
            identity: WRITER,
            permissions: CMS_ENTRY_READER_WITHOUT_MODEL
        });

        const reviews = expectOk(
            await listBlocking(viewer, { modelId: "author", entryIds: [ann.entryId] })
        );

        expect(reviews).toEqual([]);
        expect(engineCalls).toEqual([]);
    });

    it("returns an empty list for a viewer who cannot read the model's group", async () => {
        const { ann } = await createScenario();
        const viewer = await createViewer({
            identity: WRITER,
            permissions: CMS_READER_WITHOUT_GROUP_READ
        });

        // Refused at the group read or at the group check of `CmsEntryAccess.canRead`; either way
        // nothing is listed.
        const reviews = expectOk(
            await listBlocking(viewer, { modelId: "author", entryIds: [ann.entryId] })
        );

        expect(reviews).toEqual([]);
    });

    it("returns an empty list for a viewer with no entry permission", async () => {
        const { ann } = await createScenario();
        const viewer = await createViewer({
            identity: WRITER,
            permissions: CMS_MODEL_READER_WITHOUT_ENTRIES
        });

        const reviews = expectOk(
            await listBlocking(viewer, { modelId: "author", entryIds: [ann.entryId] })
        );

        expect(reviews).toEqual([]);
    });

    it("leaves out an entry in a folder the viewer cannot read", async () => {
        const { admin, ann, annReview } = await createScenario();
        const locked = await createAuthorEntry(admin, {
            name: "Locked",
            folderId: "folder-locked"
        });
        await requestEntryReview(admin, locked);
        folderLevels.set("folder-locked", new Map([[READER.id, "no-access"]]));
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [locked.entryId, ann.entryId]
            })
        );

        expect(reviews).toEqual([toExpectedRow(annReview, ann, "Ann")]);
    });

    it("leaves out an entry the viewer did not create when the permission is own-only", async () => {
        const { ann } = await createScenario();
        const writerContext = await createUserContext({
            identity: WRITER,
            permissions: CMS_OWN_WRITER
        });
        const own = await createAuthorEntry(writerContext, { name: "Own" });
        const admin = await createUserContext();
        const ownReview = await requestEntryReview(admin, own);
        const viewer = await createViewer({ identity: WRITER, permissions: CMS_OWN_WRITER });

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [ann.entryId, own.entryId]
            })
        );

        expect(reviews).toEqual([toExpectedRow(ownReview, own, "Own")]);
    });

    it("leaves out an id that has a review but no latest revision", async () => {
        const { admin, ann, annReview } = await createScenario();
        await seedReviewOnTarget(admin, annReview, {
            id: "review-ghost",
            model: AUTHOR_NAMESPACE,
            targetId: "ghost-entry",
            targetRevisionId: "ghost-entry#0001"
        });
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: ["ghost-entry", ann.entryId]
            })
        );

        expect(reviews).toEqual([toExpectedRow(annReview, ann, "Ann")]);
        expect(latestEntryReads).toEqual([["ghost-entry", ann.entryId]]);
    });

    it("refuses an anonymous identity without reading anything", async () => {
        const { ann } = await createScenario();
        const anonymous = await createViewer({ identity: null, permissions: [] });

        const result = await listBlocking(anonymous, {
            modelId: "author",
            entryIds: [ann.entryId]
        });

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });

    it("fails with a persistence error when the review list fails (R87)", async () => {
        const { ann } = await createScenario();
        const viewer = await createViewer({ legacyPlugins: [failListTargetReviews] });

        const result = await listBlocking(viewer, { modelId: "author", entryIds: [ann.entryId] });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
    });

    it("fails with a persistence error when the binding lookup fails (R87)", async () => {
        const { ann } = await createScenario();
        const viewer = await createViewer({ legacyPlugins: [failGetBoundWorkflow] });

        const result = await listBlocking(viewer, { modelId: "author", entryIds: [ann.entryId] });

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
    });

    it("fails with a persistence error when the latest entries cannot be read (R87)", async () => {
        const { ann } = await createScenario();
        const viewer = await createViewer({ legacyPlugins: [failGetLatestEntries] });

        const result = await listBlocking(viewer, { modelId: "author", entryIds: [ann.entryId] });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
    });

    it("fails with a persistence error when the entry access check throws (R87)", async () => {
        const { ann } = await createScenario();
        const viewer = await createViewer();
        throwingAccessChecks.add("canRead");

        const result = await listBlocking(viewer, { modelId: "author", entryIds: [ann.entryId] });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
    });
});
