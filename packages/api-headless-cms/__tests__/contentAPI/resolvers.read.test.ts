import { CmsContentModelGroupType } from "@webiny/api-headless-cms/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import models from "./mocks/contentModels";
import contentModelGroupMock from "./mocks/contentModelGroup";

describe("READ - Resolvers", () => {
    let contentModelGroup: CmsContentModelGroupType;

    const readHandlerOpts = {
        path: "read/en-US"
    };
    const manageHandlerOpts = {
        path: "manage/en-US"
    };

    const { invoke, updateContentModelMutation } = useContentGqlHandler(readHandlerOpts);
    const { createContentModelMutation, createContentModelGroupMutation } = useContentGqlHandler(
        manageHandlerOpts
    );

    beforeEach(async () => {
        const [createGroupResponse] = await createContentModelGroupMutation({
            data: {
                ...contentModelGroupMock,
                id: undefined
            }
        });

        contentModelGroup = createGroupResponse.data.createContentModelGroup.data;

        const category = models.find(m => m.modelId === "category");

        const [create] = await createContentModelMutation({
            data: {
                name: category.name,
                modelId: category.modelId,
                group: contentModelGroup.id
            }
        });

        await updateContentModelMutation({
            id: create.data.createContentModel.data.id,
            data: {
                fields: category.fields,
                layout: category.layout
            }
        });
    });

    test(`get entry by ID`, async () => {
        const query = /* GraphQL */ `
            query GetCategory($id: ID) {
                getCategory(where: { id: $id }) {
                    data {
                        id
                        title
                        slug
                    }
                    error {
                        code
                        message
                    }
                }
            }
        `;

        const [response] = await invoke({
            body: {
                query,
                variables: {
                    id: "" // TODO category id
                }
            }
        });

        expect(response).toEqual({
            data: {
                getCategory: {
                    data: {
                        id: 123,
                        title: "title",
                        slug: "slug"
                    },
                    error: null
                }
            }
        });
    });

    test(`should return a NOT_FOUND error when getting by value from an unpublished revision`, async () => {
        const query = /* GraphQL */ `
            query GetCategory($slug: String) {
                getCategory(where: { slug: $slug }) {
                    data {
                        id
                        title
                        slug
                    }
                    error {
                        code
                    }
                }
            }
        `;
        const [response] = await invoke({
            body: {
                query,
                variables: {
                    where: {
                        slug: "first-category"
                    }
                }
            }
        });

        expect(response).toEqual({
            data: {
                getCategory: {
                    data: null,
                    error: {
                        code: "NOT_FOUND"
                    }
                }
            }
        });
    });

    test(`list entries (no parameters)`, async () => {
        const query = /* GraphQL */ `
            {
                listCategories {
                    data {
                        id
                        title
                        slug
                    }
                }
            }
        `;
        const [response] = await invoke({
            body: {
                query
            }
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: 123,
                            title: "fdfds",
                            slug: "gdsgd"
                        }
                    ],
                    error: null
                }
            }
        });
    });

    test(`list entries (limit)`, async () => {
        const query = /* GraphQL */ `
            query ListCategories($limit: Number) {
                listCategories(limit: $limit) {
                    data {
                        id
                    }
                    meta {
                        totalCount
                    }
                }
            }
        `;
        const [response] = await invoke({
            body: {
                query,
                variables: {
                    limit: 1
                }
            }
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            id: 123
                        }
                    ],
                    meta: {
                        totalCount: 5
                    }
                }
            }
        });
    });

    test(`list entries (limit + after)`, async () => {
        const query = /* GraphQL */ `
            query ListCategories($after: String, $limit: Number) {
                listCategories(after: $after, limit: $limit) {
                    data {
                        title
                    }
                    meta {
                        cursor
                        hasMoreItems
                        totalCount
                    }
                }
            }
        `;
        const [response] = await invoke({
            body: {
                query,
                variables: {
                    limit: 1,
                    after: "afterString"
                }
            }
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "category"
                        }
                    ],
                    meta: {
                        cursor: "fds",
                        hasMoreItems: true,
                        totalCount: 15
                    }
                }
            }
        });
    });

    test(`list entries (sort ASC)`, async () => {
        const query = /* GraphQL */ `
            query ListCategories($sort: [CategoryListSorter]) {
                listCategories(sort: $sort) {
                    data {
                        title
                    }
                }
            }
        `;
        const [response] = await invoke({
            body: {
                query,
                variables: {
                    sort: ["title_ASC"]
                }
            }
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "First category"
                        },
                        {
                            title: "Second category"
                        }
                    ]
                }
            }
        });
    });

    test(`list entries (sort DESC)`, async () => {
        // Test resolvers
        const query = /* GraphQL */ `
            query ListCategories($sort: [CategoryListSorter]) {
                listCategories(sort: $sort) {
                    data {
                        title
                    }
                }
            }
        `;

        const [response] = await invoke({
            body: {
                query,
                variables: {
                    sort: ["title_DESC"]
                }
            }
        });

        expect(response).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Second category"
                        },
                        {
                            title: "First category"
                        }
                    ]
                }
            }
        });
    });

    test(`list entries (contains, not_contains, in, not_in)`, async () => {
        const query = /* GraphQL */ `
            query ListCategories($where: CategoryListWhereInput) {
                listCategories(where: $where) {
                    data {
                        title
                    }
                    error {
                        message
                    }
                }
            }
        `;

        const [containsResponse] = await invoke({
            body: {
                query,
                variables: {
                    where: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        title_contains: "First"
                    }
                }
            }
        });

        expect(containsResponse).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "First category",
                            slug: "first-category"
                        }
                    ],
                    error: null
                }
            }
        });

        const [notContainsResponse] = await invoke({
            body: {
                query,
                variables: {
                    where: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        title_not_contains: "First"
                    }
                }
            }
        });
        expect(notContainsResponse).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Second category",
                            slug: "second-category"
                        }
                    ],
                    error: null
                }
            }
        });

        const [inResponse] = await invoke({
            body: {
                query,
                variables: {
                    where: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        slug_in: ["first-category"]
                    }
                }
            }
        });

        expect(inResponse).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "First category",
                            slug: "first-category,"
                        }
                    ],
                    error: null
                }
            }
        });

        const [notInResponse] = await invoke({
            body: {
                query,
                variables: {
                    where: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        slug_not_in: ["first-category"]
                    }
                }
            }
        });

        expect(notInResponse).toEqual({
            data: {
                listCategories: {
                    data: [
                        {
                            title: "Second category",
                            slug: "second-category"
                        }
                    ],
                    error: null
                }
            }
        });
    });
});
