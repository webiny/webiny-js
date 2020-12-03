import useGqlHandler from "./useGqlHandler";

jest.setTimeout(15000);

describe("versioning and publishing pages", () => {
    const {
        deleteElasticSearchIndex,
        createCategory,
        createPage,
        publishPage,
        unpublishPage,
        listPages,
        listPublishedPages,
        until,
        sleep
    } = useGqlHandler();

    beforeAll(async () => {
        await deleteElasticSearchIndex();
    });

    test("create, read, update and delete pages", async () => {
        let [response] = await createCategory({
            data: {
                slug: `slug`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const category = response.data.pageBuilder.createCategory.data.slug;

        // A dummy page, with which we later ensure only updates on a specific pages are made, not multiple.
        await createPage({ category });

        // Now this is the page we're gonna work with in the following lines.
        // 1. Create p1v1.
        const p1v1 = await createPage({ category }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );

        expect(p1v1).toMatchObject({
            id: /^[a-f0-9]{24}#1$/,
            version: 1,
            createdFrom: null
        });

        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data.length === 0
        );

        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data.length === 2).then(
            ([res]) =>
                expect(res.data.pageBuilder.listPages.data[0]).toMatchObject({
                    id: p1v1.id,
                    status: "draft"
                })
        );

        // 2. Create p1v2 from p1v1.
        const p1v2 = await createPage({ from: p1v1.id }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );

        const [p1v1UniqueId] = p1v1.id.split("#");

        expect(p1v2).toMatchObject({
            id: p1v1UniqueId + "#2",
            createdFrom: p1v1.id,
            version: 2
        });

        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data.length === 0
        ).then(([res]) => expect(res.data.pageBuilder.listPublishedPages.error).toBe(null));

        await until(
            listPages,
            ([res]) => res.data.pageBuilder.listPages.data[0].id === p1v2.id
        ).then(([res]) => {
            expect(res.data.pageBuilder.listPages.data.length).toBe(2);
            expect(res.data.pageBuilder.listPages.data[0]).toMatchObject({
                id: p1v2.id,
                status: "draft"
            });
        });

        // 3. Create p1v3 from p1v1 as well.
        let p1v3 = await createPage({ from: p1v1.id }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );

        expect(p1v3).toMatchObject({
            id: p1v1UniqueId + "#3",
            createdFrom: p1v1.id,
            version: 3
        });

        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data.length === 0
        ).then(([res]) => expect(res.data.pageBuilder.listPublishedPages.error).toBe(null));

        await until(
            listPages,
            ([res]) => res.data.pageBuilder.listPages.data[0].id === p1v3.id
        ).then(([res]) => {
            expect(res.data.pageBuilder.listPages.data.length).toBe(2);
            expect(res.data.pageBuilder.listPages.data[0]).toMatchObject({
                id: p1v3.id,
                status: "draft"
            });
        });

        // 4. Let's try publishing the p1v2.
        await publishPage({ id: p1v2.id }).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        publishPage: {
                            data: {
                                id: p1v2.id,
                                status: "published",
                                publishedOn: expect.stringMatching(/^20/),
                                category: {
                                    slug: "slug"
                                },
                                version: 2,
                                title: "Untitled"
                            },
                            error: null
                        }
                    }
                }
            })
        );

        await until(
            listPages,
            ([res]) => res.data.pageBuilder.listPages.data.length === 2
        ).then(([res]) => expect(res.data.pageBuilder.listPages.error).toBe(null));

        await until(
            listPublishedPages,
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v2.id
        ).then(([res]) => {
            expect(res.data.pageBuilder.listPublishedPages.data.length).toBe(1);
            expect(res.data.pageBuilder.listPublishedPages.data[0]).toMatchObject({
                id: p1v2.id,
                status: "published"
            });
        });

        // 5. Let's try creating a new version (v4) from published p1v2 and publish that.
        [response] = await createPage({ from: p1v2.id });
        let p1v4 = response.data.pageBuilder.createPage.data;
        expect(p1v4).toMatchObject({
            id: p1v1UniqueId + "#4",
            createdFrom: p1v2.id,
            version: 4
        });

        // 5.1. Make sure pages list includes the new p1v4 page in the list.
        while (true) {
            await sleep();
            [response] = await listPages();
            if (response?.data?.pageBuilder?.listPages?.data[0].id === p1v4.id) {
                break;
            }
        }

        // 5.2. Make sure published pages doesn't include the new p1v4 page in the list.
        while (true) {
            await sleep();
            [response] = await listPublishedPages();
            if (response?.data?.pageBuilder?.listPublishedPages?.data?.[0]?.id === p1v2.id) {
                break;
            }
        }

        expect(response.data.pageBuilder.listPublishedPages.data.length).toBe(1);

        // 5.3. Let's publish and check the lists again.
        [response] = await publishPage({ id: p1v4.id });

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    publishPage: {
                        data: {
                            id: p1v4.id,
                            status: "published",
                            publishedOn: expect.stringMatching(/^20/),
                            category: {
                                slug: "slug"
                            },
                            version: 4,
                            title: "Untitled"
                        },
                        error: null
                    }
                }
            }
        });

        while (true) {
            await sleep();
            [response] = await listPages();
            if (response?.data?.pageBuilder?.listPages?.data[0].id === p1v4.id) {
                break;
            }
        }

        while (true) {
            await sleep();
            [response] = await listPublishedPages();
            if (response?.data?.pageBuilder?.listPublishedPages?.data?.[0]?.id === p1v4.id) {
                break;
            }
        }

        expect(response.data.pageBuilder.listPublishedPages.data.length).toBe(1);
        expect(response.data.pageBuilder.listPublishedPages.data[0].id).toBe(p1v4.id);

        // 6. Let's try to un-publish the page. First, the wrong one, then the correct one.
        [response] = await unpublishPage({ id: p1v3.id });

        expect(response).toEqual({
            data: {
                pageBuilder: {
                    unpublishPage: {
                        data: null,
                        error: {
                            code: "",
                            data: null,
                            message: `Page "${p1v3.id}" is not published.`
                        }
                    }
                }
            }
        });

        // Now let's try the correct one.
        [response] = await unpublishPage({ id: p1v4.id });

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    unpublishPage: {
                        data: {
                            id: p1v4.id,
                            status: "unpublished",
                            publishedOn: expect.stringMatching(/^20/),
                            category: {
                                slug: "slug"
                            },
                            version: 4,
                            title: "Untitled"
                        },
                        error: null
                    }
                }
            }
        });

        // The list should not return any records.
        while (true) {
            await sleep();
            [response] = await listPublishedPages();
            if (response?.data?.pageBuilder?.listPublishedPages?.data.length === 0) {
                break;
            }
        }
    });
});
