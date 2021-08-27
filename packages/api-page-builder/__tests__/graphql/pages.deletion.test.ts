import useGqlHandler from "./useGqlHandler";

jest.setTimeout(10000);

describe("deleting pages", () => {
    const {
        getPage,
        createCategory,
        createPage,
        deletePage,
        listPages,
        listPublishedPages,
        publishPage,
        until
    } = useGqlHandler();

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

        p1v2 = await createPage({ from: p1v1.id }).then(([res]) => {
            return res.data.pageBuilder.createPage.data;
        });

        p1v3 = await createPage({ from: p1v2.id }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );
    });

    test("deleting v1 page should delete all related DB / index entries", async () => {
        await publishPage({ id: p1v3.id });
        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data[0].id === p1v3.id);
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v3.id
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

        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data.length === 0);
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data.length === 0
        );
    });

    test("deleting latest published page should update DB / indexes correctly", async () => {
        await publishPage({ id: p1v3.id });
        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data[0].id === p1v3.id);
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v3.id
        );

        await deletePage({ id: p1v3.id }).then(([res]) => {
            expect(res.data.pageBuilder.deletePage).toMatchObject({
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
        });

        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data[0].id === p1v2.id);
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data.length === 0
        );
    });

    test("deleting latest non-published page should update DB / indexes correctly", async () => {
        await publishPage({ id: p1v2.id });
        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data[0].id === p1v3.id);
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v2.id
        );

        await deletePage({ id: p1v3.id }).then(([res]) => {
            expect(res.data.pageBuilder.deletePage).toMatchObject({
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
        });

        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data[0].id === p1v2.id);
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v2.id
        );
    });

    test("deleting a non-latest / non-published page should update DB / indexes correctly", async () => {
        await publishPage({ id: p1v3.id });
        await deletePage({ id: p1v2.id });

        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data[0].id === p1v3.id);
        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v3.id
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
