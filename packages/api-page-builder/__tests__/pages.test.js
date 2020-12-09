import useGqlHandler from "./useGqlHandler";

describe("CRUD Test", () => {
    const {
        createCategory,
        createPage,
        deletePage,
        listPages,
        getPage,
        updatePage,
        sleep,
        deleteElasticSearchIndex
    } = useGqlHandler();

    beforeAll(async () => {
        await deleteElasticSearchIndex();
    });

    test("create, read, update and delete pages", async () => {
        let [response] = await createPage({ category: "unknown" });
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

        const ids = [];
        // Test creating, getting and updating three pages.
        for (let i = 0; i < 3; i++) {
            let data = {
                category: category.data.pageBuilder.createCategory.data.slug
            };

            let [response] = await createPage(data);
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        createPage: {
                            data: {
                                category: {
                                    slug: "slug"
                                },
                                title: "Untitled",
                                url: /^\/some-url\/untitled-.*/,
                                publishedOn: null,
                                locked: false,
                                version: 1,
                                editor: "page-builder",
                                createdOn: expect.stringMatching(/^20.*/),
                                createdBy: { displayName: "m", id: "mocked" }
                            },
                            error: null
                        }
                    }
                }
            });

            let { id } = response.data.pageBuilder.createPage.data;

            ids.push(id);
            [response] = await getPage({ id });

            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        getPage: {
                            data: {
                                category: {
                                    slug: "slug"
                                },
                                editor: "page-builder",
                                createdOn: /^20.*/,
                                createdBy: { displayName: "m", id: "mocked" }
                            },
                            error: null
                        }
                    }
                }
            });

            id = response.data.pageBuilder.getPage.data.id;

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
                                editor: "page-builder",
                                createdOn: /^20.*/,
                                createdBy: { displayName: "m", id: "mocked" }
                            },
                            error: null
                        }
                    }
                }
            });
        }

        while (true) {
            await sleep();
            [response] = await listPages({ sort: { createdOn: "desc" } });
            if (response?.data?.pageBuilder?.listPages?.data.length) {
                break;
            }
        }

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            {
                                editor: "page-builder",
                                category: {
                                    slug: "slug"
                                },
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/,
                                savedOn: /^20/,
                                id: ids[2],
                                status: "draft",
                                title: "title-UPDATED-2",
                                url: "url-UPDATED-2"
                            },
                            {
                                editor: "page-builder",
                                category: {
                                    slug: "slug"
                                },
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/,
                                savedOn: /^20/,
                                id: ids[1],
                                status: "draft",
                                title: "title-UPDATED-1",
                                url: "url-UPDATED-1"
                            },
                            {
                                editor: "page-builder",
                                category: {
                                    slug: "slug"
                                },
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/,
                                savedOn: /^20/,
                                id: ids[0],
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
                                latestPage: null,
                                page: {
                                    id,
                                    editor: "page-builder",
                                    createdOn: /^20.*/,
                                    createdBy: { displayName: "m", id: "mocked" }
                                }
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
            [response] = await listPages({ sort: { createdOn: "desc" } });
        }

        expect(response).toEqual({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [],
                        error: null,
                        meta: {
                            from: 0,
                            limit: 10,
                            nextPage: null,
                            page: 1,
                            previousPage: null,
                            to: 0,
                            totalCount: 0,
                            totalPages: 0
                        }
                    }
                }
            }
        });
    });
});
