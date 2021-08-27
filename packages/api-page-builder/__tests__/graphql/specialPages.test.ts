import useGqlHandler from "./useGqlHandler";

const CANNOT_UNPUBLISH_RESPONSE = type => ({
    data: {
        pageBuilder: {
            unpublishPage: {
                data: null,
                error: {
                    code: "",
                    data: null,
                    message: `Cannot unpublish page because it's set as ${type}.`
                }
            }
        }
    }
});

describe("Settings Test", () => {
    const {
        createCategory,
        createPage,
        updateSettings,
        publishPage,
        unpublishPage,
        getPublishedPage
    } = useGqlHandler();

    test("setting page as homepage", async () => {
        await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const page = await createPage({ category: "category" }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );

        await publishPage({ id: page.id });

        await getPublishedPage({ path: "/" }).then(([res]) =>
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

        await updateSettings({
            data: {
                pages: {
                    home: page.id
                }
            }
        });

        await getPublishedPage({ path: "/" }).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        getPublishedPage: {
                            data: {
                                category: {
                                    slug: "category"
                                },
                                locked: true,
                                path: /^some-url\/untitled-/,
                                status: "published",
                                title: "Untitled",
                                version: 1
                            },
                            error: null
                        }
                    }
                }
            })
        );
    });

    test("prevent unpublish if page is special", async () => {
        await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const p1 = await createPage({ category: "category" }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );

        const p2 = await createPage({ category: "category" }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );

        await publishPage({ id: p1.id });
        await publishPage({ id: p2.id });

        await updateSettings({
            data: {
                pages: {
                    home: p1.id,
                    notFound: p1.id
                }
            }
        });

        await unpublishPage({ id: p1.id }).then(([res]) =>
            expect(res).toEqual(CANNOT_UNPUBLISH_RESPONSE("home"))
        );

        await updateSettings({
            data: {
                pages: {
                    home: p2.id,
                    notFound: p1.id
                }
            }
        });
        await unpublishPage({ id: p1.id }).then(([res]) =>
            expect(res).toEqual(CANNOT_UNPUBLISH_RESPONSE("notFound"))
        );

        await updateSettings({
            data: {
                pages: {
                    home: p2.id,
                    notFound: p1.id
                }
            }
        });
        await unpublishPage({ id: p1.id }).then(([res]) =>
            expect(res).toEqual(CANNOT_UNPUBLISH_RESPONSE("notFound"))
        );

        await updateSettings({
            data: {
                pages: {
                    home: p2.id,
                    notFound: p2.id
                }
            }
        });

        await unpublishPage({ id: p1.id }).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        unpublishPage: {
                            data: {
                                locked: true,
                                path: /^some-url\/untitled-/,
                                status: "unpublished",
                                title: "Untitled",
                                version: 1
                            },
                            error: null
                        }
                    }
                }
            })
        );
    });
});
