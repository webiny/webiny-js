import useGqlHandler from "./useGqlHandler";

jest.setTimeout(100000);

describe("deleting pages", () => {
    const handler = useGqlHandler();

    const { getPage, createPage, deletePage, listPages, listPublishedPages, publishPage, until } =
        handler;

    let p1v1: any, p1v2: any, p1v3: any, category;

    beforeEach(async () => {
        const { createCategory } = useGqlHandler();
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

        p1v2 = await createPage({ from: p1v1.id }).then(([res]) => {
            return res.data.pageBuilder.createPage.data;
        });

        p1v3 = await createPage({ from: p1v2.id }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );
    });

    test("deleting page via `pid` should delete all related DB / index entries", async () => {
        await publishPage({ id: p1v3.id });
        await until(
            () =>
                listPages({
                    sort: ["createdOn_DESC"]
                }),
            ([res]) => res.data.pageBuilder.listPages.data[0].id === p1v3.id,
            {
                name: "list all pages after publishing p1v3"
            }
        );
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v3.id,
            {
                name: "list published pages after publishing p1v3"
            }
        );

        await deletePage({ id: p1v1.pid }).then(([res]) => {
            expect(res.data.pageBuilder.deletePage).toMatchObject({
                error: null,
                data: {
                    latestPage: null,
                    page: {
                        version: 3
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
                name: "list all pages after deleting the page via pid"
            }
        );
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data.length === 0,
            {
                name: "list published pages after deleting the page via pid"
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
                name: "list latest pages until p1v3 is first #1"
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
                name: "list latest pages until p1v3 is first"
            }
        );
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v3.id,
            {
                name: "list published pages until p1v3 is first"
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
            name: "list latest pages until p1v2 is first"
        });
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data.length === 0,
            {
                name: "list published pages until there are no pages"
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
                                    id: p1v3.id,
                                    locked: false,
                                    status: "draft",
                                    version: 3
                                },
                                {
                                    id: p1v2.id,
                                    locked: true,
                                    status: "published",
                                    version: 2
                                },
                                {
                                    id: p1v1.id,
                                    locked: false,
                                    status: "draft",
                                    version: 1
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });
        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data[0].id === p1v3.id, {
            name: "list latest pages until p1v3 is first"
        });
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v2.id,
            {
                name: `list published pages until p1v2 is first`
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
            name: "list latest pages until p1v2 is first"
        });
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v2.id,
            {
                name: "list published pages until p1v2 is first"
            }
        );
    });

    test("deleting a non-latest / non-published page should update DB / indexes correctly", async () => {
        await publishPage({ id: p1v3.id });
        await deletePage({ id: p1v2.id });

        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data[0].id === p1v3.id, {
            name: "list pages after publish and delete page"
        });
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v3.id,
            {
                name: "list published pages after publish and delete page"
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

    test("deleting all revisions should delete all related DB / index entries", async () => {
        await deletePage({ id: p1v3.id });
        await deletePage({ id: p1v2.id });
        await deletePage({ id: p1v1.id });

        await until(
            () => listPages({}),
            ([res]) => {
                return res.data.pageBuilder.listPages.data.length === 0;
            },
            {
                name: "list all pages after deleting p1 via pid"
            }
        );
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data.length === 0,
            {
                name: "list published pages after deleting p1 via pid"
            }
        );
    });
});
