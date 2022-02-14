import { createSetupForContentReview } from "../utils/helpers";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";

describe("Page publishing workflow", () => {
    const options = {
        path: "manage/en-US"
    };

    const gqlHandler = useContentGqlHandler({
        ...options
    });
    const {
        createContentReviewMutation,
        getContentReviewQuery,
        updatePage,
        publishPage,
        createPage,
        provideSignOffMutation
    } = gqlHandler;

    /**
     * Let's do the setup.
     */
    const setup = async () => {
        const { page } = await createSetupForContentReview(gqlHandler);
        return {
            page
        };
    };

    test(`Should work - review process for publishing page`, async () => {
        const { page } = await setup();

        /**
         *  Initial a review.
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

        /*
         * Check content status, it should be "under review".
         */
        expect(createdContentReview.status).toEqual("underReview");
        expect(createdContentReview.title).toEqual(page.title);

        /*
         *  We should be able to make updates to the page.
         */
        const [updatePageResponse] = await updatePage({
            id: page.id,
            data: {
                title: "About us"
            }
        });
        const updatedPage = updatePageResponse.data.pageBuilder.updatePage.data;
        /**
         * Fetch the content review and check if the updates were successful.
         */
        let [getContentReviewResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        const contentReview = getContentReviewResponse.data.apw.getContentReview.data;
        expect(contentReview.status).toEqual("underReview");
        expect(contentReview.title).toEqual(updatedPage.title);

        /**
         * Should not let us publish a page.
         */
        let [publishPageResponse] = await publishPage({ id: page.id });
        expect(publishPageResponse).toEqual({
            data: {
                pageBuilder: {
                    publishPage: {
                        data: null,
                        error: {
                            code: "REVIEW_ALREADY_EXIST",
                            message: expect.any(String),
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });

        /**
         * Should be able to create a new revision, even though the content is "underReview".
         */
        const [createPageFromResponse] = await createPage({
            from: page.id,
            category: page.category.slug
        });
        expect(createPageFromResponse).toEqual({
            data: {
                pageBuilder: {
                    createPage: {
                        data: expect.any(Object),
                        error: null
                    }
                }
            }
        });

        const pageRevision2 = createPageFromResponse.data.pageBuilder.createPage.data;
        /**
         * Should still have the workflow assigned.
         * But, should not have "contentReviewId".
         */
        expect(pageRevision2.settings.apw).toEqual({
            workflowId: page.settings.apw.workflowId,
            contentReviewId: null
        });

        /**
         * Let's provide sign-off to every step of the publishing workflow.
         */
        const [step1, step2, step3] = contentReview.steps;

        let [provideSignOffResponse] = await provideSignOffMutation({
            id: contentReview.id,
            step: step1.id
        });

        expect(provideSignOffResponse).toEqual({
            data: {
                apw: {
                    provideSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        [provideSignOffResponse] = await provideSignOffMutation({
            id: contentReview.id,
            step: step2.id
        });

        expect(provideSignOffResponse).toEqual({
            data: {
                apw: {
                    provideSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        [provideSignOffResponse] = await provideSignOffMutation({
            id: contentReview.id,
            step: step3.id
        });

        expect(provideSignOffResponse).toEqual({
            data: {
                apw: {
                    provideSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * After providing sign-off to every step of the workflow,
         * Now the content should be in "readyToBePublished" stage.
         */
        [getContentReviewResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        const updatedContentReview = getContentReviewResponse.data.apw.getContentReview.data;
        expect(updatedContentReview.status).toEqual("readyToBePublished");
        expect(updatedContentReview.title).toEqual(updatedPage.title);

        /**
         * After providing sign-off to every step of the workflow,
         * Should be able to publish the page.
         */
        [publishPageResponse] = await publishPage({ id: page.id });
        expect(publishPageResponse).toEqual({
            data: {
                pageBuilder: {
                    publishPage: {
                        data: expect.any(Object),
                        error: null
                    }
                }
            }
        });
        const publishedPage = publishPageResponse.data.pageBuilder.publishPage.data;
        expect(publishedPage.status).toEqual("published");
        expect(publishedPage.locked).toEqual(true);
        expect(publishedPage.version).toEqual(1);
    });
});
