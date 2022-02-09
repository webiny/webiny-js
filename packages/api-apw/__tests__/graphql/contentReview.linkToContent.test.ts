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

    test(`Page should have a "contentReview" assigned to it`, async () => {
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

    test(`Should not able to request "contentReview" more than once`, async () => {
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

        /*
         * Let's try to initiate another "content review" for the same content.
         */
        const [createContentReviewAgainResponse] = await createContentReviewMutation({
            data: {
                content: {
                    id: page.id,
                    type: "page"
                }
            }
        });
        expect(createContentReviewAgainResponse).toEqual({
            data: {
                apw: {
                    createContentReview: {
                        data: null,
                        error: {
                            message: expect.any(String),
                            code: "REVIEW_ALREADY_EXIST",
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });
    });
});
