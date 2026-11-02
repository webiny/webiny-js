import { afterEach, describe, expect, it } from "vitest";
import type { CmsContext, CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { createDbModel } from "~tests/__helpers/dbModels.js";
import { expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { READER, REQUESTER } from "~tests/__helpers/identities.js";
import { CMS_READER } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { GetCmsEntryTargetReviewUseCase } from "~/features/wrappers/GetCmsEntryTargetReview/index.js";
import { ListCmsEntryBlockingReviewsUseCase } from "~/features/wrappers/ListCmsEntryBlockingReviews/index.js";
import { canUserRead, canUserReadInFolder } from "~tests/__helpers/userReadChecks.js";

const BOOK_NAMESPACE = "cms.book";

const createBookEntry = async (context: CmsContext, model: CmsModel, title: string) => {
    return expectOk(
        await context.container.resolve(CreateEntryUseCase).execute(model, {
            values: { title },
            location: { folderId: "root" }
        })
    );
};

/**
 * A database model "book": the model holds its group's slug ("book-group"), the group has a
 * generated id, so the two differ (as for every model on a database group, such as the installed
 * "Ungrouped"). Admin binds the workflow to it, creates "Ann" (reviewed) and "Bob" (no review).
 */
const createScenario = async () => {
    const admin = await createUserContext({
        permissionsByIdentity: { [READER.id]: CMS_READER }
    });
    const model = await createDbModel(admin, "book");
    expectOk(await storeWorkflow(admin, createWorkflowValues([BOOK_NAMESPACE])));
    const ann = await createBookEntry(admin, model, "Ann");
    const bob = await createBookEntry(admin, model, "Bob");
    return { admin, model, ann, bob };
};

const getTargetReview = (context: CmsContext, entry: CmsEntry) => {
    return context.container
        .resolve(GetCmsEntryTargetReviewUseCase)
        .execute({ model: BOOK_NAMESPACE, targetRevisionId: entry.id });
};

const getReadAccess = (context: CmsContext): ReviewTargetReadAccess.Interface => {
    return context.container
        .resolveAll(ReviewTargetReadAccess)
        .find(item => item.canHandle(BOOK_NAMESPACE))!;
};

describe("A model's group is found by its slug, not its id", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("reads the target with its group and allows a full-access admin", async () => {
        const { admin, model, ann } = await createScenario();
        const target = await admin.container
            .resolve(CmsEntryTargetReader)
            .read({ model: BOOK_NAMESPACE, targetRevisionId: ann.id });

        expect(model.group).toBe("book-group");
        expect(target?.group.slug).toBe("book-group");
        expect(target?.group.id).not.toBe("book-group");
        const access = admin.container.resolve(CmsEntryAccess);
        expect(await access.canRead(target!)).toBe(true);
        expect(await access.canDeleteAnyEntry(BOOK_NAMESPACE)).toBe(true);
    });

    it("answers the target review for a full-access admin", async () => {
        const { admin, ann, bob } = await createScenario();

        // Was `Workflows/NotAuthorized`: the group was looked up by id and not found.
        const unreviewed = expectOk(await getTargetReview(admin, bob));

        expect(unreviewed).toBeNull();

        const review = await requestEntryReview(admin, ann, REQUESTER, BOOK_NAMESPACE);
        const reviewed = expectOk(await getTargetReview(admin, ann));

        expect(reviewed?.review.id).toBe(review.id);
    });

    it("answers read access of another user for the entry and its folder", async () => {
        const { admin, ann } = await createScenario();
        const access = getReadAccess(admin);

        const canRead = await canUserRead(access, {
            userId: READER.id,
            model: BOOK_NAMESPACE,
            targetId: ann.entryId,
            targetRevisionId: ann.id
        });
        const canReadInFolder = await canUserReadInFolder(access, {
            userId: READER.id,
            model: BOOK_NAMESPACE,
            folderId: null
        });

        expect(canRead).toBe(true);
        expect(canReadInFolder).toBe(true);
    });

    it("lists the blocking reviews of the model's entries", async () => {
        const { admin, ann, bob } = await createScenario();
        const review = await requestEntryReview(admin, ann, REQUESTER, BOOK_NAMESPACE);

        const reviews = expectOk(
            await admin.container
                .resolve(ListCmsEntryBlockingReviewsUseCase)
                .execute({ modelId: "book", entryIds: [ann.entryId, bob.entryId] })
        );

        expect(reviews.map(item => item.reviewId)).toEqual([review.id]);
    });
});
