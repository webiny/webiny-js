import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { mocks as changeRequestMock } from "./mocks/changeRequest";
import { createSetupForContentReview } from "../utils/helpers";

describe(`Pending change requests count test`, () => {
    const options = {
        path: "manage/en-US"
    };

    const gqlHandler = useContentGqlHandler({
        ...options
    });
    const {
        createChangeRequestMutation,
        createContentReviewMutation,
        getContentReviewQuery,
        listContentReviewsQuery,
        updateChangeRequestMutation,
        listChangeRequestsQuery,
        until
    } = gqlHandler;

    const createContentReview = async page => {
        const [createContentReviewResponse] = await createContentReviewMutation({
            data: {
                content: {
                    id: page.id,
                    type: "page"
                }
            }
        });
        return createContentReviewResponse.data.advancedPublishingWorkflow.createContentReview.data;
    };

    test(`should able to update "pendingChangeRequests" count in a content review`, async () => {
        const { page } = await createSetupForContentReview(gqlHandler);
        const contentReview = await createContentReview(page);
        const [step1, step2] = contentReview.steps;

        await until(
            () => listContentReviewsQuery({}).then(([data]) => data),
            response => {
                const list = response.data.advancedPublishingWorkflow.listContentReviews.data;
                return list.length === 1;
            },
            {
                name: `Wait for "ContentReview" entry to be available in list query`
            }
        );

        /*
         * Create a new change request entry for step 1.
         */
        const [createChangeRequestResponse] = await createChangeRequestMutation({
            data: changeRequestMock.createChangeRequestInput({ step: step1.slug })
        });
        const changeRequested =
            createChangeRequestResponse.data.advancedPublishingWorkflow.createChangeRequest.data;

        await until(
            () => listChangeRequestsQuery({}).then(([data]) => data),
            response => {
                const list = response.data.advancedPublishingWorkflow.listChangeRequests.data;
                return list.length === 1;
            },
            {
                name: `Wait for "ChangeRequest" entry to be available in list query`
            }
        );

        await until(
            () => listContentReviewsQuery({}).then(([data]) => data),
            response => {
                const [entry] = response.data.advancedPublishingWorkflow.listContentReviews.data;
                return (
                    entry.steps.find(step => step.slug === step1.slug).pendingChangeRequests === 1
                );
            },
            {
                name: "Wait for updated entry to be available in list query"
            }
        );

        /**
         * Should have 1 pending change requests for step 1 and 0 pending change requests for step 2.
         */
        let [getContentReviewResponse] = await getContentReviewQuery({ id: contentReview.id });
        expect(getContentReviewResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getContentReview: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: expect.any(String),
                                displayName: expect.any(String),
                                type: "admin"
                            },
                            status: "underReview",
                            content: {
                                id: expect.any(String),
                                type: "page",
                                settings: null
                            },
                            steps: [
                                {
                                    slug: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 1,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    slug: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    slug: expect.any(String),
                                    status: expect.any(String),
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
         * Add couple of change request to a step 2 in the content review.
         */
        const changeRequests = [];
        for (let i = 0; i < 2; i++) {
            const [createChangeRequestResponse] = await createChangeRequestMutation({
                data: changeRequestMock.createChangeRequestInput({
                    step: step2.slug,
                    title: "Please make change in heading-" + i
                })
            });

            changeRequests.push(
                createChangeRequestResponse.data.advancedPublishingWorkflow.createChangeRequest.data
            );

            await until(
                () => listContentReviewsQuery({}).then(([data]) => data),
                response => {
                    const [entry] =
                        response.data.advancedPublishingWorkflow.listContentReviews.data;
                    return (
                        entry.steps.find(step => step.slug === step1.slug).pendingChangeRequests ===
                            1 &&
                        entry.steps.find(step => step.slug === step2.slug).pendingChangeRequests ===
                            i + 1
                    );
                },
                {
                    name: "Wait for updated entry to be available in list query"
                }
            );
        }

        /**
         * Should have 1 pending change requests for step 1 and 2 pending change requests for step 2.
         */
        [getContentReviewResponse] = await getContentReviewQuery({ id: contentReview.id });
        expect(getContentReviewResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getContentReview: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: expect.any(String),
                                displayName: expect.any(String),
                                type: "admin"
                            },
                            status: "underReview",
                            content: {
                                id: expect.any(String),
                                type: "page",
                                settings: null
                            },
                            steps: [
                                {
                                    slug: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 1,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    slug: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 2,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    slug: expect.any(String),
                                    status: expect.any(String),
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
         * Mark change request 1 as resolved.
         */
        await updateChangeRequestMutation({
            id: changeRequested.id,
            data: {
                resolved: true
            }
        });

        /**
         * Should have 0 pending change requests for step 1 and 2 pending change requests for step 2.
         */
        [getContentReviewResponse] = await getContentReviewQuery({ id: contentReview.id });
        expect(getContentReviewResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getContentReview: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: expect.any(String),
                                displayName: expect.any(String),
                                type: "admin"
                            },
                            status: "underReview",
                            content: {
                                id: expect.any(String),
                                type: "page",
                                settings: null
                            },
                            steps: [
                                {
                                    slug: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    slug: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 2,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    slug: expect.any(String),
                                    status: expect.any(String),
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
         * Mark already resolved change request as resolved.
         */
        await updateChangeRequestMutation({
            id: changeRequested.id,
            data: {
                resolved: true
            }
        });

        /**
         * Should have 0 pending change requests for step 1 and 2 pending change requests for step 2.
         */
        [getContentReviewResponse] = await getContentReviewQuery({ id: contentReview.id });
        expect(getContentReviewResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getContentReview: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: expect.any(String),
                                displayName: expect.any(String),
                                type: "admin"
                            },
                            status: "underReview",
                            content: {
                                id: expect.any(String),
                                type: "page",
                                settings: null
                            },
                            steps: [
                                {
                                    slug: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    slug: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 2,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    slug: expect.any(String),
                                    status: expect.any(String),
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
         * Unmark already resolved change request.
         */
        await updateChangeRequestMutation({
            id: changeRequested.id,
            data: {
                resolved: true
            }
        });

        /**
         * Should have 1 pending change requests for step 1 and 2 pending change requests for step 2.
         */
        [getContentReviewResponse] = await getContentReviewQuery({ id: contentReview.id });
        expect(getContentReviewResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getContentReview: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: expect.any(String),
                                displayName: expect.any(String),
                                type: "admin"
                            },
                            status: "underReview",
                            content: {
                                id: expect.any(String),
                                type: "page",
                                settings: null
                            },
                            steps: [
                                {
                                    slug: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    slug: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 2,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    slug: expect.any(String),
                                    status: expect.any(String),
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
