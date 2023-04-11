import useGqlHandler from "./useGqlHandler";
import { Page } from "~/types";

jest.setTimeout(100000);

describe("versioning and publishing pages", () => {
    const {
        createCategory,
        createPage,
        publishPage,
        updatePage,
        deletePage,
        unpublishPage,
        listPages,
        listPublishedPages,
        getPublishedPage,
        until
    } = useGqlHandler();

    test("try publishing and unpublishing pages / revisions", async () => {
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
        const [createP1V1Response] = await createPage({ category });
        const p1v1 = createP1V1Response.data.pageBuilder.createPage.data;

        expect(p1v1).toMatchObject({
            id: /^[a-f0-9]{24}#1$/,
            version: 1,
            createdFrom: null
        });

        await until(
            () => listPublishedPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 0,
            {
                name: "list published pages after create two pages"
            }
        );

        await until(
            () => listPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPages.data.length === 2,
            {
                name: "list after create two pages"
            }
        );

        const [listResponse] = await listPages({
            sort: ["createdOn_DESC"]
        });
        expect(listResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                id: p1v1.id,
                                status: "draft"
                            },
                            {
                                id: expect.any(String),
                                status: "draft"
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // 2. Create p1v2 from p1v1.
        const [createP1V2Response] = await createPage({ from: p1v1.id });

        const p1v2 = createP1V2Response.data.pageBuilder.createPage.data;

        const [p1v1UniqueId] = p1v1.id.split("#");

        expect(p1v2).toMatchObject({
            id: p1v1UniqueId + "#0002",
            createdFrom: p1v1.id,
            version: 2
        });

        await until(
            () => listPublishedPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 0,
            {
                name: "list published pages after create p1v2"
            }
        ).then(([res]) => expect(res.data.pageBuilder.listPublishedPages.error).toBe(null));

        await until(
            () => listPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPages.data[0].id === p1v2.id,
            {
                name: `list pages after create p1v2: ${p1v2.id}`
            }
        ).then(([res]) => {
            expect(res.data.pageBuilder.listPages.data.length).toBe(2);
            expect(res.data.pageBuilder.listPages.data[0]).toMatchObject({
                id: p1v2.id,
                status: "draft"
            });
        });

        // 3. Create p1v3 from p1v1 as well.
        const p1v3 = await createPage({ from: p1v1.id }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );

        expect(p1v3).toMatchObject({
            id: p1v1UniqueId + "#0003",
            createdFrom: p1v1.id,
            version: 3
        });

        await until(
            () => listPublishedPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 0,
            {
                name: "list published pages after create p1v3"
            }
        ).then(([res]) => expect(res.data.pageBuilder.listPublishedPages.error).toBe(null));

        await until(
            () => listPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPages.data[0].id === p1v3.id,
            {
                name: "list pages after create create p1v3"
            }
        ).then(([res]) => {
            expect(res.data.pageBuilder.listPages.data.length).toBe(2);
            expect(res.data.pageBuilder.listPages.data[0]).toMatchObject({
                id: p1v3.id,
                status: "draft"
            });
        });

        // 4. Let's try publishing the p1v2.
        const [p1v2PublishResponse] = await publishPage({ id: p1v2.id });

        expect(p1v2PublishResponse).toMatchObject({
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
        });

        const [listPagesAfterPublishP1V2Response] = await until(
            () => listPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPages.data.length === 2,
            {
                name: "list pages after publish p1v2"
            }
        );

        expect(listPagesAfterPublishP1V2Response).toEqual({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [expect.any(Object), expect.any(Object)],
                        error: null,
                        meta: expect.any(Object)
                    }
                }
            }
        });

        const [listPublishedPagesAfterPublishP1V2Response] = await until(
            () => listPublishedPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data[0].id === p1v2.id,
            {
                name: "list published pages after publish p1v2"
            }
        );

        expect(
            listPublishedPagesAfterPublishP1V2Response.data.pageBuilder.listPublishedPages.data
                .length
        ).toBe(1);
        expect(
            listPublishedPagesAfterPublishP1V2Response.data.pageBuilder.listPublishedPages.data[0]
        ).toMatchObject({
            id: p1v2.id,
            status: "published"
        });

        // 5. Let's try creating a new version (v4) from published p1v2 and publish that.
        [response] = await createPage({ from: p1v2.id });
        const p1v4 = response.data.pageBuilder.createPage.data;
        expect(p1v4).toMatchObject({
            id: p1v1UniqueId + "#0004",
            createdFrom: p1v2.id,
            version: 4
        });

        await until(
            () => listPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => {
                return res.data.pageBuilder.listPages.data.some((page: Page) => {
                    return page.id === p1v4.id;
                });
            },
            {
                name: "make sure list includes new p1v4 page"
            }
        );

        // 5.2. Make sure published pages doesn't include the new p1v4 page in the list.

        const [listPublishedPagesNoP1V4Response] = await until(
            () => listPublishedPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => {
                return res.data.pageBuilder.listPublishedPages.data.every((page: Page) => {
                    return page.id !== p1v4.id;
                });
            },
            {
                name: "make sure published list does not include new p1v4 page"
            }
        );

        expect(
            listPublishedPagesNoP1V4Response.data.pageBuilder.listPublishedPages.data.length
        ).toBe(1);

        // 5.3. Let's publish and check the lists again.
        const [publishP1V4Response] = await publishPage({ id: p1v4.id });

        expect(publishP1V4Response).toMatchObject({
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

        await until(
            () => listPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => {
                return res.data.pageBuilder.listPages.data.some((page: Page) => {
                    return page.id === p1v4.id;
                });
            },
            {
                name: "make sure list includes new p1v4 page #2 run"
            }
        );

        const [listPublishedIncludesP1V4] = await until(
            () => listPublishedPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => {
                return res.data.pageBuilder.listPublishedPages.data.some((page: Page) => {
                    return page.id === p1v4.id;
                });
            },
            {
                name: "make sure published list includes new p1v4 page"
            }
        );

        expect(listPublishedIncludesP1V4.data.pageBuilder.listPublishedPages.data.length).toBe(1);
        expect(listPublishedIncludesP1V4.data.pageBuilder.listPublishedPages.data[0].id).toBe(
            p1v4.id
        );

        // 6. Let's try to un-publish the page. First, the wrong one, then the correct one.
        const [unpublishP1V3Response] = await unpublishPage({ id: p1v3.id });

        expect(unpublishP1V3Response).toEqual({
            data: {
                pageBuilder: {
                    unpublishPage: {
                        data: null,
                        error: {
                            code: "",
                            data: null,
                            message: `Page is not published.`
                        }
                    }
                }
            }
        });

        // Now let's try the correct one.
        const [unpublishP1V4Response] = await unpublishPage({ id: p1v4.id });

        expect(unpublishP1V4Response).toMatchObject({
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

        await until(
            () => listPublishedPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => {
                return res.data.pageBuilder.listPublishedPages.data.length === 0;
            },
            {
                name: "make sure published list does not contain any pages"
            }
        );
    });

    test("must be able to publish a page with the same URL as an already previously-published page", async () => {
        await createCategory({
            data: {
                slug: `slug`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const p1 = await createPage({ category: "slug" }).then(
            async ([res]) => res.data.pageBuilder.createPage.data
        );

        await updatePage({ id: p1.id, data: { path: "/pages-test" } }).then(([res]) =>
            expect(res.data.pageBuilder.updatePage.data.id).toBe(p1.id)
        );

        const p2 = await createPage({ category: "slug" }).then(
            async ([res]) => res.data.pageBuilder.createPage.data
        );

        await updatePage({ id: p2.id, data: { path: "/pages-test" } }).then(([res]) =>
            expect(res.data.pageBuilder.updatePage.data.id).toBe(p2.id)
        );

        // Try publishing 2nd page, it should work.
        await publishPage({ id: p2.id });
        await getPublishedPage({ path: "/pages-test" }).then(([res]) => {
            expect(res.data.pageBuilder.getPublishedPage.data.id).toBe(p2.id);
        });

        // Now, if we try to publish 1st page, we should still be able to do it.
        await publishPage({ id: p1.id });
        await getPublishedPage({ path: "/pages-test" }).then(([res]) =>
            expect(res.data.pageBuilder.getPublishedPage.data.id).toBe(p1.id)
        );
    });

    test("upon publishing, if the path of the page has changed, previously published URL must not exist", async () => {
        await createCategory({
            data: {
                slug: `slug`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const p1v1 = await createPage({ category: "slug" }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );

        await updatePage({ id: p1v1.id, data: { path: "/pages-test" } }).then(([res]) =>
            expect(res.data.pageBuilder.updatePage.data.id).toBe(p1v1.id)
        );

        // Try publishing 2nd page, it should work.
        await publishPage({ id: p1v1.id });

        await getPublishedPage({ path: "/pages-test" }).then(([res]) => {
            expect(res.data.pageBuilder.getPublishedPage.data.id).toBe(p1v1.id);
        });

        const p1v2 = await createPage({ from: p1v1.id }).then(
            async ([res]) => res.data.pageBuilder.createPage.data
        );

        await updatePage({
            id: p1v2.id,
            data: { path: "/pages-test-updated" }
        }).then(([res]) => {
            expect(res.data.pageBuilder.updatePage.data.id).toBe(p1v2.id);
        });

        // Now, if we try to publish 1st page, we should still be able to do it.
        await publishPage({ id: p1v2.id });

        await getPublishedPage({ path: "/pages-test-updated" }).then(([res]) => {
            expect(res.data.pageBuilder.getPublishedPage.data.id).toBe(p1v2.id);
        });

        // This one should not return any results - it's an old URL.
        await getPublishedPage({ path: "/pages-test" }).then(([res]) =>
            expect(res).toEqual({
                data: {
                    pageBuilder: {
                        getPublishedPage: {
                            data: null,
                            error: {
                                code: "NOT_FOUND",
                                data: null,
                                message: "Page not found."
                            }
                        }
                    }
                }
            })
        );
    });

    test("once a page has been deleted, it should not be available via the previous published path", async () => {
        await createCategory({
            data: {
                slug: `slug`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const p1v1 = await createPage({ category: "slug" }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );

        await updatePage({ id: p1v1.id, data: { path: "/pages-test" } }).then(([res]) =>
            expect(res.data.pageBuilder.updatePage.data.id).toBe(p1v1.id)
        );

        // Try publishing 2nd page, it should work.
        await publishPage({ id: p1v1.id });
        await deletePage({ id: p1v1.id });

        // This one should not return any results - it's an old URL.
        await getPublishedPage({ path: "/pages-test" }).then(([res]) =>
            expect(res).toEqual({
                data: {
                    pageBuilder: {
                        getPublishedPage: {
                            data: null,
                            error: {
                                code: "NOT_FOUND",
                                data: null,
                                message: "Page not found."
                            }
                        }
                    }
                }
            })
        );
    });

    test("once a page has been unpublished, it should not be available via the previous published path", async () => {
        await createCategory({
            data: {
                slug: `slug`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const p1v1 = await createPage({ category: "slug" }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );

        expect(p1v1).toMatchObject({
            category: {
                slug: "slug"
            },
            locked: false,
            path: expect.stringMatching("/some-url/untitled-"),
            settings: {
                general: {
                    image: null,
                    layout: "layout",
                    snippet: null,
                    tags: null
                },
                seo: {
                    description: null,
                    meta: [],
                    title: null
                },
                social: {
                    description: null,
                    image: null,
                    meta: [],
                    title: null
                }
            },
            status: "draft",
            title: "Untitled",
            url: expect.stringMatching("untitled-"),
            version: 1
        });

        await updatePage({
            id: p1v1.id,
            data: { path: "/pages-test" }
        }).then(([res]) => expect(res.data.pageBuilder.updatePage.data.id).toBe(p1v1.id));

        // Try publishing 2nd page, it should work.
        await publishPage({ id: p1v1.id });

        const [getPublishedResponse] = await getPublishedPage({ path: "/pages-test" });

        expect(getPublishedResponse).toMatchObject({
            data: {
                pageBuilder: {
                    getPublishedPage: {
                        data: {
                            category: {
                                slug: "slug"
                            },
                            locked: true,
                            path: "/pages-test",
                            settings: {
                                general: {
                                    image: null,
                                    layout: "layout",
                                    snippet: null,
                                    tags: null
                                },
                                seo: {
                                    description: null,
                                    meta: [],
                                    title: null
                                },
                                social: {
                                    description: null,
                                    image: null,
                                    meta: [],
                                    title: null
                                }
                            },
                            status: "published",
                            title: "Untitled",
                            url: "https://www.test.com/pages-test",
                            version: 1
                        },
                        error: null
                    }
                }
            }
        });

        await unpublishPage({ id: p1v1.id });

        // This one should not return any results - it's an old URL.
        const [getPublishedPageAfterUnpublishedResponse] = await getPublishedPage({
            path: "/pages-test"
        });

        expect(getPublishedPageAfterUnpublishedResponse).toEqual({
            data: {
                pageBuilder: {
                    getPublishedPage: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: "Page not found."
                        }
                    }
                }
            }
        });
    });
});
