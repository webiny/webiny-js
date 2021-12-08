import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { ApwContentReviewStepStatus } from "~/types";
import { createSetupForContentReview } from "../utils/helpers";

describe("Content Review crud test", () => {
    const options = {
        path: "manage/en-US"
    };

    const gqlHandler = useContentGqlHandler({
        ...options
    });
    const {
        getContentReviewQuery,
        createContentReviewMutation,
        deleteContentReviewMutation,
        listContentReviewsQuery,
        updateContentReviewMutation,
        provideSignOffMutation,
        retractSignOffMutation
    } = gqlHandler;

    const setup = async () => {
        return createSetupForContentReview(gqlHandler);
    };

    test(`should able to create, update, get, list and delete "Content Review"`, async () => {
        const { page, workflow } = await setup();

        /*
         Should return error in case of no entry found.
        */
        const [getContentReviewResponse] = await getContentReviewQuery({ id: "123" });
        expect(getContentReviewResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getContentReview: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: "Entry not found!"
                        }
                    }
                }
            }
        });
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

        expect(createContentReviewResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    createContentReview: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: "12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            steps: workflow.steps.map((_, index) => ({
                                status:
                                    index === 0
                                        ? ApwContentReviewStepStatus.ACTIVE
                                        : ApwContentReviewStepStatus.INACTIVE,
                                slug: expect.any(String),
                                pendingChangeRequests: 0,
                                signOffProvidedOn: null,
                                signOffProvidedBy: null
                            })),
                            content: {
                                id: expect.any(String),
                                type: expect.any(String),
                                settings: null
                            }
                        },
                        error: null
                    }
                }
            }
        });
        /*
         Now that we have a content review entry, we should be able to get it
        */
        const [getContentReviewByIdResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        expect(getContentReviewByIdResponse).toEqual({
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
                            steps: workflow.steps.map((_, index) => ({
                                status:
                                    index === 0
                                        ? ApwContentReviewStepStatus.ACTIVE
                                        : ApwContentReviewStepStatus.INACTIVE,
                                slug: expect.any(String),
                                pendingChangeRequests: 0,
                                signOffProvidedOn: null,
                                signOffProvidedBy: null
                            })),
                            content: {
                                id: expect.any(String),
                                type: expect.any(String),
                                settings: null
                            }
                        },
                        error: null
                    }
                }
            }
        });

        /*
         Let's update the entry with some change requested
        */
        const [updateContentReviewResponse] = await updateContentReviewMutation({
            id: createdContentReview.id,
            data: {}
        });

        expect(updateContentReviewResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    updateContentReview: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: "12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            steps: workflow.steps.map((_, index) => ({
                                status:
                                    index === 0
                                        ? ApwContentReviewStepStatus.ACTIVE
                                        : ApwContentReviewStepStatus.INACTIVE,
                                slug: expect.any(String),
                                pendingChangeRequests: 0,
                                signOffProvidedOn: null,
                                signOffProvidedBy: null
                            })),
                            content: {
                                id: expect.any(String),
                                type: expect.any(String),
                                settings: null
                            }
                        },
                        error: null
                    }
                }
            }
        });

        /*
         Let's list all workflow entries there should be only one
        */
        const [listContentReviewsResponse] = await listContentReviewsQuery({ where: {} });
        expect(listContentReviewsResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listContentReviews: {
                        data: [
                            {
                                id: expect.any(String),
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: "12345678",
                                    displayName: "John Doe",
                                    type: "admin"
                                },
                                steps: workflow.steps.map((_, index) => ({
                                    status:
                                        index === 0
                                            ? ApwContentReviewStepStatus.ACTIVE
                                            : ApwContentReviewStepStatus.INACTIVE,
                                    slug: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                })),
                                content: {
                                    id: expect.any(String),
                                    type: expect.any(String),
                                    settings: null
                                }
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 1,
                            cursor: null
                        }
                    }
                }
            }
        });

        /*
         Delete the only entry we have
        */
        const [deleteContentReviewResponse] = await deleteContentReviewMutation({
            id: createdContentReview.id
        });
        expect(deleteContentReviewResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    deleteContentReview: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /*
         Now that we've deleted the only entry we had, we should get empty list as response from "listWorkflows"
        */
        const [listContentReviewsAgainResponse] = await listContentReviewsQuery({ where: {} });
        expect(listContentReviewsAgainResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listContentReviews: {
                        data: [],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 0,
                            cursor: null
                        }
                    }
                }
            }
        });
    });

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
});
