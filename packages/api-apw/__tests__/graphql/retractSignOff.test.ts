import { ApwContentReviewStepStatus } from "~/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { createSetupForContentReview } from "../utils/helpers";

describe("Retract sign off for a step in content review process", function () {
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
        retractSignOffMutation
    } = gqlHandler;

    const setup = async () => {
        return createSetupForContentReview(gqlHandler);
    };

    test(`should able to retract sign-off`, async () => {
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

        const [step1] = createdContentReview.steps;

        /**
         * Should return error when retracting sign-off of a step for which sign-off wasn't provided.
         */
        let [retractSignOffResponse] = await retractSignOffMutation({
            id: createdContentReview.id,
            step: step1.slug
        });
        expect(retractSignOffResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    retractSignOff: {
                        data: null,
                        error: {
                            code: "NO_SIGN_OFF_PROVIDED",
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
        const [provideSignOffResponse] = await provideSignOffMutation({
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
         * Now that we've provided sign-off for step1, step2 should have status "active" because step1 is done
         * and step3 should also have status "active" because step2 is not of type "mandatory_blocking".
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
                            status: "underReview",
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
                                    status: ApwContentReviewStepStatus.ACTIVE,
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

        /**
         * Let's retract the previously provided sign-off.
         */
        [retractSignOffResponse] = await retractSignOffMutation({
            id: createdContentReview.id,
            step: step1.slug
        });
        expect(retractSignOffResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    retractSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * Now that we've retracted sign-off for step1, step2 should have status "inactive".
         */
        const [getContentReviewResponseAgain] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        expect(getContentReviewResponseAgain).toEqual({
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
                            status: "underReview",
                            content: {
                                id: expect.any(String),
                                type: expect.any(String),
                                settings: null
                            },
                            steps: [
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

    test(`should throw error when trying to retract sign off by a non-reviewer`, async () => {
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

        await provideSignOffMutation({
            id: createdContentReview.id,
            step: step1.slug
        });

        /**
         * Should return error while retracting sign-off for a step by a non-reviewer.
         */
        const [retractSignOffResponse] = await gqlHandlerForIdentityA.retractSignOffMutation({
            id: createdContentReview.id,
            step: step1.slug
        });
        expect(retractSignOffResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    retractSignOff: {
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
