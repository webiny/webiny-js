import useGqlHandler from "./useGqlHandler";

describe("publishing workflow", () => {
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

    let initialPages;

    beforeEach(async () => {
        initialPages = [];
        await deleteElasticSearchIndex();
        await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        });

        const letters = ["a", "z", "b"];
        for (let i = 0; i < letters.length; i++) {
            let letter = letters[i];

        }


        for (let i = 0; i < 3; i++) {
            const [response] = await createPage({ data: { category: "category" } });
            const { id } = response.data.pageBuilder.createPage.data;

            await updatePage({
                id,
                data: {
                    title: `page-${letters[i]}`
                }
            });

            initialPages.push(id);
        }

        await tryUntil(listPages, ([res]) => res.data.pageBuilder.listPages.data.length === 3);
    });

    test("only one page can be set as home, error, and not-found page", async () => {});
});
