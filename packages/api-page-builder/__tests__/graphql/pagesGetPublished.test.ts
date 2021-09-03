import useGqlHandler from "./useGqlHandler";

jest.setTimeout(15000);

describe("getting published pages", () => {
    const {
        createCategory,
        createPage,
        publishPage,
        listPublishedPages,
        getPublishedPage,
        updatePage,
        until
    } = useGqlHandler();

    let initiallyCreatedPagesIds;

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
        for (let i = 0; i < 5; i++) {
            const [response] = await createPage({ category: "category" });
            const { id } = response.data.pageBuilder.createPage.data;

            await updatePage({
                id,
                data: {
                    title: `page-${letters[i]}`,
                    path: `/path-${letters[i]}`
                }
            });

            initiallyCreatedPagesIds.push(id);

            // Publish pages.
            if (["a", "b", "c"].includes(letters[i])) {
                await publishPage({
                    id
                });
            }
        }

        await until(
            () => listPublishedPages({ sort: ["createdOn_DESC"] }),
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].title === "page-c"
        );
    });

    test("getting published pages by full ID", async () => {
        await getPublishedPage({ id: initiallyCreatedPagesIds[0] });

        await getPublishedPage({ id: initiallyCreatedPagesIds[0] }).then(([res]) =>
            expect(res.data.pageBuilder.getPublishedPage.data.id).toBe(initiallyCreatedPagesIds[0])
        );
    });

    test("getting published pages by page unique ID (ID without version)", async () => {
        const [pageUniqueId] = initiallyCreatedPagesIds[0].split("#");
        await getPublishedPage({ id: pageUniqueId }).then(([res]) =>
            expect(res.data.pageBuilder.getPublishedPage.data.id).toBe(initiallyCreatedPagesIds[0])
        );
    });

    test("getting published pages by URL", async () => {
        await getPublishedPage({ path: "/path-a" }).then(([res]) =>
            expect(res.data.pageBuilder.getPublishedPage.data.id).toBe(initiallyCreatedPagesIds[0])
        );

        await getPublishedPage({ path: "/path-c" }).then(([res]) =>
            expect(res.data.pageBuilder.getPublishedPage.data.id).toBe(initiallyCreatedPagesIds[4])
        );
    });

    test("should be able to get an unpublished page by ID, with preview flag set to true", async () => {
        // This should fail, we must only be able to get a page for preview if exact ID was specified.
        await getPublishedPage({ path: "/path-z", preview: true }).then(([res]) =>
            expect(res.data.pageBuilder.getPublishedPage).toEqual({
                data: null,
                error: {
                    code: "NOT_FOUND",
                    data: null,
                    message: "Page not found."
                }
            })
        );

        // This should work.
        await getPublishedPage({ id: initiallyCreatedPagesIds[1], preview: true }).then(([res]) => {
            expect(res.data.pageBuilder.getPublishedPage.data.id).toBe(initiallyCreatedPagesIds[1]);
            expect(res.data.pageBuilder.getPublishedPage.data.status).toBe("draft");
        });
    });
});
