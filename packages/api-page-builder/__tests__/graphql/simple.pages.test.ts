import useGqlHandler from "./useGqlHandler";
import { Page } from "~/types";
import { waitPage } from "./utils/waitPage";

const sort: string[] = ["createdOn_DESC"];

jest.setTimeout(50000);

describe("pages simple actions", () => {
    const handler = useGqlHandler();

    const createCategory = async () => {
        const [response] = await handler.createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/url/`,
                layout: `layout`
            }
        });
        if (response.data.pageBuilder.createCategory.error) {
            throw new Error(response.data.pageBuilder.createCategory.error);
        }
        return response.data.pageBuilder.createCategory.data;
    };

    it("should create a new page", async () => {
        const category = await createCategory();

        const [response] = await handler.createPage({
            category: category.slug
        });

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    createPage: {
                        data: {
                            title: expect.stringMatching(/^Untitled/),
                            status: "draft"
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should create new page and update it with new title", async () => {
        const category = await createCategory();

        const [createResponse] = await handler.createPage({
            category: category.slug
        });
        const id = createResponse.data.pageBuilder.createPage.data.id;

        const title = "Page updated title";

        const [response] = await handler.updatePage({
            id,
            data: {
                title
            }
        });

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    updatePage: {
                        data: {
                            id,
                            title,
                            status: "draft"
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should create, update and publish page", async () => {
        const category = await createCategory();

        const [createResponse] = await handler.createPage({
            category: category.slug
        });
        const id = createResponse.data.pageBuilder.createPage.data.id;

        const title = "Page updated title";

        await handler.updatePage({
            id,
            data: {
                title
            }
        });

        const [response] = await handler.publishPage({
            id
        });

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    publishPage: {
                        data: {
                            id,
                            title,
                            status: "published"
                        },
                        error: null
                    }
                }
            }
        });

        const [checkResponse] = await handler.getPage({
            id
        });
        expect(checkResponse).toMatchObject({
            data: {
                pageBuilder: {
                    getPage: {
                        data: {
                            id,
                            title,
                            status: "published"
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should create, update, publish and list latest and published page", async () => {
        const category = await createCategory();

        const [createResponse] = await handler.createPage({
            category: category.slug
        });
        const page = createResponse.data.pageBuilder.createPage.data;
        await waitPage(handler, page);

        const title = "Page updated title";

        await handler.updatePage({
            id: page.id,
            data: {
                title
            }
        });
        await waitPage(handler, {
            ...page,
            title
        });

        await handler.publishPage({
            id: page.id
        });

        await handler.until(
            () =>
                handler.listPages({
                    sort
                }),
            ([response]) => {
                const data = response.data.pageBuilder.listPages.data as Page[];
                if (data.length !== 1) {
                    return false;
                }
                const [page] = data;
                return page.status === "published";
            },
            {
                name: "list pages after published",
                wait: 500,
                tries: 30
            }
        );

        const [listResponse] = await handler.listPages({
            sort
        });

        expect(listResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                id: page.id,
                                status: "published"
                            }
                        ],
                        meta: {
                            hasMoreItems: false,
                            totalCount: 1,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });

        const [listPublishedResponse] = await handler.listPublishedPages({
            sort
        });

        expect(listPublishedResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPublishedPages: {
                        data: [
                            {
                                id: page.id,
                                status: "published"
                            }
                        ],
                        meta: {
                            hasMoreItems: false,
                            totalCount: 1,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should create, update, publish and unpublish page", async () => {
        const category = await createCategory();

        const [createResponse] = await handler.createPage({
            category: category.slug
        });
        const page = createResponse.data.pageBuilder.createPage.data;
        await waitPage(handler, page);

        const title = "Page updated title";

        await handler.updatePage({
            id: page.id,
            data: {
                title
            }
        });
        await waitPage(handler, {
            ...page,
            title
        });

        await handler.publishPage({
            id: page.id
        });
        await waitPage(handler, {
            ...page,
            title,
            status: "published"
        });

        const [response] = await handler.unpublishPage({
            id: page.id
        });

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    unpublishPage: {
                        data: {
                            id: page.id,
                            title,
                            status: "unpublished"
                        },
                        error: null
                    }
                }
            }
        });

        const [checkResponse] = await handler.getPage({
            id: page.id
        });
        expect(checkResponse).toMatchObject({
            data: {
                pageBuilder: {
                    getPage: {
                        data: {
                            id: page.id,
                            title,
                            status: "unpublished"
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should create, update, publish, unpublish page and list latest and published", async () => {
        const category = await createCategory();

        const [createResponse] = await handler.createPage({
            category: category.slug
        });
        const page = createResponse.data.pageBuilder.createPage.data;
        await waitPage(handler, page);

        const title = "Page updated title";

        await handler.updatePage({
            id: page.id,
            data: {
                title
            }
        });
        await waitPage(handler, {
            ...page,
            title
        });

        await handler.publishPage({
            id: page.id
        });
        await waitPage(handler, {
            ...page,
            title,
            status: "published"
        });

        await handler.unpublishPage({
            id: page.id
        });

        await handler.until(
            () =>
                handler.listPages({
                    sort
                }),
            ([response]) => {
                const data = response.data.pageBuilder.listPages.data as Page[];
                if (data.length !== 1) {
                    return false;
                }
                const [page] = data;
                return page.status === "unpublished";
            },
            {
                name: "list pages after unpublished",
                wait: 1000,
                tries: 30
            }
        );

        await handler.until(
            () =>
                handler.listPublishedPages({
                    sort
                }),
            ([response]) => {
                return response.data.pageBuilder.listPublishedPages.data.length === 0;
            },
            {
                name: "list published pages after unpublished",
                wait: 1000,
                tries: 30
            }
        );

        const [listResponse] = await handler.listPages({
            sort
        });

        expect(listResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                id: page.id,
                                status: "unpublished"
                            }
                        ],
                        meta: {
                            hasMoreItems: false,
                            totalCount: 1,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });

        const [listPublishedResponse] = await handler.listPublishedPages({
            sort
        });

        expect(listPublishedResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPublishedPages: {
                        data: [],
                        meta: {
                            hasMoreItems: false,
                            totalCount: 0,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });
    });
});
