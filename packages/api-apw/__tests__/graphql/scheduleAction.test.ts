import { usePageBuilderHandler } from "../utils/usePageBuilderHandler";
import { createSetupForPageContentReview } from "../utils/helpers";

describe(`Schedule action in a content review process`, function () {
    const options = {
        path: "manage/en-US"
    };

    const gqlHandler = usePageBuilderHandler({
        ...options
    });
    const {
        getContentReviewQuery,
        createContentReviewMutation,
        provideSignOffMutation,
        publishContentMutation,
        deleteScheduledActionMutation,
        until
    } = gqlHandler;

    const setup = async () => {
        return createSetupForPageContentReview(gqlHandler);
    };

    const preparePageForPublish = async () => {
        const { page } = await setup();
        /*
         Create a content review entry.
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

        const [step1, step2, step3] = createdContentReview.steps;

        await until(
            () => getContentReviewQuery({ id: createdContentReview.id }).then(([data]) => data),
            (response: any) => response.data.apw.getContentReview.data !== null,
            {
                name: "Wait for entry to be available in get query"
            }
        );

        /**
         * Let's provide sign-off to every step of the publishing workflow.
         */
        await provideSignOffMutation({
            id: createdContentReview.id,
            step: step1.id
        });

        await provideSignOffMutation({
            id: createdContentReview.id,
            step: step2.id
        });

        await provideSignOffMutation({
            id: createdContentReview.id,
            step: step3.id
        });

        /**
         * After providing sign-off to every step of the workflow,
         * Now the content should be in "readyToBePublished" stage.
         */
        const [getContentReviewResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        const updatedContentReview = getContentReviewResponse.data.apw.getContentReview.data;
        expect(updatedContentReview.status).toEqual("readyToBePublished");

        return createdContentReview;
    };

    test(`should return error when scheduling publish page for invalid datetime.`, async () => {
        const contentReview = await preparePageForPublish();
        /**
         * Should return error when scheduling publish page for invalid datetime.
         */
        const [schedulePublishPageResponse] = await publishContentMutation({
            id: contentReview.id,
            datetime: ""
        });

        expect(schedulePublishPageResponse).toEqual({
            data: {
                apw: {
                    publishContent: {
                        data: null,
                        error: {
                            message: expect.any(String),
                            code: "INVALID_DATETIME_FORMAT",
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });
    });

    test(`should return error when scheduling publish page for past datetime.`, async () => {
        const contentReview = await preparePageForPublish();
        /**
         * Should return error when scheduling publish page for past datetime.
         */
        const [schedulePublishPageResponse] = await publishContentMutation({
            id: contentReview.id,
            datetime: new Date("2022-01-01T00:00:00").toISOString()
        });

        expect(schedulePublishPageResponse).toEqual({
            data: {
                apw: {
                    publishContent: {
                        data: null,
                        error: {
                            message: expect.any(String),
                            code: "PAST_DATETIME",
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });
    });

    test(`should be able to schedule publish page action.`, async () => {
        const contentReview = await preparePageForPublish();
        const datetime = new Date(Date.now() + 1000 * 60 * 30).toISOString();
        /**
         * Should be able to schedule publish page action.
         */
        const [schedulePublishPageResponse] = await publishContentMutation({
            id: contentReview.id,
            datetime
        });

        expect(schedulePublishPageResponse).toEqual({
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
         * After scheduling publish page, now the content should have "contentScheduledOn".
         */
        const [getContentReviewResponse] = await getContentReviewQuery({
            id: contentReview.id
        });

        expect(getContentReviewResponse.data.apw.getContentReview.data.content.scheduledOn).toEqual(
            datetime
        );
        expect(getContentReviewResponse.data.apw.getContentReview.data.content.scheduledBy).toEqual(
            {
                id: expect.any(String),
                type: expect.any(String),
                displayName: expect.any(String)
            }
        );
    });

    test(`should be able to delete schedule publish page action.`, async () => {
        const contentReview = await preparePageForPublish();
        const datetime = new Date(Date.now() + 1000 * 60 * 30).toISOString();

        /**
         * Should return error when trying to delete a scheduled action before creating one.
         */
        let [deleteScheduledActionResponse] = await deleteScheduledActionMutation({
            id: contentReview.id
        });
        expect(deleteScheduledActionResponse).toEqual({
            data: {
                apw: {
                    deleteScheduledAction: {
                        data: null,
                        error: {
                            code: "NO_ACTION_SCHEDULED",
                            message: expect.any(String),
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });

        /**
         * Should be able to schedule publish page action.
         */
        const [schedulePublishPageResponse] = await publishContentMutation({
            id: contentReview.id,
            datetime
        });

        expect(schedulePublishPageResponse).toEqual({
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
         * After scheduling publish page, now the content should have "contentScheduledOn".
         */
        let [getContentReviewResponse] = await getContentReviewQuery({
            id: contentReview.id
        });

        expect(getContentReviewResponse.data.apw.getContentReview.data.content.scheduledOn).toEqual(
            datetime
        );
        expect(getContentReviewResponse.data.apw.getContentReview.data.content.scheduledBy).toEqual(
            {
                id: expect.any(String),
                type: expect.any(String),
                displayName: expect.any(String)
            }
        );

        /**
         * Should able to delete a scheduled action after creating one.
         */
        [deleteScheduledActionResponse] = await deleteScheduledActionMutation({
            id: contentReview.id
        });
        expect(deleteScheduledActionResponse).toEqual({
            data: {
                apw: {
                    deleteScheduledAction: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * After deleting the scheduled publish page action, now the content should not have "contentScheduledOn".
         */
        [getContentReviewResponse] = await getContentReviewQuery({
            id: contentReview.id
        });

        expect(getContentReviewResponse.data.apw.getContentReview.data.content.scheduledOn).toEqual(
            null
        );
        expect(getContentReviewResponse.data.apw.getContentReview.data.content.scheduledBy).toEqual(
            null
        );
    });
});
