import { createSetupForPageContentReview } from "../utils/helpers";
import { usePageBuilderHandler } from "../utils/usePageBuilderHandler";

describe("Content Review assignment to a PB Page", () => {
    const options = {
        path: "manage/en-US"
    };

    const gqlHandler = usePageBuilderHandler({
        ...options
    });

    const {
        createContentReviewMutation,
        deleteContentReviewMutation,
        getPageQuery,
        deletePageMutation
    } = gqlHandler;

    const setup = async () => {
        return createSetupForPageContentReview(gqlHandler);
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

    test(`Page should not have a "contentReview" assigned after review deletion`, async () => {
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

        /**
         * Let's delete the "content review".
         */
        const [deleteContentReviewResponse] = await deleteContentReviewMutation({
            id: createdContentReview.id
        });
        expect(deleteContentReviewResponse).toEqual({
            data: {
                apw: {
                    deleteContentReview: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * Now page should not have this "contentReview" assigned to it.
         */
        const [getPageAgainResponse] = await getPageQuery({ id: page.id });
        expect(
            getPageAgainResponse.data.pageBuilder.getPage.data.settings.apw.contentReviewId
        ).toBe(null);
    });

    test(`Should not let user delete a page if there is a "contentReview" assigned to it`, async () => {
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

        /**
         * Let's try deleting a page.
         */
        const [deletePageResponse] = await deletePageMutation({ id: page.id });
        /**
         * Should throw an error.
         */
        expect(deletePageResponse).toEqual({
            data: {
                pageBuilder: {
                    deletePage: {
                        data: null,
                        error: {
                            code: "CANNOT_DELETE_REVIEW_EXIST",
                            message: expect.any(String),
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });

        /**
         * Let's delete the "content review".
         */
        const [deleteContentReviewResponse] = await deleteContentReviewMutation({
            id: createdContentReview.id
        });
        expect(deleteContentReviewResponse).toEqual({
            data: {
                apw: {
                    deleteContentReview: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * Now page should not have this "contentReview" assigned to it.
         */
        const [getPageAgainResponse] = await getPageQuery({ id: page.id });
        expect(
            getPageAgainResponse.data.pageBuilder.getPage.data.settings.apw.contentReviewId
        ).toBe(null);
    });
});
