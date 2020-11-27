import useGqlHandler from "./useGqlHandler";

describe("listing latest pages", () => {
    const {
        deleteElasticSearchIndex,
        createCategory,
        createPage,
        publishPage,
        unpublishPage,
        requestReview,
        requestChanges,
        listPages,
        updatePage,
        sleep,
        tryUntil
    } = useGqlHandler();

    let initiallyCreatedPagesIds;

    beforeEach(async () => {
        initiallyCreatedPagesIds = [];
        await deleteElasticSearchIndex();
        await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const letters = ["a", "z", "b", "x", "c"];
        for (let i = 0; i < 5; i++) {
            let [response] = await createPage({ data: { category: "category" } });
            const { id } = response.data.pageBuilder.createPage.data;

            await updatePage({
                id,
                data: {
                    title: `page-${letters[i]}`
                }
            });

            initiallyCreatedPagesIds.push(id);
        }
    });

    test("sorting", async () => {
        // List should show all five pages.
        let response;
        while (true) {
            await sleep();
            [response] = await listPages();
            if (response?.data?.pageBuilder?.listPages?.data?.[0]?.title === "page-c") {
                break;
            }
        }

        // 1. Check if all were returned and sorted `createdOn: asc`.
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-c" },
                            { title: "page-x" },
                            { title: "page-b" },
                            { title: "page-z" },
                            { title: "page-a" }
                        ]
                    }
                }
            }
        });

        // 2. Check if all were returned and sorted `createdOn: asc`.
        while (true) {
            await sleep();
            [response] = await listPages({ sort: { createdOn: "asc" } });
            if (response?.data?.pageBuilder?.listPages?.data[0].title === "page-a") {
                break;
            }
        }

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-a" },
                            { title: "page-z" },
                            { title: "page-b" },
                            { title: "page-x" },
                            { title: "page-c" }
                        ]
                    }
                }
            }
        });

        // 3. Check if all were returned and sorted `title: asc`.
        while (true) {
            await sleep();
            [response] = await listPages({ sort: { title: "asc" } });

            if (response?.data?.pageBuilder?.listPages?.data[0].title === "page-a") {
                break;
            }
        }

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-a" },
                            { title: "page-b" },
                            { title: "page-c" },
                            { title: "page-x" },
                            { title: "page-z" }
                        ]
                    }
                }
            }
        });

        // 4. Check if all were returned and sorted `title: desc`.
        while (true) {
            await sleep();
            [response] = await listPages({ sort: { title: "desc" } });

            if (response?.data?.pageBuilder?.listPages?.data[0].title === "page-z") {
                break;
            }
        }

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-z" },
                            { title: "page-x" },
                            { title: "page-c" },
                            { title: "page-b" },
                            { title: "page-a" }
                        ]
                    }
                }
            }
        });
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
            let letter = letters[i];
            let [response] = await createPage({ data: { category: "custom" } });
            const { id } = response.data.pageBuilder.createPage.data;

            await updatePage({
                id,
                data: {
                    title: `page-${letter}`
                }
            });
        }

        // List should show all ten pages.
        let response;
        while (true) {
            await sleep();
            [response] = await listPages();
            if (response?.data?.pageBuilder?.listPages?.data?.[0]?.title === "page-l") {
                break;
            }
        }

        // 1. Check if all were returned and sorted `createdOn: desc`.
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-l" },
                            { title: "page-m" },
                            { title: "page-k" },
                            { title: "page-n" },
                            { title: "page-j" },
                            { title: "page-c" },
                            { title: "page-x" },
                            { title: "page-b" },
                            { title: "page-z" },
                            { title: "page-a" }
                        ]
                    }
                }
            }
        });

        while (true) {
            await sleep();
            [response] = await listPages({ where: { category: "custom" } });
            if (response?.data?.pageBuilder?.listPages?.data[0].title === "page-l") {
                break;
            }
        }

        // 1. Check if `category: custom` were returned and sorted `createdOn: desc`.
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-l" },
                            { title: "page-m" },
                            { title: "page-k" },
                            { title: "page-n" },
                            { title: "page-j" }
                        ]
                    }
                }
            }
        });

        // 2. Check if `category: custom` were returned and sorted `title: asc`.
        while (true) {
            await sleep();
            [response] = await listPages({ sort: { title: "asc" }, where: { category: "custom" } });
            if (response?.data?.pageBuilder?.listPages?.data[0].title === "page-j") {
                break;
            }
        }

        // 1. Check if all were returned and sorted `createdOn: desc`.
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-j" },
                            { title: "page-k" },
                            { title: "page-l" },
                            { title: "page-m" },
                            { title: "page-n" }
                        ]
                    }
                }
            }
        });
    });

    test("filtering by status", async () => {
        // Let's publish first two pages and then only filter by `status: published`
        await publishPage({ id: initiallyCreatedPagesIds[0] });
        await publishPage({ id: initiallyCreatedPagesIds[1] });

        // We should still get all results when no filters are applied.
        // 1. Check if all were returned and sorted `createdOn: desc`.
        await tryUntil(
            () => listPages(),
            ([res]) => res.data.pageBuilder.listPages.data.length
        ).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPages: {
                            data: [
                                { title: "page-c" },
                                { title: "page-x" },
                                { title: "page-b" },
                                { title: "page-z" },
                                { title: "page-a" }
                            ]
                        }
                    }
                }
            })
        );

        // 2. We should only get two results here because we published two pages.
        await tryUntil(
            () => listPages({ where: { status: "published" } }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 2
        ).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPages: {
                            data: [{ title: "page-z" }, { title: "page-a" }]
                        }
                    }
                }
            })
        );

        let response;
        // 3. Check if `status: published` were returned and sorted `title: asc`.
        while (true) {
            await sleep();
            [response] = await listPages({
                sort: { title: "asc" },
                where: { status: "published" }
            });
            if (response?.data?.pageBuilder?.listPages?.data[0]?.title === "page-a") {
                break;
            }
        }

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [{ title: "page-a" }, { title: "page-z" }]
                    }
                }
            }
        });

        // 4. Let's unpublish first two and then again filter by `status: published`. We should not get any pages.
        await unpublishPage({ id: initiallyCreatedPagesIds[0] });
        await unpublishPage({ id: initiallyCreatedPagesIds[1] });

        while (true) {
            await sleep();
            [response] = await listPages({
                sort: { title: "asc" },
                where: { status: "published" }
            });
            if (response?.data?.pageBuilder?.listPages?.data?.length === 0) {
                break;
            }
        }

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: []
                    }
                }
            }
        });

        // 5. Let's test filtering by `reviewRequested` and `changesNeeded` statuses.
        await requestReview({ id: initiallyCreatedPagesIds[0] });
        await requestReview({ id: initiallyCreatedPagesIds[1] });

        while (true) {
            await sleep();
            [response] = await listPages({
                where: { status: "reviewRequested" }
            });
            if (response?.data?.pageBuilder?.listPages?.data?.length === 2) {
                break;
            }
        }

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-z", status: "reviewRequested" },
                            { title: "page-a", status: "reviewRequested" }
                        ]
                    }
                }
            }
        });

        await requestChanges({ id: initiallyCreatedPagesIds[0] });
        await requestChanges({ id: initiallyCreatedPagesIds[1] });

        while (true) {
            await sleep();
            [response] = await listPages({
                where: { status: "reviewRequested" }
            });
            if (response?.data?.pageBuilder?.listPages?.data?.length === 0) {
                break;
            }
        }

        while (true) {
            await sleep();
            [response] = await listPages({
                where: { status: "changesRequested" }
            });
            if (response?.data?.pageBuilder?.listPages?.data?.length === 2) {
                break;
            }
        }

        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPages: {
                        data: [
                            { title: "page-z", status: "changesRequested" },
                            { title: "page-a", status: "changesRequested" }
                        ]
                    }
                }
            }
        });
    });

    test("pagination", async () => {
        await tryUntil(
            () => listPages(),
            ([res]) => res.data.pageBuilder.listPages.data.length === 5
        );

        await tryUntil(
            () => listPages({ limit: 1 }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 1
        ).then(([res]) => expect(res.data.pageBuilder.listPages.data[0].title).toBe("page-c"));

        await tryUntil(
            () => listPages({ page: 3, limit: 1 }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 1
        ).then(([res]) => expect(res.data.pageBuilder.listPages.data[0].title).toBe("page-b"));

        await tryUntil(
            () => listPages({ page: 5, limit: 1 }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 1
        ).then(([res]) => expect(res.data.pageBuilder.listPages.data[0].title).toBe("page-a"));

        await tryUntil(
            () => listPages({ page: 2, limit: 2, sort: { title: "asc" } }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 2
        ).then(([res]) =>
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPages: {
                            data: [{ title: "page-c" }, { title: "page-x" }]
                        }
                    }
                }
            })
        );

        await tryUntil(
            () => listPages({ page: 3, limit: 2, sort: { title: "desc" } }),
            ([res]) => res.data.pageBuilder.listPages.data.length === 1
        ).then(([res]) => {
            expect(res).toMatchObject({
                data: {
                    pageBuilder: {
                        listPages: {
                            data: [{ title: "page-a" }]
                        }
                    }
                }
            });
        });
    });
});
