import { createSetupForContentReview } from "../utils/helpers";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";

describe("Content Review assignment to a PB Page", () => {
    const options = {
        path: "manage/en-US"
    };

    const gqlHandler = useContentGqlHandler({
        ...options
    });

    const { createContentReviewMutation, getPageQuery } = gqlHandler;

    const setup = async () => {
        return createSetupForContentReview(gqlHandler);
    };

    test("Page should have a workflow assigned right after create", async () => {
        const { page } = await setup();
        /*
         * Initiate a "content review"
         */
        const [createContentReviewResponse] = await createContentReviewMutation({
            data: {
                content: {
                    id: page.id,
                    type: "page"
                }
            }
        });

        const createdContentReview = createContentReviewResponse.data.apw.createContentReview.data;

        /**
         * Now page should have this "contentReview" assigned to it.
         */
        const [getPageResponse] = await getPageQuery({ id: page.id });
        expect(getPageResponse.data.pageBuilder.getPage.data.settings.apw.contentReviewId).toBe(
            createdContentReview.id
        );
    });
});
