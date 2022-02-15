import useGqlHandler from "./useGqlHandler";

jest.setTimeout(100000);

describe("listing published pages", () => {
    const { createCategory, createPage, publishPage, listPublishedPages, updatePage, until } =
        useGqlHandler();

    let initiallyCreatedPagesIds: string[] = [];

    beforeEach(async () => {
        initiallyCreatedPagesIds = [];
        await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const letters = ["a", "z", "b", "x", "c"];
        for (const letter of letters) {
            const [response] = await createPage({ category: "category" });
            const { id } = response.data.pageBuilder.createPage.data;

            await updatePage({
                id,
                data: {
                    title: `page-${letter}`
                }
            });

            initiallyCreatedPagesIds.push(id);

            // Publish pages.
            if (["a", "b", "c"].includes(letter)) {
                await publishPage({
                    id
                });
            }
        }
    });

    test("sorting", async () => {
        // 1. Check if all were returned and sorted `createdOn: asc`.
        await until(
            () => listPublishedPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data[0].title === "page-c"
        ).then(([response]) =>
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        listPublishedPages: {
                            data: [{ title: "page-c" }, { title: "page-b" }, { title: "page-a" }]
                        }
                    }
                }
            })
        );

        // 2. Check if all were returned and sorted `createdOn: asc`.
        await until(
            () => listPublishedPages({ sort: ["createdOn_ASC"] }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data[0].title === "page-a"
        ).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPublishedPages: {
                            data: [{ title: "page-a" }, { title: "page-b" }, { title: "page-c" }]
                        }
                    }
                }
            })
        );

        // 3. Check if all were returned and sorted `title: asc`.
        await until(
            () => listPublishedPages({ sort: ["title_ASC"] }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data[0].title === "page-a"
        ).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPublishedPages: {
                            data: [{ title: "page-a" }, { title: "page-b" }, { title: "page-c" }]
                        }
                    }
                }
            })
        );

        // 4. Check if all were returned and sorted `title: desc`.
        await until(
            () => listPublishedPages({ sort: ["title_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data[0].title === "page-c"
        ).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPublishedPages: {
                            data: [{ title: "page-c" }, { title: "page-b" }, { title: "page-a" }]
                        }
                    }
                }
            })
        );
    });

    test("filtering by category", async () => {
        await createCategory({
            data: {
                slug: `custom`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const letters = ["j", "n", "k", "m", "l"];
        // Test creating, getting and updating three pages.
        for (let i = 0; i < letters.length; i++) {
            const letter = letters[i];
            const [response] = await createPage({ category: "custom" });
            const { id } = response.data.pageBuilder.createPage.data;

            await updatePage({
                id,
                data: {
                    title: `page-${letter}`
                }
            });

            // Publish pages.
            if (["j", "k", "l"].includes(letters[i])) {
                await publishPage({
                    id
                });
            }
        }

        // List should show six published pages.
        // 1. Check if all were returned and sorted `createdOn: desc`.
        await until(
            () => listPublishedPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data[0].title === "page-l"
        ).then(([response]) =>
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        listPublishedPages: {
                            data: [
                                { title: "page-l" },
                                { title: "page-k" },
                                { title: "page-j" },
                                { title: "page-c" },
                                { title: "page-b" },
                                { title: "page-a" }
                            ]
                        }
                    }
                }
            })
        );

        // 2. Check if `category: custom` were returned.
        await until(
            () => listPublishedPages({ sort: ["createdOn_DESC"], where: { category: "custom" } }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data[0].title === "page-l"
        ).then(([response]) =>
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        listPublishedPages: {
                            data: [{ title: "page-l" }, { title: "page-k" }, { title: "page-j" }]
                        }
                    }
                }
            })
        );

        // 2.1. Check if `category: category` pages were returned.
        await until(
            () =>
                listPublishedPages({
                    sort: ["createdOn_DESC"],
                    where: { category: "category" }
                }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data[0].title === "page-c"
        ).then(([response]) =>
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        listPublishedPages: {
                            data: [{ title: "page-c" }, { title: "page-b" }, { title: "page-a" }]
                        }
                    }
                }
            })
        );

        // 3. Check if `category: custom` were returned and sorted `title: asc`.
        await until(
            () => listPublishedPages({ where: { category: "custom" }, sort: ["title_ASC"] }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data[0].title === "page-j"
        ).then(([response]) =>
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        listPublishedPages: {
                            data: [{ title: "page-j" }, { title: "page-k" }, { title: "page-l" }]
                        }
                    }
                }
            })
        );

        // 3.1. Check if `category: category` pages were returned.
        await until(
            () => listPublishedPages({ where: { category: "category" }, sort: ["title_ASC"] }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data[0].title === "page-a"
        ).then(([response]) =>
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        listPublishedPages: {
                            data: [{ title: "page-a" }, { title: "page-b" }, { title: "page-c" }]
                        }
                    }
                }
            })
        );
    });

    test("pagination", async () => {
        await until(
            () => listPublishedPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 3,
            {
                name: "list published createdOn_DESC"
            }
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPublishedPages.meta).toEqual({
                cursor: null,
                hasMoreItems: false,
                totalCount: 3
            })
        );

        await until(
            () => listPublishedPages({ sort: ["createdOn_DESC"], limit: 1 }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 1,
            {
                name: "list published createdOn_DESC limit 1"
            }
        ).then(([res]) => {
            expect(res.data.pageBuilder.listPublishedPages.data[0].title).toBe("page-c");
            expect(res.data.pageBuilder.listPublishedPages.meta).toEqual({
                cursor: expect.any(String),
                hasMoreItems: true,
                totalCount: 3
            });
        });

        const [findCreatedOnDescLimit2CursorResponse] = await listPublishedPages({
            sort: ["createdOn_DESC"],
            limit: 2
        });

        expect(findCreatedOnDescLimit2CursorResponse).toEqual({
            data: {
                pageBuilder: {
                    listPublishedPages: {
                        data: expect.any(Array),
                        error: null,
                        meta: {
                            hasMoreItems: true,
                            cursor: expect.any(String),
                            totalCount: 3
                        }
                    }
                }
            }
        });

        const cursorCreatedOnDescLimit2 =
            findCreatedOnDescLimit2CursorResponse.data.pageBuilder.listPublishedPages.meta.cursor;

        await until(
            () =>
                listPublishedPages({
                    sort: ["createdOn_DESC"],
                    after: cursorCreatedOnDescLimit2,
                    limit: 2
                }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 1,
            {
                name: "list published createdOn_DESC limit 1 after"
            }
        ).then(([res]) => {
            expect(res.data.pageBuilder.listPublishedPages.data[0].title).toBe("page-a");
            expect(res.data.pageBuilder.listPublishedPages.meta).toEqual({
                hasMoreItems: false,
                cursor: null,
                totalCount: 3
            });
        });

        const [findTitleAscLimit2CursorResponse] = await listPublishedPages({
            limit: 2,
            sort: ["title_ASC"]
        });

        expect(findTitleAscLimit2CursorResponse).toEqual({
            data: {
                pageBuilder: {
                    listPublishedPages: {
                        data: expect.any(Array),
                        error: null,
                        meta: {
                            hasMoreItems: true,
                            cursor: expect.any(String),
                            totalCount: 3
                        }
                    }
                }
            }
        });

        const cursorTitleAscLimit2 =
            findTitleAscLimit2CursorResponse.data.pageBuilder.listPublishedPages.meta.cursor;

        await until(
            () =>
                listPublishedPages({ after: cursorTitleAscLimit2, limit: 2, sort: ["title_ASC"] }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 1,
            {
                name: "list published title_ASC limit 2 after"
            }
        ).then(([res]) => {
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPublishedPages: {
                            data: [{ title: "page-c" }]
                        }
                    }
                }
            });
            expect(res.data.pageBuilder.listPublishedPages.meta).toEqual({
                totalCount: 3,
                hasMoreItems: false,
                cursor: null
            });
        });

        const [findTitleDescLimit2CursorResponse] = await listPublishedPages({
            limit: 2,
            sort: ["title_DESC"]
        });

        expect(findTitleDescLimit2CursorResponse).toEqual({
            data: {
                pageBuilder: {
                    listPublishedPages: {
                        data: expect.any(Array),
                        error: null,
                        meta: {
                            hasMoreItems: true,
                            cursor: expect.any(String),
                            totalCount: 3
                        }
                    }
                }
            }
        });

        const titleDescLimit2Cursor =
            findTitleDescLimit2CursorResponse.data.pageBuilder.listPublishedPages.meta.cursor;

        await until(
            () =>
                listPublishedPages({
                    after: titleDescLimit2Cursor,
                    limit: 1,
                    sort: ["title_DESC"]
                }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 1
        ).then(([res]) => {
            {
                expect(res).toMatchObject({
                    data: {
                        pageBuilder: {
                            listPublishedPages: {
                                data: [{ title: "page-a" }]
                            }
                        }
                    }
                });
                expect(res.data.pageBuilder.listPublishedPages.meta).toEqual({
                    cursor: null,
                    hasMoreItems: false,
                    totalCount: 3
                });
            }
        });
    });

    test("filtering by tags", async () => {
        const letters = ["j", "n", "k", "m", "l"];
        for (let i = 0; i < 5; i++) {
            const [response] = await createPage({ category: "category" });
            const { id } = response.data.pageBuilder.createPage.data;

            await updatePage({
                id,
                data: {
                    title: `page-${letters[i]}`
                }
            });

            // Add tags and publish pages.
            const tags: Record<string, string[]> = {
                j: ["news"],
                k: ["news", "world"],
                l: ["news", "local"]
            };

            if (["j", "k", "l"].includes(letters[i])) {
                await updatePage({
                    id,
                    data: {
                        settings: {
                            general: {
                                tags: tags[letters[i]]
                            }
                        }
                    }
                });

                await publishPage({
                    id
                });
            }
        }

        // Just in case, ensure all pages are present.
        await until(
            () => listPublishedPages({ sort: ["createdOn_DESC"] }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data[0].title === "page-l"
        ).then(([res]) => expect(res.data.pageBuilder.listPublishedPages.data.length).toBe(6));

        // The following are testing "all tags must be matched" mode.
        await until(
            () =>
                listPublishedPages({
                    sort: ["createdOn_DESC"],
                    where: { tags: { query: ["news"] } }
                }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 3
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPublishedPages.data).toMatchObject([
                { title: "page-l" },
                { title: "page-k" },
                { title: "page-j" }
            ])
        );

        await until(
            () =>
                listPublishedPages({
                    sort: ["createdOn_DESC"],
                    where: {
                        tags: {
                            query: ["world", "news"]
                        }
                    }
                }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 1
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPublishedPages.data).toMatchObject([
                { title: "page-k" }
            ])
        );

        await until(
            () =>
                listPublishedPages({
                    sort: ["createdOn_DESC"],
                    where: {
                        tags: {
                            query: ["local", "news"]
                        }
                    }
                }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 1
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPublishedPages.data).toMatchObject([
                { title: "page-l" }
            ])
        );

        // The following are testing "at least one tag must be matched" mode.

        // 1. Let's just check if the `allTags: true` returns 1 result (so, the same as when not specified at all).
        await until(
            () =>
                listPublishedPages({
                    sort: ["createdOn_DESC"],
                    where: {
                        tags: {
                            query: ["local", "news"]
                        }
                    }
                }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 1
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPublishedPages.data).toMatchObject([
                { title: "page-l" }
            ])
        );

        // 2. This should return all pages.
        await until(
            () =>
                listPublishedPages({
                    sort: ["createdOn_DESC"],
                    where: { tags: { query: ["local", "news"], rule: "any" } }
                }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 3
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPublishedPages.data).toMatchObject([
                { title: "page-l" },
                { title: "page-k" },
                { title: "page-j" }
            ])
        );

        // 3. This should return two pages.
        await until(
            () =>
                listPublishedPages({
                    sort: ["createdOn_DESC"],
                    where: { tags: { query: ["local", "world"], rule: "any" } }
                }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 2
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPublishedPages.data).toMatchObject([
                { title: "page-l" },
                { title: "page-k" }
            ])
        );

        // 3.1. The same query, but with no rule specified (which means "all"), should return nothing.
        await until(
            () =>
                listPublishedPages({
                    sort: ["createdOn_DESC"],
                    where: { tags: { query: ["local", "world"] } }
                }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 0
        );
    });

    test("exclude pages by path and page ids", async () => {
        const paths = ["/about-us", "/home", "/pricing", "/root", "/features"];
        const pageIds: string[] = [];
        for (let i = 0; i < 5; i++) {
            const [response] = await createPage({ category: "category" });
            const { id, pid } = response.data.pageBuilder.createPage.data;

            await updatePage({
                id,
                data: {
                    title: `page-${paths[i]}`,
                    path: paths[i]
                }
            });

            await publishPage({
                id
            });

            pageIds.push(pid);
        }

        // Now let's check the exclude page by path and pid.
        await until(
            () =>
                listPublishedPages({
                    exclude: ["/about-us", "/pricing", pageIds[1]],
                    sort: ["createdOn_DESC"]
                }),
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 5,
            {
                name: "list published pages exclude about-us and pricing"
            }
        ).then(([res]) => {
            expect(res.data.pageBuilder.listPublishedPages.data).toMatchObject([
                { path: "/features" },
                { path: "/root" },
                {
                    title: `page-c`
                },
                {
                    title: `page-b`
                },
                {
                    title: `page-a`
                }
            ]);
        });
    });

    test("sort by publishedOn", async () => {
        await publishPage({ id: initiallyCreatedPagesIds[1] });
        await publishPage({ id: initiallyCreatedPagesIds[3] });

        // We should still get all results when no filters are applied.
        // 1. Check if all were returned and sorted `createdOn: desc`.
        await until(
            listPublishedPages,
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 5
        );

        await listPublishedPages({
            sort: ["publishedOn_ASC"]
        }).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPublishedPages: {
                            data: [
                                { title: "page-a", status: "published" },
                                { title: "page-b", status: "published" },
                                { title: "page-c", status: "published" },
                                { title: "page-z", status: "published" },
                                { title: "page-x", status: "published" }
                            ]
                        }
                    }
                }
            })
        );

        await listPublishedPages({
            sort: ["publishedOn_DESC"]
        }).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPublishedPages: {
                            data: [
                                { title: "page-x", status: "published" },
                                { title: "page-z", status: "published" },
                                { title: "page-c", status: "published" },
                                { title: "page-b", status: "published" },
                                { title: "page-a", status: "published" }
                            ]
                        }
                    }
                }
            })
        );
    });

    /* eslint-disable */
    /*
    // TODO figure out how to check how much db calls were made
    test("ensure we don't overload categories when listing pages", async () => {
        await until(
            listPublishedPages,
            ([res]: any) => res.data.pageBuilder.listPublishedPages.data.length === 3
        );

        // Let's use the `id` of the last log as the cursor.
        const [logs] = await logsDb.readLogs();
        const { id: cursor } = logs.pop();

        await listPublishedPages();

        // When listing published pages, settings must have been loaded from the DB only once.
        const result = await logsDb
            .readLogs()
            .then(([logs]) => logs.filter(item => item.id > cursor))
            .then(logs => logs.filter(item => item.query.PK === "T#root#L#en-US#PB#C"));

        expect(result).toHaveLength(1);
    });
    */
});
