import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import getMocks from "./mocks/workflows";
import { ContentReviewStepStatus } from "~/types";

const MOCKS = getMocks();

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

describe("Content Review crud test", () => {
    const options = {
        path: "manage/en-US"
    };

    const {
        createCategory,
        createPage,
        createWorkflowMutation,
        getContentReviewQuery,
        createContentReviewMutation,
        deleteContentReviewMutation,
        listContentReviewsQuery,
        updateContentReviewMutation
    } = useContentGqlHandler({
        ...options
    });

    const setupCategory = async () => {
        const [createCategoryResponse] = await createCategory({
            data: {
                name: "Static",
                url: "/static/",
                slug: "static",
                layout: "static"
            }
        });
        return createCategoryResponse.data.pageBuilder.createCategory.data;
    };

    const setupPage = async () => {
        const category = await setupCategory();

        const [createPageResponse] = await createPage({ category: category.slug });
        return createPageResponse.data.pageBuilder.createPage.data;
    };

    const setupWorkflow = async () => {
        const [createWorkflowResponse] = await createWorkflowMutation({
            data: MOCKS.mainWorkflow
        });

        return createWorkflowResponse.data.advancedPublishingWorkflow.createWorkflow.data;
    };

    const setup = async () => {
        const page = await setupPage();
        const workflow = await setupWorkflow();

        return {
            page,
            workflow
        };
    };

    test("should able to create, update, get, list and delete Content Review", async () => {
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
                changeRequested: [],
                content: page.pid,
                workflow: workflow.id
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
                            steps: workflow.steps.map(step => ({
                                status: ContentReviewStepStatus.INACTIVE,
                                slug: step.slug
                            })),
                            changeRequested: []
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
                            steps: workflow.steps.map(step => ({
                                status: ContentReviewStepStatus.INACTIVE,
                                slug: step.slug
                            })),
                            changeRequested: []
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
            data: {
                changeRequested: [
                    {
                        title: "Please change the main heading",
                        body: richTextMock,
                        media: {
                            src: "my-bucket/file1"
                        }
                    }
                ]
            }
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
                            steps: workflow.steps.map(step => ({
                                status: ContentReviewStepStatus.INACTIVE,
                                slug: step.slug
                            })),
                            changeRequested: [
                                {
                                    title: "Please change the main heading",
                                    media: {
                                        src: "my-bucket/file1"
                                    },
                                    body: richTextMock,
                                    resolved: null,
                                    comments: null
                                }
                            ]
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
                                steps: workflow.steps.map(step => ({
                                    status: ContentReviewStepStatus.INACTIVE,
                                    slug: step.slug
                                })),
                                changeRequested: [
                                    {
                                        title: "Please change the main heading",
                                        media: {
                                            src: "my-bucket/file1"
                                        },
                                        body: richTextMock,
                                        resolved: null,
                                        comments: null
                                    }
                                ]
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

    test("should able to request few changes to Content Review", async () => {
        const { page, workflow } = await setup();

        /*
         Create a content review entry.
        */
        const [createContentReviewResponse] = await createContentReviewMutation({
            data: {
                changeRequested: [],
                content: page.pid,
                workflow: workflow.id
            }
        });
        const createdContentReview =
            createContentReviewResponse.data.advancedPublishingWorkflow.createContentReview.data;

        /*
         Let's update the entry by requesting a change request.
        */
        const [updateContentReviewResponse] = await updateContentReviewMutation({
            id: createdContentReview.id,
            data: {
                changeRequested: [
                    {
                        title: "Please change the main heading",
                        body: richTextMock,
                        media: {
                            src: "my-bucket/file1"
                        },
                        comments: [
                            {
                                body: richTextMock,
                                author: "author#1"
                            }
                        ]
                    }
                ]
            }
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
                            steps: workflow.steps.map(step => ({
                                status: ContentReviewStepStatus.INACTIVE,
                                slug: step.slug
                            })),
                            changeRequested: [
                                {
                                    title: "Please change the main heading",
                                    body: richTextMock,
                                    media: {
                                        src: "my-bucket/file1"
                                    },
                                    resolved: null,
                                    comments: [
                                        {
                                            body: richTextMock,
                                            author: "author#1"
                                        }
                                    ]
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
