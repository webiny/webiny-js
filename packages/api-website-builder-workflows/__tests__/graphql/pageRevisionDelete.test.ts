import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { CreatePageRevisionFromUseCase } from "@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { expectOk } from "~tests/__helpers/pages.js";
import { requestPageReview } from "~tests/__helpers/engine.js";
import { storeWbWorkflow } from "~tests/__helpers/engine.js";
import { REQUESTER } from "~tests/__helpers/identities.js";
import { WB_DELETER } from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { asGraphQLUser } from "~tests/__helpers/graphql.js";
import { CANCEL_REVIEWS_FOR_DELETE } from "~tests/__helpers/graphql.js";

const DELETE_PAGE_REVISION = /* GraphQL */ `
    mutation DeletePageRevision($id: ID!) {
        websiteBuilder {
            deletePageRevision(id: $id) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

/** Admin stores the pages workflow; revision 1 of "Page A" is under review, revision 2 is not. */
const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const review = await requestPageReview(admin, page);
    const second = expectOk(
        await admin.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
    );
    return { admin, page, review, second };
};

describe("WB deletePageRevision through GraphQL with workflows (R235, D134)", () => {
    beforeEach(() => {
        folderLevels.clear();
    });

    afterEach(() => {
        folderLevels.clear();
    });

    it("refuses with Workflows/Review/ActiveReviewOnTrash while the revision's review is in progress", async () => {
        const { page, review } = await createScenario();
        const deleter = asGraphQLUser({ identity: REQUESTER, permissions: WB_DELETER });

        const body = await deleter.run(DELETE_PAGE_REVISION, { id: page.id });

        expect(body.errors).toBeUndefined();
        const result = body.data.websiteBuilder.deletePageRevision;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(result.error.data).toMatchObject({
            model: "wb.page",
            action: "delete",
            reviews: [{ reviewId: review.id, targetRevisionId: page.id }]
        });
    });

    it("deletes the revision after the page-wide cancel-for-delete", async () => {
        const { admin, page, review } = await createScenario();
        const deleter = asGraphQLUser({ identity: REQUESTER, permissions: WB_DELETER });

        const cancelled = await deleter.run(CANCEL_REVIEWS_FOR_DELETE, {
            pageId: page.entryId,
            action: "delete"
        });
        const body = await deleter.run(DELETE_PAGE_REVISION, { id: page.id });

        expect(
            cancelled.data.websiteBuilder.cancelWebsiteBuilderPageReviewsForDelete.error
        ).toBeNull();
        expect(body.data.websiteBuilder.deletePageRevision).toEqual({ data: true, error: null });
        const gone = await admin.container.resolve(GetReviewUseCase).execute({ id: review.id });
        expect(gone.error.code).toBe("Workflows/Review/NotFound");
    });
});
