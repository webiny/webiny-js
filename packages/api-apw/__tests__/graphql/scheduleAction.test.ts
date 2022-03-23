import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { createSetupForContentReview } from "../utils/helpers";

describe(`Schedule action in a content review process`, function () {
    const options = {
        path: "manage/en-US"
    };

    const gqlHandler = useContentGqlHandler({
        ...options
    });
    const {
        getContentReviewQuery,
        createContentReviewMutation,
        provideSignOffMutation,
        publishContentMutation,
        until
    } = gqlHandler;

    const setup = async () => {
        return createSetupForContentReview(gqlHandler);
    };

    let contentReview: any = null;

    const preparePageForPublish = async () => {
        if (contentReview) {
            return contentReview;
        }
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

        contentReview = createdContentReview;

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

        /**
         * Should be able to schedule publish page action.
         */
        const [schedulePublishPageResponse] = await publishContentMutation({
            id: contentReview.id,
            datetime: new Date(Date.now() + 1000 * 60 * 30).toISOString()
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
    });
});
