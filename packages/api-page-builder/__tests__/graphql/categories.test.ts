import useGqlHandler from "./useGqlHandler";

describe("Categories CRUD Test", () => {
    const {
        createCategory,
        createPage,
        deletePage,
        deleteCategory,
        listCategories,
        listPages,
        getCategory,
        updateCategory,
        until
    } = useGqlHandler();

    test("create, read, update and delete categories", async () => {
        // Test creating, getting and updating three categories.
        for (let i = 0; i < 3; i++) {
            const prefix = `category-${i}-`;
            let data = {
                slug: `${prefix}slug`,
                name: `${prefix}name`,
                url: `${prefix}url`,
                layout: `${prefix}layout`
            };

            let [response] = await createCategory({ data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        createCategory: {
                            data: {
                                ...data,
                                createdOn: /^20/,
                                createdBy: { displayName: "m", id: "mocked" }
                            },
                            error: null
                        }
                    }
                }
            });

            [response] = await getCategory({ slug: data.slug });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        getCategory: {
                            data: {
                                ...data,
                                createdOn: /^20/,
                                createdBy: { displayName: "m", id: "mocked" }
                            },
                            error: null
                        }
                    }
                }
            });

            data = {
                slug: data.slug, // Slug cannot be changed.
                name: data.name + "-UPDATED",
                url: data.url + "-UPDATED",
                layout: data.layout + "-UPDATED"
            };

            [response] = await updateCategory({ slug: data.slug, data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        updateCategory: {
                            data: {
                                ...data,
                                createdOn: /^20/,
                                createdBy: { displayName: "m", id: "mocked" }
                            },
                            error: null
                        }
                    }
                }
            });
        }

        // List should show three categories.
        let [response] = await listCategories();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listCategories: {
                        data: [
                            {
                                url: "category-0-url-UPDATED",
                                layout: "category-0-layout-UPDATED",
                                slug: "category-0-slug",
                                name: "category-0-name-UPDATED",
                                createdOn: /^20/,
                                createdBy: { displayName: "m", id: "mocked" }
                            },
                            {
                                url: "category-1-url-UPDATED",
                                layout: "category-1-layout-UPDATED",
                                slug: "category-1-slug",
                                name: "category-1-name-UPDATED",
                                createdOn: /^20/,
                                createdBy: { displayName: "m", id: "mocked" }
                            },
                            {
                                url: "category-2-url-UPDATED",
                                layout: "category-2-layout-UPDATED",
                                slug: "category-2-slug",
                                name: "category-2-name-UPDATED",
                                createdOn: /^20/,
                                createdBy: { displayName: "m", id: "mocked" }
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // After deleting all categories, list should be empty.
        for (let i = 0; i < 3; i++) {
            const prefix = `category-${i}-`;
            const data = {
                slug: `${prefix}slug`,
                name: `${prefix}name-UPDATED`,
                url: `${prefix}url-UPDATED`,
                layout: `${prefix}layout-UPDATED`
            };

            const [response] = await deleteCategory({ slug: data.slug });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        deleteCategory: {
                            data: {
                                ...data,
                                createdOn: /^20/,
                                createdBy: { displayName: "m", id: "mocked" }
                            },
                            error: null
                        }
                    }
                }
            });
        }

        // List should show zero categories.
        [response] = await listCategories();
        expect(response).toEqual({
            data: {
                pageBuilder: {
                    listCategories: {
                        data: [],
                        error: null
                    }
                }
            }
        });
    });

    test("cannot delete category if in use by at least one page", async () => {
        await createCategory({
            data: {
                slug: `delete-cat`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const p1 = await createPage({ category: "delete-cat" }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );
        const p2 = await createPage({ category: "delete-cat" }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );
        const p3 = await createPage({ category: "delete-cat" }).then(
            ([res]) => res.data.pageBuilder.createPage.data
        );

        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data.length === 3, {
            wait: 300,
            tries: 10,
            name: "list pages before delete"
        });

        const error = {
            code: "CANNOT_DELETE_CATEGORY_PAGE_EXISTING",
            data: null,
            message: "Cannot delete category because some pages are linked to it."
        };

        await deleteCategory({ slug: "delete-cat" }).then(([res]) =>
            expect(res.data.pageBuilder.deleteCategory.error).toEqual(error)
        );

        await deletePage({ id: p1.id });

        await deleteCategory({ slug: "delete-cat" }).then(([res]) =>
            expect(res.data.pageBuilder.deleteCategory.error).toEqual(error)
        );

        await deletePage({ id: p2.id });

        await deleteCategory({ slug: "delete-cat" }).then(([res]) =>
            expect(res.data.pageBuilder.deleteCategory.error).toEqual(error)
        );

        const [deletePageResponse] = await deletePage({ id: p3.id });

        expect(deletePageResponse).toEqual({
            data: {
                pageBuilder: {
                    deletePage: {
                        data: {
                            page: {
                                ...p3,
                                revisions: []
                            },
                            latestPage: null
                        },
                        error: null
                    }
                }
            }
        });

        await until(listPages, ([res]) => res.data.pageBuilder.listPages.data.length === 0, {
            wait: 300,
            tries: 10,
            name: "list pages after delete"
        });

        await deleteCategory({ slug: "delete-cat" }).then(([res]) =>
            expect(res.data.pageBuilder.deleteCategory).toMatchObject({
                data: {
                    createdBy: {
                        displayName: "m",
                        id: "mocked"
                    },
                    layout: "layout",
                    name: "name",
                    slug: "delete-cat",
                    url: "/some-url/"
                },
                error: null
            })
        );
    });
});
