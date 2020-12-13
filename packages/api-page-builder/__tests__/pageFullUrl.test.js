import useGqlHandler from "./useGqlHandler";

describe("page full URL test", () => {
    const {
        deleteElasticSearchIndex,
        createCategory,
        createPage,
        updateSettings,
        listPages,
        updatePage,
        until
    } = useGqlHandler();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let initialCategory;

    beforeEach(async () => {
        await deleteElasticSearchIndex();
    });

    test("full URL must be returned correctly", async () => {
        await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        }).then(([res]) => (initialCategory = res.data.pageBuilder.createCategory.data));

        const letters = ["a", "z", "b"];
        for (let i = 0; i < letters.length; i++) {
            const [response] = await createPage({ category: "category" });
            const { id } = response.data.pageBuilder.createPage.data;
            await updatePage({
                id,
                data: {
                    title: `page-${letters[i]}`
                }
            });
        }

        await updateSettings({ data: { domain: "https://domain.com" } });

        await until(
            listPages,
            ([res]) => res.data.pageBuilder.listPages.data.length === 3
        ).then(([res]) =>
            expect(res.data.pageBuilder.listPages.data).toMatchObject([
                { fullUrl: /^https:\/\/domain.com\/some-url\/untitled-/ },
                { fullUrl: /^https:\/\/domain.com\/some-url\/untitled-/ },
                { fullUrl: /^https:\/\/domain.com\/some-url\/untitled-/ }
            ])
        );
    });
});
