import useGqlHandler from "./useGqlHandler";

describe("getting published pages", () => {
    const {
        deleteElasticSearchIndex,
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
            const [response] = await createPage({ category: "category" });
            const { id } = response.data.pageBuilder.createPage.data;

            await updatePage({
                id,
                data: {
                    title: `page-${letters[i]}`,
                    url: `url-${letters[i]}`
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
            () => listPublishedPages({ sort: { createdOn: "desc" } }),
            ([res]) => res.data.pageBuilder.listPublishedPages.data[0].title === "page-c"
        );
    });

    test("getting published pages by full ID", async () => {
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
        await getPublishedPage({ url: "url-a" }).then(([res]) =>
            expect(res.data.pageBuilder.getPublishedPage.data.id).toBe(initiallyCreatedPagesIds[0])
        );

        await getPublishedPage({ url: "url-c" }).then(([res]) =>
            expect(res.data.pageBuilder.getPublishedPage.data.id).toBe(initiallyCreatedPagesIds[4])
        );
    });
});
