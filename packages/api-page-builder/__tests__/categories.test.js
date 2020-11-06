import useGqlHandler from "./useGqlHandler";

describe("CRUD Test", () => {
    const {
        createCategory,
        deleteCategory,
        listCategories,
        getCategory,
        updateCategory
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
            let data = {
                slug: `${prefix}slug`,
                name: `${prefix}name-UPDATED`,
                url: `${prefix}url-UPDATED`,
                layout: `${prefix}layout-UPDATED`
            };

            let [response] = await deleteCategory({ slug: data.slug });
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
});
