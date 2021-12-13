import { ApwContentReviewStepStatus } from "~/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { createSetupForContentReview } from "../utils/helpers";

describe("Provide sign off for a step in content review process", function () {
    const options = {
        path: "manage/en-US"
    };

    const gqlHandler = useContentGqlHandler({
        ...options
    });
    const { getContentReviewQuery, createContentReviewMutation, provideSignOffMutation } =
        gqlHandler;

    const setup = async () => {
        return createSetupForContentReview(gqlHandler);
    };

    test(`should able to provide sign-off`, async () => {
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
        const createdContentReview =
            createContentReviewResponse.data.advancedPublishingWorkflow.createContentReview.data;

        const [step1, step2] = createdContentReview.steps;
        /**
         * Should return error while providing sign-off for "inactive" step.
         */
        let [provideSignOffResponse] = await provideSignOffMutation({
            id: createdContentReview.id,
            step: step2.slug
        });
        expect(provideSignOffResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    provideSignOff: {
                        data: null,
                        error: {
                            code: "STEP_NOT_ACTIVE",
                            message: expect.any(String),
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });

        /**
         * Should able to providing sign-off for "active" step.
         */
        [provideSignOffResponse] = await provideSignOffMutation({
            id: createdContentReview.id,
            step: step1.slug
        });
        expect(provideSignOffResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    provideSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * Now that we've provided sign-off for step1, step2 should have status "active".
         */
        const [getContentReviewResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        expect(getContentReviewResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
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
                            content: {
                                id: expect.any(String),
                                type: expect.any(String),
                                settings: null
                            },
                            steps: [
                                {
                                    status: ApwContentReviewStepStatus.DONE,
                                    slug: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: expect.stringMatching(/^20/),
                                    signOffProvidedBy: {
                                        id: "12345678",
                                        displayName: "John Doe"
                                    }
                                },
                                {
                                    status: ApwContentReviewStepStatus.ACTIVE,
                                    slug: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    status: ApwContentReviewStepStatus.INACTIVE,
                                    slug: expect.any(String),
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
    });

    test(`should throw error when trying to provide sign off by a non-reviewer`, async () => {
        const gqlHandlerForIdentityA = useContentGqlHandler({
            ...options,
            identity: {
                id: "123456789",
                type: "admin",
                displayName: "Ryan"
            }
        });

        const { page } = await setup();
        await gqlHandlerForIdentityA.securityIdentity.login();

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
        const createdContentReview =
            createContentReviewResponse.data.advancedPublishingWorkflow.createContentReview.data;

        const [step1] = createdContentReview.steps;
        /**
         * Should return error while providing sign-off for a step by a non-reviewer.
         */
        const [provideSignOffResponse] = await gqlHandlerForIdentityA.provideSignOffMutation({
            id: createdContentReview.id,
            step: step1.slug
        });
        expect(provideSignOffResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    provideSignOff: {
                        data: null,
                        error: {
                            code: "NOT_AUTHORISED",
                            message: expect.any(String),
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });
    });
});
