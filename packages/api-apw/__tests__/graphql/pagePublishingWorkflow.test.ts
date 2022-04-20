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
        createPage,
        getPageQuery,
        provideSignOffMutation,
        retractSignOffMutation,
        publishContentMutation,
        unpublishContentMutation
    } = gqlHandler;

    /**
     * Let's do the setup.
     */
    const setup = async () => createSetupForContentReview(gqlHandler);

    test(`Should able to "publish" page for content review process`, async () => {
        const { page, workflow } = await setup();

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
         * Page should have "apw" properties after update.
         */
        expect(updatedPage.settings.apw).toEqual({
            workflowId: workflow.id,
            contentReviewId: createdContentReview.id
        });
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
        let [publishContentResponse] = await publishContentMutation({ id: contentReview.id });
        expect(publishContentResponse).toEqual({
            data: {
                apw: {
                    publishContent: {
                        data: null,
                        error: {
                            code: "NOT_READY_TO_BE_PUBLISHED",
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
         * Let's retract the provided sign-off for a "required step" of the publishing workflow.
         */
        const [retractSignOffResponse] = await retractSignOffMutation({
            id: contentReview.id,
            step: step2.id
        });
        expect(retractSignOffResponse).toEqual({
            data: {
                apw: {
                    retractSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * After retracting sign-off to a step of the workflow,
         * Now the content should be back in "underReview" stage.
         */
        [getContentReviewResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        expect(getContentReviewResponse.data.apw.getContentReview.data.status).toEqual(
            "underReview"
        );

        /**
         * Let's again provide the sign-off for step 2.
         */
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

        /**
         * After providing sign-off to every step of the workflow,
         * Should be able to publish the page.
         */
        [publishContentResponse] = await publishContentMutation({ id: contentReview.id });
        expect(publishContentResponse).toEqual({
            data: {
                apw: {
                    publishContent: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * Let's confirm that the content is "published".
         */
        const [getPageResponse] = await getPageQuery({ id: page.id });
        expect(getPageResponse).toEqual({
            data: {
                pageBuilder: {
                    getPage: {
                        data: expect.any(Object),
                        error: null
                    }
                }
            }
        });

        expect(getPageResponse.data.pageBuilder.getPage.data.status).toEqual("published");
        expect(getPageResponse.data.pageBuilder.getPage.data.version).toEqual(1);

        /**
         * Fetch the content review and check if the status has been updated successful.
         */
        [getContentReviewResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });

        expect(getContentReviewResponse.data.apw.getContentReview.data.status).toEqual("published");
    });

    test(`Should able to "unpublish" page for content review process`, async () => {
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
        let [publishContentResponse] = await publishContentMutation({ id: contentReview.id });
        expect(publishContentResponse).toEqual({
            data: {
                apw: {
                    publishContent: {
                        data: null,
                        error: {
                            code: "NOT_READY_TO_BE_PUBLISHED",
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
         * Let's retract the provided sign-off for a "required step" of the publishing workflow.
         */
        const [retractSignOffResponse] = await retractSignOffMutation({
            id: contentReview.id,
            step: step2.id
        });
        expect(retractSignOffResponse).toEqual({
            data: {
                apw: {
                    retractSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * After retracting sign-off to a step of the workflow,
         * Now the content should be back in "underReview" stage.
         */
        [getContentReviewResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        expect(getContentReviewResponse.data.apw.getContentReview.data.status).toEqual(
            "underReview"
        );

        /**
         * Let's again provide the sign-off for step 2.
         */
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

        /**
         * After providing sign-off to every step of the workflow,
         * Should be able to publish the page.
         */
        [publishContentResponse] = await publishContentMutation({ id: contentReview.id });
        expect(publishContentResponse).toEqual({
            data: {
                apw: {
                    publishContent: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * Let's confirm that the content is "published".
         */
        let [getPageResponse] = await getPageQuery({ id: page.id });
        expect(getPageResponse).toEqual({
            data: {
                pageBuilder: {
                    getPage: {
                        data: expect.any(Object),
                        error: null
                    }
                }
            }
        });

        expect(getPageResponse.data.pageBuilder.getPage.data.status).toEqual("published");
        expect(getPageResponse.data.pageBuilder.getPage.data.version).toEqual(1);

        /**
         * Fetch the content review and check if the status has been updated successful.
         */
        [getContentReviewResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });

        expect(getContentReviewResponse.data.apw.getContentReview.data.status).toEqual("published");

        /**
         * Let's "unpublish" the content.
         */
        const [unPublishContentResponse] = await unpublishContentMutation({ id: contentReview.id });
        expect(unPublishContentResponse).toEqual({
            data: {
                apw: {
                    unpublishContent: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * Let's confirm that the content is "unpublished".
         */
        [getPageResponse] = await getPageQuery({ id: page.id });
        expect(getPageResponse).toEqual({
            data: {
                pageBuilder: {
                    getPage: {
                        data: expect.any(Object),
                        error: null
                    }
                }
            }
        });
        expect(getPageResponse.data.pageBuilder.getPage.data.status).toEqual("unpublished");
        expect(getPageResponse.data.pageBuilder.getPage.data.version).toEqual(1);

        /**
         * Fetch the content review and check if the status has been updated successful.
         */
        [getContentReviewResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });

        expect(getContentReviewResponse.data.apw.getContentReview.data.status).toEqual(
            "readyToBePublished"
        );
    });
});
