import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { mocks as changeRequestMock } from "./mocks/changeRequest";
import { createSetupForContentReview } from "../utils/helpers";

const richTextMock = [
    {
        tag: "h1",
        content: "Testing H1 tags"
    },
    {
        tag: "p",
        content: "Some small piece of text to test P tags"
    },
    {
        tag: "div",
        content: [
            {
                tag: "p",
                text: "Text inside the div > p"
            },
            {
                tag: "a",
                href: "https://www.webiny.com",
                text: "Webiny"
            }
        ]
    }
];

describe(`Add change requests on a step in a "Content Review"`, () => {
    const options = {
        path: "manage/en-US"
    };

    const gqlHandler = useContentGqlHandler({
        ...options
    });
    const {
        createChangeRequestMutation,
        listChangeRequestsQuery,
        deleteContentReviewMutation,
        createContentReviewMutation,
        getContentReviewQuery,
        listContentReviewsQuery,
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

    test("should able to add change request in a content review", async () => {
        const { page } = await createSetupForContentReview(gqlHandler);
        const contentReview = await createContentReview(page);
        const [step1, step2] = contentReview.steps;
        /*
         * Create a new change request entry for step 1.
         */
        const [createChangeRequestResponse] = await createChangeRequestMutation({
            data: changeRequestMock.createChangeRequestInput({ step: step1.slug })
        });
        const changeRequested =
            createChangeRequestResponse.data.advancedPublishingWorkflow.createChangeRequest.data;

        await until(
            () => listContentReviewsQuery({}).then(([data]) => data),
            response => {
                console.log(JSON.stringify({ response }, null, 2));
                const [entry] = response.data.advancedPublishingWorkflow.listContentReviews.data;
                return (
                    entry &&
                    entry.steps.find(step => step.slug === step1.slug).pendingChangeRequests === 1
                );
            },
            {
                name: `Wait for "ContentReview" entry to be available in list query`
            }
        );

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

        /**
         * List all change requests for a given step in content review.
         */
        const [listChangeRequestsResponse] = await listChangeRequestsQuery({
            where: {
                step: step1.slug
            }
        });
        expect(listChangeRequestsResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listChangeRequests: {
                        data: [
                            {
                                id: expect.any(String),
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                ...changeRequested
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
                        entry &&
                        entry.steps.find(step => step.slug === step2.slug).pendingChangeRequests ===
                            i + 1
                    );
                },
                {
                    name: `Wait for updated "ContentReview" entry to be available in list query iteration: ${
                        i + 1
                    }`
                }
            );
        }

        await until(
            () =>
                listChangeRequestsQuery({
                    where: {
                        step: step2.slug
                    }
                }).then(([data]) => data),
            response => {
                const list = response.data.advancedPublishingWorkflow.listChangeRequests.data;
                return list.length === 2;
            },
            {
                name: `Wait for "ChangeRequest" entry to be available in list query for step2`
            }
        );

        /**
         * List all changeRequests for a step2 in the content review.
         */
        const [listChangeRequestsResponse2] = await listChangeRequestsQuery({
            where: {
                step: step2.slug
            }
        });
        expect(listChangeRequestsResponse2).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listChangeRequests: {
                        data: [
                            {
                                id: expect.any(String),
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                ...changeRequests[1]
                            },
                            {
                                id: expect.any(String),
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                ...changeRequests[0]
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 2,
                            cursor: null
                        }
                    }
                }
            }
        });

        /**
         * List all changeRequests for all the steps in the content review.
         */
        const [listChangeRequestsResponse3] = await listChangeRequestsQuery({});
        expect(listChangeRequestsResponse3).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listChangeRequests: {
                        data: [
                            {
                                id: expect.any(String),
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                ...changeRequests[1]
                            },
                            {
                                id: expect.any(String),
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                ...changeRequests[0]
                            },
                            {
                                id: expect.any(String),
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                ...changeRequested
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 3,
                            cursor: null
                        }
                    }
                }
            }
        });

        /**
         * Should have 1 pending change requests for step 1 and 2 pending change requests for step 2.
         */
        const [getContentReviewResponse] = await getContentReviewQuery({ id: contentReview.id });
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
    });

    test(`should delete all "change requests" when a "content review" gets deleted`, async () => {
        const { page } = await createSetupForContentReview(gqlHandler);
        /*
         * Create two new content review entries.
         */
        const contentReviews = [];
        for (let i = 0; i < 2; i++) {
            const contentReview = await createContentReview(page);
            contentReviews.push(contentReview);
        }

        /**
         * Add two change requests on each content review entry.
         */
        const changeRequests = [];
        for (let i = 0; i < contentReviews.length; i++) {
            for (let j = 0; j < 2; j++) {
                const [createCommentResponse] = await createChangeRequestMutation({
                    data: changeRequestMock.createChangeRequestInput({
                        step: contentReviews[i].steps[0].slug,
                        title: `Please change heading-${i}-${j}`
                    })
                });
                changeRequests.push(
                    createCommentResponse.data.advancedPublishingWorkflow.createChangeRequest.data
                );
            }
        }

        await until(
            () => listChangeRequestsQuery({}).then(([data]) => data),
            response => {
                const list = response.data.advancedPublishingWorkflow.listChangeRequests.data;
                return list.length === 4;
            },
            {
                name: "Wait for entry to be available in list query"
            }
        );

        /**
         * List all changeRequests.
         */
        let [listChangeRequestsResponse] = await listChangeRequestsQuery({});
        expect(listChangeRequestsResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listChangeRequests: {
                        data: [
                            {
                                id: changeRequests[3].id,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                ...changeRequests[3]
                            },
                            {
                                id: changeRequests[2].id,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                ...changeRequests[2]
                            },
                            {
                                id: changeRequests[1].id,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                ...changeRequests[1]
                            },
                            {
                                id: changeRequests[0].id,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                body: richTextMock,
                                ...changeRequests[0]
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 4,
                            cursor: null
                        }
                    }
                }
            }
        });
        /**
         * Let's delete the first content review entry.
         */
        const [deleteContentReviewResponse] = await deleteContentReviewMutation({
            id: contentReviews[0].id
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

        await until(
            () => listChangeRequestsQuery({}).then(([data]) => data),
            response => {
                const list = response.data.advancedPublishingWorkflow.listChangeRequests.data;
                return list.length === 2;
            },
            {
                name: "Wait for entry to be available in list query"
            }
        );

        /**
         * List all the changeRequests associated with the deleted change request.
         */
        [listChangeRequestsResponse] = await listChangeRequestsQuery({
            where: {
                step: contentReviews[0].steps[0].slug
            }
        });
        expect(listChangeRequestsResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listChangeRequests: {
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

        /**
         * List all the changeRequests without any filters.
         */
        [listChangeRequestsResponse] = await listChangeRequestsQuery({});
        expect(listChangeRequestsResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    listChangeRequests: {
                        data: [
                            {
                                id: changeRequests[3].id,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                ...changeRequests[3]
                            },
                            {
                                id: changeRequests[2].id,
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: expect.any(String),
                                    displayName: expect.any(String),
                                    type: "admin"
                                },
                                ...changeRequests[2]
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            totalCount: 2,
                            cursor: null
                        }
                    }
                }
            }
        });
    });
});
