import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { mocks as changeRequestMock } from "./mocks/changeRequest";
import { createSetupForContentReview } from "../utils/helpers";
import { ApwContentReview, PageWithWorkflow } from "~/types";

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

    const createContentReview = async (page: PageWithWorkflow) => {
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

    const expectedContent = {
        id: expect.any(String),
        type: expect.any(String),
        version: expect.any(Number),
        settings: null,
        publishedBy: null,
        publishedOn: null,
        scheduledBy: null,
        scheduledOn: null
    };

    test("should able to add change request in a content review", async () => {
        const { page } = await createSetupForContentReview(gqlHandler);
        const contentReview = await createContentReview(page);
        const [step1, step2] = contentReview.steps;

        await until(
            () => listContentReviewsQuery({}).then(([data]) => data),
            (response: any) => {
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
            (response: any) => {
                const list = response.data.apw.listChangeRequests.data;
                return list.length === 1;
            },
            {
                name: `Wait for "ChangeRequest" entry to be available in list query`
            }
        );

        await until(
            () => listContentReviewsQuery({}).then(([data]) => data),
            (response: any) => {
                const [entry] = response.data.apw.listContentReviews.data as ApwContentReview[];
                return (
                    entry &&
                    entry.steps.find(step => step.id === step1.id)?.pendingChangeRequests === 1
                );
            },
            {
                name: `Wait for "ContentReview" entry to be available in list query`
            }
        );

        /**
         * List all change requests for a given step in content review.
         */
        const [listChangeRequestsResponse] = await listChangeRequestsQuery({
            where: {
                step: `${contentReview.id}#${step1.id}`
            }
        });
        expect(listChangeRequestsResponse).toEqual({
            data: {
                apw: {
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
                    step: `${contentReview.id}#${step2.id}`,
                    title: "Please make change in heading-" + i
                })
            });

            changeRequests.push(createChangeRequestResponse.data.apw.createChangeRequest.data);

            await until(
                () => listContentReviewsQuery({}).then(([data]) => data),
                (response: any) => {
                    const [entry] = response.data.apw.listContentReviews.data as ApwContentReview[];
                    return (
                        entry &&
                        entry.steps.find(step => step.id === step2.id)?.pendingChangeRequests ===
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
                        step: `${contentReview.id}#${step2.id}`
                    }
                }).then(([data]) => data),
            (response: any) => {
                const list = response.data.apw.listChangeRequests.data;
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
                step: `${contentReview.id}#${step2.id}`
            }
        });
        expect(listChangeRequestsResponse2).toEqual({
            data: {
                apw: {
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
                apw: {
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
                            content: expect.objectContaining(expectedContent),
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
    });

    test(`should delete all "change requests" when a "content review" gets deleted`, async () => {
        const { page, createPage } = await createSetupForContentReview(gqlHandler);
        const page2 = await createPage(gqlHandler);
        const pages = [page, page2];
        /*
         * Create two new content review entries.
         */
        const contentReviews = [];
        for (let i = 0; i < 2; i++) {
            const contentReview = await createContentReview(pages[i]);
            contentReviews.push(contentReview);
        }

        /**
         * Add two change requests on each content review entry.
         */
        const changeRequests = [];
        for (let i = 0; i < contentReviews.length; i++) {
            const contentReview = contentReviews[i];
            for (let j = 0; j < 2; j++) {
                const [createCommentResponse] = await createChangeRequestMutation({
                    data: changeRequestMock.createChangeRequestInput({
                        step: `${contentReview.id}#${contentReview.steps[0].id}`,
                        title: `Please change heading-${i}-${j}`
                    })
                });
                changeRequests.push(createCommentResponse.data.apw.createChangeRequest.data);
            }
        }

        await until(
            () => listChangeRequestsQuery({}).then(([data]) => data),
            (response: any) => {
                const list = response.data.apw.listChangeRequests.data;
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
                apw: {
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
                apw: {
                    deleteContentReview: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        await until(
            () => listChangeRequestsQuery({}).then(([data]) => data),
            (response: any) => {
                const list = response.data.apw.listChangeRequests.data;
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
                step: `${contentReviews[0].id}#${contentReviews[0].steps[0].id}`
            }
        });
        expect(listChangeRequestsResponse).toEqual({
            data: {
                apw: {
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
                apw: {
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
