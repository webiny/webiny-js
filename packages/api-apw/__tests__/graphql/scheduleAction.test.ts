import { ApwContentReviewStepStatus } from "~/types";
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
        scheduleActionMutation,
        until
    } = gqlHandler;

    const setup = async () => {
        return createSetupForContentReview(gqlHandler);
    };

    test(`should able to schedule publish page`, async () => {
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

        const [step1] = createdContentReview.steps;
        let previousSavedOn = createdContentReview.savedOn;

        await until(
            () => getContentReviewQuery({ id: createdContentReview.id }).then(([data]) => data),
            (response: any) => response.data.apw.getContentReview.data !== null,
            {
                name: "Wait for entry to be available in get query"
            }
        );

        /**
         * Should able to providing sign-off for "active" step.
         */
        const [provideSignOffResponse] = await provideSignOffMutation({
            id: createdContentReview.id,
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

        await until(
            () => getContentReviewQuery({ id: createdContentReview.id }).then(([data]) => data),
            (response: any) => {
                const entry = response.data.apw.getContentReview.data;

                const hasChanged = entry && entry.savedOn !== previousSavedOn;
                if (hasChanged) {
                    previousSavedOn = entry.savedOn;
                    return true;
                }
                return false;
            },
            {
                name: "Wait for updated entry to be available in get query"
            }
        );

        /**
         * Now that we've provided sign-off for step1, step2 should have status "active" because step1 is done
         * and step3 should also have status "active" because step2 is not of type "mandatory_blocking".
         */
        const [getContentReviewResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        expect(getContentReviewResponse).toEqual({
            data: {
                apw: {
                    getContentReview: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: "12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            status: "underReview",
                            title: expect.any(String),
                            content: {
                                id: expect.any(String),
                                type: expect.any(String),
                                version: expect.any(Number),
                                settings: null
                            },
                            steps: [
                                {
                                    status: ApwContentReviewStepStatus.DONE,
                                    id: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: expect.stringMatching(/^20/),
                                    signOffProvidedBy: {
                                        id: "12345678",
                                        displayName: "John Doe"
                                    }
                                },
                                {
                                    status: ApwContentReviewStepStatus.ACTIVE,
                                    id: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    status: ApwContentReviewStepStatus.ACTIVE,
                                    id: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * Try scheduling publish page.
         */
        const [schedulePublishPageResponse] = await scheduleActionMutation({
            data: {
                datetime: new Date().toISOString(),
                action: "publish",
                type: "page",
                entryId: page.id
            }
        });

        expect(schedulePublishPageResponse).toEqual({
            data: {
                apw: {
                    scheduleAction: {
                        data: true,
                        error: null
                    }
                }
            }
        });
    });
});
