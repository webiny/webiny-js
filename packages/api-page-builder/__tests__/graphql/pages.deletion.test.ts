import useGqlHandler from "./useGqlHandler";
import { waitPage } from "./utils/waitPage";

jest.setTimeout(25000);

describe("deleting pages", () => {
    const handler = useGqlHandler();

    const {
        getPage,
        createCategory,
        createPage,
        deletePage,
        listPages,
        listPublishedPages,
        publishPage,
        until
    } = handler;

    let p1v1, p1v2, p1v3, category;

    beforeEach(async () => {
        category = await createCategory({
            data: {
                slug: `slug`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        }).then(([res]) => res.data.pageBuilder.createCategory.data);

        p1v1 = await createPage({ category: category.slug }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );
        await waitPage(handler, p1v1);

        p1v2 = await createPage({ from: p1v1.id }).then(([res]) => {
            return res.data.pageBuilder.createPage.data;
        });
        await waitPage(handler, p1v2);

        p1v3 = await createPage({ from: p1v2.id }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );
        await waitPage(handler, p1v3);
    });

    test("deleting v1 page should delete all related DB / index entries", async () => {
        await publishPage({ id: p1v3.id });
        await until(
            () =>
                listPages({
                    sort: ["createdOn_DESC"]
                }),
            ([res]) => res.data.pageBuilder.listPages.data[0].id === p1v3.id,
            {
                name: "list all pages after publishing p1v3",
                tries: 30,
                wait: 500
            }
        );
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v3.id,
            {
                name: "list published pages after publishing p1v3",
                tries: 30,
                wait: 500
            }
        );

        await deletePage({ id: p1v1.id }).then(([res]) => {
            expect(res.data.pageBuilder.deletePage).toMatchObject({
                error: null,
                data: {
                    latestPage: null,
                    page: {
                        version: 1
                    }
                }
            });
        });

        await until(
            () => listPages({}),
            ([res]) => {
                return res.data.pageBuilder.listPages.data.length === 0;
            },
            {
                name: "list all pages after deleting p1v1",
                wait: 500,
                tries: 30
            }
        );
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data.length === 0,
            {
                name: "list published pages after deleting p1v1",
                wait: 500,
                tries: 30
            }
        );
    });

    test("deleting latest published page should update DB / indexes correctly", async () => {
        await until(
            () => listPages({ sort: ["createdOn_DESC"] }),
            ([response]) => {
                return response.data.pageBuilder.listPages.data[0].id === p1v3.id;
            },
            {
                name: "list latest pages until p1v3 is first #1",
                wait: 500,
                tries: 30
            }
        );
        const [publishP1V3Response] = await publishPage({ id: p1v3.id });

        expect(publishP1V3Response).toMatchObject({
            data: {
                pageBuilder: {
                    publishPage: {
                        data: {
                            id: p1v3.id,
                            status: "published",
                            publishedOn: expect.stringMatching(/^20/)
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () =>
                listPages({
                    sort: ["createdOn_DESC"]
                }),
            ([res]) => {
                const page = res.data.pageBuilder.listPages.data[0];
                return page.id === p1v3.id && page.status === "published";
            },
            {
                name: "list latest pages until p1v3 is first",
                wait: 500,
                tries: 30
            }
        );
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v3.id,
            {
                name: "list published pages until p1v3 is first",
                wait: 500,
                tries: 30
            }
        );

        const [deleteP1V3Response] = await deletePage({ id: p1v3.id });

        expect(deleteP1V3Response.data.pageBuilder.deletePage).toMatchObject({
            error: null,
            data: {
                latestPage: {
                    version: 2
                },
                page: {
                    version: 3
                }
            }
        });

        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data[0].id === p1v2.id, {
            name: "list latest pages until p1v2 is first",
            wait: 500,
            tries: 30
        });
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data.length === 0,
            {
                name: "list published pages until there are no pages",
                wait: 500,
                tries: 30
            }
        );
    });

    test("deleting latest non-published page should update DB / indexes correctly", async () => {
        const [publishResponse] = await publishPage({ id: p1v2.id });
        expect(publishResponse).toEqual({
            data: {
                pageBuilder: {
                    publishPage: {
                        data: {
                            ...p1v2,
                            locked: true,
                            status: "published",
                            savedOn: expect.stringMatching(/20/),
                            publishedOn: expect.stringMatching(/20/),
                            revisions: [
                                {
                                    id: p1v1.id,
                                    locked: false,
                                    status: "draft",
                                    version: 1
                                },
                                {
                                    id: p1v2.id,
                                    locked: true,
                                    status: "published",
                                    version: 2
                                },
                                {
                                    id: p1v3.id,
                                    locked: false,
                                    status: "draft",
                                    version: 3
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });
        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data[0].id === p1v3.id, {
            name: "list latest pages until p1v3 is first",
            wait: 500,
            tries: 30
        });
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v2.id,
            {
                name: `list published pages until p1v2 is first`,
                wait: 500,
                tries: 30
            }
        );

        const [deleteResponse] = await deletePage({ id: p1v3.id });

        expect(deleteResponse).toMatchObject({
            data: {
                pageBuilder: {
                    deletePage: {
                        error: null,
                        data: {
                            latestPage: {
                                version: 2
                            },
                            page: {
                                version: 3
                            }
                        }
                    }
                }
            }
        });

        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data[0].id === p1v2.id, {
            name: "list latest pages until p1v2 is first",
            wait: 500,
            tries: 30
        });
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v2.id,
            {
                name: "list published pages until p1v2 is first",
                wait: 500,
                tries: 30
            }
        );
    });

    test("deleting a non-latest / non-published page should update DB / indexes correctly", async () => {
        await publishPage({ id: p1v3.id });
        await deletePage({ id: p1v2.id });

        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data[0].id === p1v3.id, {
            name: "list pages after publish and delete page",
            wait: 500,
            tries: 30
        });
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v3.id,
            {
                name: "list published pages after publish and delete page",
                wait: 500,
                tries: 30
            }
        );
    });

    test("deleting a revision in the middle of all revisions, should not affect other revisions", async () => {
        await deletePage({ id: p1v2.id });

        const page = await getPage({ id: p1v1.id }).then(
            ([res]) => res.data.pageBuilder.getPage.data
        );

        expect(page.revisions.length).toBe(2);
    });
});
