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
        return createContentReviewResponse.data.apw.createContentReview.data;
    };

    test(`should able to update "pendingChangeRequests" count in a content review`, async () => {
        const { page } = await createSetupForContentReview(gqlHandler);
        const contentReview = await createContentReview(page);
        const [step1, step2] = contentReview.steps;

        await until(
            () => listContentReviewsQuery({}).then(([data]) => data),
            response => {
                const list = response.data.apw.listContentReviews.data;
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
            data: changeRequestMock.createChangeRequestInput({
                step: `${contentReview.id}#${step1.id}`
            })
        });
        const changeRequested = createChangeRequestResponse.data.apw.createChangeRequest.data;

        await until(
            () => listChangeRequestsQuery({}).then(([data]) => data),
            response => {
                const list = response.data.apw.listChangeRequests.data;
                return list.length === 1;
            },
            {
                name: `Wait for "ChangeRequest" entry to be available in list query`
            }
        );

        await until(
            () => listContentReviewsQuery({}).then(([data]) => data),
            response => {
                const [entry] = response.data.apw.listContentReviews.data;
                return entry.steps.find(step => step.id === step1.id).pendingChangeRequests === 1;
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
                apw: {
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
                            title: expect.any(String),
                            content: {
                                id: expect.any(String),
                                type: "page",
                                version: expect.any(Number),
                                settings: null
                            },
                            steps: [
                                {
                                    id: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 1,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    id: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    id: expect.any(String),
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
                    step: `${contentReview.id}#${step2.id}`,
                    title: "Please make change in heading-" + i
                })
            });

            changeRequests.push(createChangeRequestResponse.data.apw.createChangeRequest.data);

            await until(
                () => listContentReviewsQuery({}).then(([data]) => data),
                response => {
                    const [entry] = response.data.apw.listContentReviews.data;
                    return (
                        entry.steps.find(step => step.id === step1.id).pendingChangeRequests ===
                            1 &&
                        entry.steps.find(step => step.id === step2.id).pendingChangeRequests ===
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
                apw: {
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
                            title: expect.any(String),
                            content: {
                                id: expect.any(String),
                                type: "page",
                                version: expect.any(Number),
                                settings: null
                            },
                            steps: [
                                {
                                    id: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 1,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    id: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 2,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    id: expect.any(String),
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
                apw: {
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
                            title: expect.any(String),
                            content: {
                                id: expect.any(String),
                                type: "page",
                                version: expect.any(Number),
                                settings: null
                            },
                            steps: [
                                {
                                    id: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    id: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 2,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    id: expect.any(String),
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
                apw: {
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
                            title: expect.any(String),
                            content: {
                                id: expect.any(String),
                                type: "page",
                                version: expect.any(Number),
                                settings: null
                            },
                            steps: [
                                {
                                    id: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    id: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 2,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    id: expect.any(String),
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
                apw: {
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
                            title: expect.any(String),
                            content: {
                                id: expect.any(String),
                                type: "page",
                                version: expect.any(Number),
                                settings: null
                            },
                            steps: [
                                {
                                    id: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    id: expect.any(String),
                                    status: expect.any(String),
                                    pendingChangeRequests: 2,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    id: expect.any(String),
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
