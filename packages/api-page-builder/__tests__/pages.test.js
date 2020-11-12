import useGqlHandler from "./useGqlHandler";

describe("CRUD Test", () => {
    const {
        elasticSearch,
        createCategory,
        createPage,
        deletePage,
        listPages,
        getPage,
        updatePage,
        sleep
    } = useGqlHandler();

    beforeAll(async () => {
        try {
            await elasticSearch.indices.delete({ index: "page-builder" });
        } catch {}
    });

    test("create, read, update and delete pages", async () => {
        let [response] = await createPage({ data: { category: "unknown" } });
        expect(response).toEqual({
            data: {
                pageBuilder: {
                    createPage: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: 'Category with slug "unknown" not found.'
                        }
                    }
                }
            }
        });

        const [category] = await createCategory({
            data: {
                slug: `slug`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        // Test creating, getting and updating three pages.
        for (let i = 0; i < 3; i++) {
            let data = {
                category: category.data.pageBuilder.createCategory.data.slug
            };

            let [response] = await createPage({ data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        createPage: {
                            data: {
                                ...data,
                                title: "Untitled",
                                url: /^\/some-url\/untitled-*/,
                                published: null,
                                locked: null,
                                version: 1,
                                createdOn: /^20/,
                                createdBy: { displayName: "m", id: "mocked" }
                            },
                            error: null
                        }
                    }
                }
            });

            [response] = await getPage({ id: response.data.pageBuilder.createPage.data.id });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        getPage: {
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

            const { id } = response.data.pageBuilder.getPage.data;
            data = {
                title: "title-UPDATED-" + i,
                url: "url-UPDATED-" + i,
                snippet: "snippet-UPDATED-" + i
            };

            [response] = await updatePage({
                id,
                data
            });

            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        updatePage: {
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

        // List should show three pages.
        while (true) {
            await sleep();
            [response] = await listPages();
            if (response.data.pageBuilder.listPages.data.length) {
                break;
            }
        }

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                category: "slug",
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/,
                                id: /^[a-zA-Z0-9]{15}$/,
                                published: false,
                                status: "draft",
                                title: "title-UPDATED-2",
                                url: "url-UPDATED-2"
                            },
                            {
                                category: "slug",
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/,
                                id: /^[a-zA-Z0-9]{15}$/,
                                published: false,
                                status: "draft",
                                title: "title-UPDATED-1",
                                url: "url-UPDATED-1"
                            },
                            {
                                category: "slug",
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/,
                                id: /^[a-zA-Z0-9]{15}$/,
                                published: false,
                                status: "draft",
                                title: "title-UPDATED-0",
                                url: "url-UPDATED-0"
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // After deleting all pages, list should be empty.
        for (let i = 0; i < response.data.pageBuilder.listPages.data.length; i++) {
            const { id } = response.data.pageBuilder.listPages.data[i];
            const [deleteResponse] = await deletePage({ id });
            expect(deleteResponse).toMatchObject({
                data: {
                    pageBuilder: {
                        deletePage: {
                            data: {
                                id,
                                createdOn: /^20/,
                                createdBy: { displayName: "m", id: "mocked" }
                            },
                            error: null
                        }
                    }
                }
            });
        }

        // List should show zero pages.
        while (response.data.pageBuilder.listPages.data.length !== 0) {
            await sleep();
            [response] = await listPages();
        }

        [response] = await listPages();
        expect(response).toEqual({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [],
                        error: null
                    }
                }
            }
        });
    });
});
